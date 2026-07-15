import { supabase } from './supabase';
import { toISO } from './date';
import type { Activity, BibleReading, Completion, Module, NewActivity } from './types';

export interface Store {
  listModules(): Promise<Module[]>;
  createModule(m: Omit<Module, 'id' | 'created_at'>): Promise<Module>;
  updateModule(id: string, patch: Partial<Module>): Promise<void>;
  deleteModule(id: string): Promise<void>;

  listActivities(): Promise<Activity[]>;
  createActivity(a: NewActivity): Promise<Activity>;
  updateActivity(id: string, patch: Partial<Activity>): Promise<void>;
  deleteActivity(id: string): Promise<void>;

  listCompletions(): Promise<Completion[]>;
  addCompletion(activityId: string, date: string): Promise<Completion>;
  removeCompletion(activityId: string, date: string): Promise<void>;

  listBibleReading(): Promise<BibleReading[]>;
  addBibleChapter(bookId: string, chapter: number): Promise<BibleReading>;
  removeBibleChapter(bookId: string, chapter: number): Promise<void>;
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ─────────────────────────────────────────────────────────────
// Módulos padrão + amostras (modo demo / primeiro acesso)
// ─────────────────────────────────────────────────────────────
export const DEFAULT_MODULES: Omit<Module, 'id' | 'created_at' | 'user_id'>[] = [
  { name: 'Profissional', slug: 'profissional', color: '#6E8BFF', icon: 'briefcase', sort_order: 1 },
  { name: 'Intelectual', slug: 'intelectual', color: '#C9A961', icon: 'book', sort_order: 2 },
  { name: 'Pessoal', slug: 'pessoal', color: '#4ADE80', icon: 'heart', sort_order: 3 },
];

// ─────────────────────────────────────────────────────────────
// LocalStore — persistência 100% no navegador (modo demo)
// ─────────────────────────────────────────────────────────────
const LS_KEY = 'central_geral_demo_v1';

interface LocalDB {
  modules: Module[];
  activities: Activity[];
  completions: Completion[];
  bibleReading: BibleReading[];
}

function readDB(): LocalDB {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const db = JSON.parse(raw) as LocalDB;
      if (!db.bibleReading) db.bibleReading = []; // migração leve
      return db;
    }
  } catch {
    /* ignore */
  }
  return seedDB();
}

function writeDB(db: LocalDB) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

function seedDB(): LocalDB {
  const modules: Module[] = DEFAULT_MODULES.map((m) => ({ ...m, id: uid() }));
  const byslug = (s: string) => modules.find((m) => m.slug === s)!.id;
  const mk = (o: Partial<Activity> & { module_id: string; title: string }): Activity => ({
    id: uid(),
    notes: null,
    recurrence: 'fixed',
    days_of_week: [],
    date: null,
    time: null,
    duration_min: null,
    color: null,
    active: true,
    sort_order: 0,
    ...o,
  });
  const activities: Activity[] = [
    // Intelectual
    mk({ module_id: byslug('intelectual'), title: 'Filosofia', recurrence: 'fixed', days_of_week: [1, 3], duration_min: 60 }),
    mk({ module_id: byslug('intelectual'), title: 'Inglês', recurrence: 'fixed', days_of_week: [2, 4], duration_min: 45 }),
    mk({ module_id: byslug('intelectual'), title: 'Leitura Dirigida', recurrence: 'fixed', days_of_week: [1, 2, 3, 4, 5], duration_min: 40 }),
    // Profissional
    mk({ module_id: byslug('profissional'), title: 'Deep work — projeto principal', recurrence: 'fixed', days_of_week: [1, 2, 3, 4, 5], duration_min: 120 }),
    mk({ module_id: byslug('profissional'), title: 'Revisar métricas da semana', recurrence: 'fixed', days_of_week: [1], duration_min: 30 }),
    // Pessoal
    mk({ module_id: byslug('pessoal'), title: 'Academia', recurrence: 'fixed', days_of_week: [1, 2, 4, 5], duration_min: 60 }),
    mk({ module_id: byslug('pessoal'), title: 'Devocional', recurrence: 'fixed', days_of_week: [1, 2, 3, 4, 5], duration_min: 20 }),
    // Pontual — exemplo do dia (igual ao caso da lâmpada)
    mk({ module_id: byslug('pessoal'), title: 'Trocar lâmpada da cozinha', recurrence: 'once', date: toISO(), duration_min: 15 }),
  ];
  const db: LocalDB = { modules, activities, completions: [], bibleReading: [] };
  writeDB(db);
  return db;
}

class LocalStore implements Store {
  async listModules() {
    return readDB().modules.slice().sort((a, b) => a.sort_order - b.sort_order);
  }
  async createModule(m: Omit<Module, 'id' | 'created_at'>) {
    const db = readDB();
    const mod: Module = { ...m, id: uid() };
    db.modules.push(mod);
    writeDB(db);
    return mod;
  }
  async updateModule(id: string, patch: Partial<Module>) {
    const db = readDB();
    const i = db.modules.findIndex((x) => x.id === id);
    if (i >= 0) db.modules[i] = { ...db.modules[i], ...patch };
    writeDB(db);
  }
  async deleteModule(id: string) {
    const db = readDB();
    db.modules = db.modules.filter((x) => x.id !== id);
    const removed = db.activities.filter((a) => a.module_id === id).map((a) => a.id);
    db.activities = db.activities.filter((a) => a.module_id !== id);
    db.completions = db.completions.filter((c) => !removed.includes(c.activity_id));
    writeDB(db);
  }

  async listActivities() {
    return readDB().activities;
  }
  async createActivity(a: NewActivity) {
    const db = readDB();
    const act: Activity = {
      id: uid(),
      module_id: a.module_id,
      title: a.title,
      notes: a.notes ?? null,
      recurrence: a.recurrence,
      days_of_week: a.days_of_week ?? [],
      date: a.date ?? null,
      time: a.time ?? null,
      duration_min: a.duration_min ?? null,
      color: a.color ?? null,
      active: true,
      sort_order: 0,
    };
    db.activities.push(act);
    writeDB(db);
    return act;
  }
  async updateActivity(id: string, patch: Partial<Activity>) {
    const db = readDB();
    const i = db.activities.findIndex((x) => x.id === id);
    if (i >= 0) db.activities[i] = { ...db.activities[i], ...patch };
    writeDB(db);
  }
  async deleteActivity(id: string) {
    const db = readDB();
    db.activities = db.activities.filter((x) => x.id !== id);
    db.completions = db.completions.filter((c) => c.activity_id !== id);
    writeDB(db);
  }

  async listCompletions() {
    return readDB().completions;
  }
  async addCompletion(activityId: string, date: string) {
    const db = readDB();
    let c = db.completions.find((x) => x.activity_id === activityId && x.date === date);
    if (!c) {
      c = { id: uid(), activity_id: activityId, date };
      db.completions.push(c);
      writeDB(db);
    }
    return c;
  }
  async removeCompletion(activityId: string, date: string) {
    const db = readDB();
    db.completions = db.completions.filter((x) => !(x.activity_id === activityId && x.date === date));
    writeDB(db);
  }

  async listBibleReading() {
    return readDB().bibleReading;
  }
  async addBibleChapter(bookId: string, chapter: number) {
    const db = readDB();
    let r = db.bibleReading.find((x) => x.book_id === bookId && x.chapter === chapter);
    if (!r) {
      r = { id: uid(), book_id: bookId, chapter };
      db.bibleReading.push(r);
      writeDB(db);
    }
    return r;
  }
  async removeBibleChapter(bookId: string, chapter: number) {
    const db = readDB();
    db.bibleReading = db.bibleReading.filter((x) => !(x.book_id === bookId && x.chapter === chapter));
    writeDB(db);
  }
}

// ─────────────────────────────────────────────────────────────
// SupabaseStore — persistência na nuvem
// ─────────────────────────────────────────────────────────────
class SupabaseStore implements Store {
  private get sb() {
    if (!supabase) throw new Error('Supabase não configurado');
    return supabase;
  }

  async listModules() {
    const { data, error } = await this.sb.from('modules').select('*').order('sort_order');
    if (error) throw error;
    return (data ?? []) as Module[];
  }
  async createModule(m: Omit<Module, 'id' | 'created_at'>) {
    const { data, error } = await this.sb.from('modules').insert(m).select().single();
    if (error) throw error;
    return data as Module;
  }
  async updateModule(id: string, patch: Partial<Module>) {
    const { error } = await this.sb.from('modules').update(patch).eq('id', id);
    if (error) throw error;
  }
  async deleteModule(id: string) {
    const { error } = await this.sb.from('modules').delete().eq('id', id);
    if (error) throw error;
  }

  async listActivities() {
    const { data, error } = await this.sb.from('activities').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []) as Activity[];
  }
  async createActivity(a: NewActivity) {
    const payload = {
      module_id: a.module_id,
      title: a.title,
      notes: a.notes ?? null,
      recurrence: a.recurrence,
      days_of_week: a.days_of_week ?? [],
      date: a.date ?? null,
      time: a.time ?? null,
      duration_min: a.duration_min ?? null,
      color: a.color ?? null,
    };
    const { data, error } = await this.sb.from('activities').insert(payload).select().single();
    if (error) throw error;
    return data as Activity;
  }
  async updateActivity(id: string, patch: Partial<Activity>) {
    const { error } = await this.sb.from('activities').update(patch).eq('id', id);
    if (error) throw error;
  }
  async deleteActivity(id: string) {
    const { error } = await this.sb.from('activities').delete().eq('id', id);
    if (error) throw error;
  }

  async listCompletions() {
    const { data, error } = await this.sb.from('completions').select('*');
    if (error) throw error;
    return (data ?? []) as Completion[];
  }
  async addCompletion(activityId: string, date: string) {
    const { data, error } = await this.sb
      .from('completions')
      .upsert({ activity_id: activityId, date }, { onConflict: 'activity_id,date' })
      .select()
      .single();
    if (error) throw error;
    return data as Completion;
  }
  async removeCompletion(activityId: string, date: string) {
    const { error } = await this.sb
      .from('completions')
      .delete()
      .eq('activity_id', activityId)
      .eq('date', date);
    if (error) throw error;
  }

  async listBibleReading() {
    const { data, error } = await this.sb.from('bible_reading').select('*');
    if (error) throw error;
    return (data ?? []) as BibleReading[];
  }
  async addBibleChapter(bookId: string, chapter: number) {
    const { data, error } = await this.sb
      .from('bible_reading')
      .upsert({ book_id: bookId, chapter }, { onConflict: 'user_id,book_id,chapter' })
      .select()
      .single();
    if (error) throw error;
    return data as BibleReading;
  }
  async removeBibleChapter(bookId: string, chapter: number) {
    const { error } = await this.sb
      .from('bible_reading')
      .delete()
      .eq('book_id', bookId)
      .eq('chapter', chapter);
    if (error) throw error;
  }
}

export const store: Store = supabase ? new SupabaseStore() : new LocalStore();

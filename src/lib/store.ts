import { supabase } from './supabase';
import { toISO } from './date';
import type {
  Activity,
  BibleReading,
  Book,
  Completion,
  LessonLog,
  Module,
  NewActivity,
  NewBook,
  NewSubject,
  Subject,
} from './types';

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

  listSubjects(): Promise<Subject[]>;
  createSubject(s: NewSubject): Promise<Subject>;
  updateSubject(id: string, patch: Partial<Subject>): Promise<void>;
  deleteSubject(id: string): Promise<void>;

  listLessonLogs(): Promise<LessonLog[]>;
  addLessonLog(subjectId: string, date: string, durationMin: number | null): Promise<LessonLog>;
  removeLessonLog(id: string): Promise<void>;

  listBooks(): Promise<Book[]>;
  createBook(b: NewBook): Promise<Book>;
  updateBook(id: string, patch: Partial<Book>): Promise<void>;
  deleteBook(id: string): Promise<void>;
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ─────────────────────────────────────────────────────────────
// Módulos padrão + amostras (modo demo / primeiro acesso)
// ─────────────────────────────────────────────────────────────
export const DEFAULT_MODULES: Omit<Module, 'id' | 'created_at' | 'user_id'>[] = [
  { name: 'Pessoal', slug: 'pessoal', color: '#4ADE80', icon: 'heart', sort_order: 1 },
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
  subjects: Subject[];
  lessonLogs: LessonLog[];
  books: Book[];
}

function readDB(): LocalDB {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const db = JSON.parse(raw) as LocalDB;
      // migrações leves (dados antigos podem não ter campos novos)
      if (!db.bibleReading) db.bibleReading = [];
      if (!db.subjects) db.subjects = [];
      if (!db.lessonLogs) db.lessonLogs = [];
      if (!db.books) db.books = [];
      for (const s of db.subjects) {
        if (!s.kind) s.kind = 'estudo';
        if (!s.status) s.status = 'fila';
        if (s.weekly_goal === undefined) s.weekly_goal = null;
        if (s.target_date === undefined) s.target_date = null;
      }
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
    // Pessoal (hábitos do dia a dia)
    mk({ module_id: byslug('pessoal'), title: 'Academia', recurrence: 'fixed', days_of_week: [1, 2, 4, 5], duration_min: 60 }),
    mk({ module_id: byslug('pessoal'), title: 'Devocional', recurrence: 'fixed', days_of_week: [1, 2, 3, 4, 5], duration_min: 20 }),
    mk({ module_id: byslug('pessoal'), title: 'Meditar', recurrence: 'fixed', days_of_week: [0, 6], duration_min: 15 }),
    // Pontual — exemplo do dia (igual ao caso da lâmpada)
    mk({ module_id: byslug('pessoal'), title: 'Trocar lâmpada da cozinha', recurrence: 'once', date: toISO(), duration_min: 15 }),
  ];
  const mkSubj = (o: Partial<Subject> & { name: string; total_lessons: number }): Subject => ({
    id: uid(),
    kind: 'estudo',
    status: 'fila',
    module_id: null,
    color: null,
    notes: null,
    active: true,
    sort_order: 0,
    recurrence: 'none',
    days_of_week: [],
    study_date: null,
    weekly_goal: null,
    target_date: null,
    ...o,
  });
  // Composição do foco: 1 matéria + 2 cursos de carreira.
  const subjects: Subject[] = [
    mkSubj({ name: 'Filosofia', total_lessons: 100, sort_order: 0, status: 'foco', recurrence: 'fixed', days_of_week: [1, 3], weekly_goal: 5 }),
    mkSubj({ name: 'História Geral', total_lessons: 80, sort_order: 0, status: 'fila' }),
    mkSubj({ name: 'Inglês', total_lessons: 60, sort_order: 1, status: 'fila' }),
    mkSubj({ name: 'Geografia', total_lessons: 70, sort_order: 2, status: 'fila' }),
    mkSubj({ name: 'Redação', total_lessons: 40, sort_order: 3, status: 'fila' }),
    mkSubj({ name: 'Latim', total_lessons: 50, sort_order: 4, status: 'concluida' }),
    mkSubj({ name: 'Curso de Vendas', total_lessons: 40, sort_order: 0, kind: 'carreira', status: 'foco', recurrence: 'fixed', days_of_week: [2, 4], weekly_goal: 3 }),
    mkSubj({ name: 'Liderança & Gestão', total_lessons: 24, sort_order: 1, kind: 'carreira', status: 'foco', recurrence: 'fixed', days_of_week: [3, 5], weekly_goal: 2 }),
    mkSubj({ name: 'Excel Avançado', total_lessons: 30, sort_order: 2, kind: 'carreira', status: 'fila' }),
  ];
  const today = toISO();
  const lessonLogs: LessonLog[] = [
    { id: uid(), subject_id: subjects[0].id, date: today, duration_min: 50 },
    { id: uid(), subject_id: subjects[0].id, date: today, duration_min: 45 },
    { id: uid(), subject_id: subjects[1].id, date: today, duration_min: 60 },
  ];

  const books: Book[] = [
    { id: uid(), title: 'A República', author: 'Platão', total_chapters: 10, chapters_read: 4, notes: null, active: true, sort_order: 1 },
    { id: uid(), title: 'Hábitos Atômicos', author: 'James Clear', total_chapters: 20, chapters_read: 20, notes: null, active: true, sort_order: 2 },
    { id: uid(), title: 'Sapiens', author: 'Y. N. Harari', total_chapters: 20, chapters_read: 6, notes: null, active: true, sort_order: 3 },
  ];

  const db: LocalDB = { modules, activities, completions: [], bibleReading: [], subjects, lessonLogs, books };
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

  async listSubjects() {
    return readDB().subjects.slice().sort((a, b) => a.sort_order - b.sort_order);
  }
  async createSubject(s: NewSubject) {
    const db = readDB();
    const subj: Subject = {
      id: uid(),
      kind: s.kind ?? 'estudo',
      status: s.status ?? 'fila',
      module_id: s.module_id ?? null,
      name: s.name,
      total_lessons: s.total_lessons,
      color: s.color ?? null,
      notes: s.notes ?? null,
      active: true,
      sort_order: db.subjects.length + 1,
      recurrence: s.recurrence ?? 'none',
      days_of_week: s.days_of_week ?? [],
      study_date: s.study_date ?? null,
      weekly_goal: s.weekly_goal ?? null,
      target_date: s.target_date ?? null,
    };
    db.subjects.push(subj);
    writeDB(db);
    return subj;
  }
  async updateSubject(id: string, patch: Partial<Subject>) {
    const db = readDB();
    const i = db.subjects.findIndex((x) => x.id === id);
    if (i >= 0) db.subjects[i] = { ...db.subjects[i], ...patch };
    writeDB(db);
  }
  async deleteSubject(id: string) {
    const db = readDB();
    db.subjects = db.subjects.filter((x) => x.id !== id);
    db.lessonLogs = db.lessonLogs.filter((l) => l.subject_id !== id);
    writeDB(db);
  }

  async listLessonLogs() {
    return readDB().lessonLogs;
  }
  async addLessonLog(subjectId: string, date: string, durationMin: number | null) {
    const db = readDB();
    const log: LessonLog = { id: uid(), subject_id: subjectId, date, duration_min: durationMin };
    db.lessonLogs.push(log);
    writeDB(db);
    return log;
  }
  async removeLessonLog(id: string) {
    const db = readDB();
    db.lessonLogs = db.lessonLogs.filter((l) => l.id !== id);
    writeDB(db);
  }

  async listBooks() {
    return readDB().books.slice().sort((a, b) => a.sort_order - b.sort_order);
  }
  async createBook(b: NewBook) {
    const db = readDB();
    const book: Book = {
      id: uid(),
      title: b.title,
      author: b.author ?? null,
      total_chapters: b.total_chapters,
      chapters_read: b.chapters_read ?? 0,
      notes: b.notes ?? null,
      active: true,
      sort_order: db.books.length + 1,
    };
    db.books.push(book);
    writeDB(db);
    return book;
  }
  async updateBook(id: string, patch: Partial<Book>) {
    const db = readDB();
    const i = db.books.findIndex((x) => x.id === id);
    if (i >= 0) db.books[i] = { ...db.books[i], ...patch };
    writeDB(db);
  }
  async deleteBook(id: string) {
    const db = readDB();
    db.books = db.books.filter((x) => x.id !== id);
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

  async listSubjects() {
    const { data, error } = await this.sb.from('subjects').select('*').order('sort_order');
    if (error) throw error;
    return (data ?? []) as Subject[];
  }
  async createSubject(s: NewSubject) {
    const payload = {
      kind: s.kind ?? 'estudo',
      status: s.status ?? 'fila',
      module_id: s.module_id ?? null,
      name: s.name,
      total_lessons: s.total_lessons,
      color: s.color ?? null,
      notes: s.notes ?? null,
      recurrence: s.recurrence ?? 'none',
      days_of_week: s.days_of_week ?? [],
      study_date: s.study_date ?? null,
      weekly_goal: s.weekly_goal ?? null,
      target_date: s.target_date ?? null,
      // ordem crescente por criação (garante sort_order distinto p/ reordenar)
      sort_order: Math.floor(Date.now() / 1000) % 1000000,
    };
    const { data, error } = await this.sb.from('subjects').insert(payload).select().single();
    if (error) throw error;
    return data as Subject;
  }
  async updateSubject(id: string, patch: Partial<Subject>) {
    const { error } = await this.sb.from('subjects').update(patch).eq('id', id);
    if (error) throw error;
  }
  async deleteSubject(id: string) {
    const { error } = await this.sb.from('subjects').delete().eq('id', id);
    if (error) throw error;
  }

  async listLessonLogs() {
    const { data, error } = await this.sb.from('lesson_logs').select('*');
    if (error) throw error;
    return (data ?? []) as LessonLog[];
  }
  async addLessonLog(subjectId: string, date: string, durationMin: number | null) {
    const { data, error } = await this.sb
      .from('lesson_logs')
      .insert({ subject_id: subjectId, date, duration_min: durationMin })
      .select()
      .single();
    if (error) throw error;
    return data as LessonLog;
  }
  async removeLessonLog(id: string) {
    const { error } = await this.sb.from('lesson_logs').delete().eq('id', id);
    if (error) throw error;
  }

  async listBooks() {
    const { data, error } = await this.sb.from('books').select('*').order('sort_order');
    if (error) throw error;
    return (data ?? []) as Book[];
  }
  async createBook(b: NewBook) {
    const payload = {
      title: b.title,
      author: b.author ?? null,
      total_chapters: b.total_chapters,
      chapters_read: b.chapters_read ?? 0,
      notes: b.notes ?? null,
    };
    const { data, error } = await this.sb.from('books').insert(payload).select().single();
    if (error) throw error;
    return data as Book;
  }
  async updateBook(id: string, patch: Partial<Book>) {
    const { error } = await this.sb.from('books').update(patch).eq('id', id);
    if (error) throw error;
  }
  async deleteBook(id: string) {
    const { error } = await this.sb.from('books').delete().eq('id', id);
    if (error) throw error;
  }
}

export const store: Store = supabase ? new SupabaseStore() : new LocalStore();

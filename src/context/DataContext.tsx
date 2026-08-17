import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { store, DEFAULT_MODULES } from '../lib/store';
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
} from '../lib/types';
import { useAuth } from './AuthContext';

interface DataCtx {
  modules: Module[];
  activities: Activity[];
  completions: Completion[];
  bibleReading: BibleReading[];
  subjects: Subject[];
  lessonLogs: LessonLog[];
  books: Book[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addActivity: (a: NewActivity) => Promise<void>;
  updateActivity: (id: string, patch: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  toggleCompletion: (activityId: string, date: string) => Promise<void>;
  toggleBibleChapter: (bookId: string, chapter: number) => Promise<void>;
  addModule: (m: Omit<Module, 'id' | 'created_at'>) => Promise<void>;
  updateModule: (id: string, patch: Partial<Module>) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  addSubject: (s: NewSubject) => Promise<void>;
  updateSubject: (id: string, patch: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addLessonLog: (subjectId: string, date: string, durationMin: number | null) => Promise<void>;
  removeLessonLog: (id: string) => Promise<void>;
  addBook: (b: NewBook) => Promise<void>;
  updateBook: (id: string, patch: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
}

const Ctx = createContext<DataCtx>(null as unknown as DataCtx);
export const useData = () => useContext(Ctx);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [bibleReading, setBibleReading] = useState<BibleReading[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessonLogs, setLessonLogs] = useState<LessonLog[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let mods = await store.listModules();
      // Garante os módulos padrão mesmo se o trigger do Supabase não rodou.
      if (mods.length === 0) {
        for (const m of DEFAULT_MODULES) await store.createModule(m);
        mods = await store.listModules();
      }
      const [acts, comps] = await Promise.all([store.listActivities(), store.listCompletions()]);
      setModules(mods);
      setActivities(acts);
      setCompletions(comps);
      // Tabelas opcionais (Leitura Bíblica, Matérias): se ainda não existem no
      // Supabase, NÃO podem derrubar o carregamento dos módulos e atividades.
      try {
        setBibleReading(await store.listBibleReading());
      } catch {
        setBibleReading([]);
      }
      try {
        const [subs, logs] = await Promise.all([store.listSubjects(), store.listLessonLogs()]);
        setSubjects(subs);
        setLessonLogs(logs);
      } catch {
        setSubjects([]);
        setLessonLogs([]);
      }
      try {
        setBooks(await store.listBooks());
      } catch {
        setBooks([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
    else {
      setModules([]);
      setActivities([]);
      setCompletions([]);
      setBibleReading([]);
      setSubjects([]);
      setLessonLogs([]);
      setBooks([]);
      setLoading(false);
    }
  }, [user, refresh]);

  const addActivity = async (a: NewActivity) => {
    const created = await store.createActivity(a);
    setActivities((prev) => [...prev, created]);
  };
  const updateActivity = async (id: string, patch: Partial<Activity>) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    await store.updateActivity(id, patch);
  };
  const deleteActivity = async (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setCompletions((prev) => prev.filter((c) => c.activity_id !== id));
    await store.deleteActivity(id);
  };

  const toggleCompletion = async (activityId: string, date: string) => {
    const exists = completions.some((c) => c.activity_id === activityId && c.date === date);
    if (exists) {
      setCompletions((prev) => prev.filter((c) => !(c.activity_id === activityId && c.date === date)));
      await store.removeCompletion(activityId, date);
    } else {
      const created = await store.addCompletion(activityId, date);
      setCompletions((prev) => [...prev.filter((c) => !(c.activity_id === activityId && c.date === date)), created]);
    }
  };

  const toggleBibleChapter = async (bookId: string, chapter: number) => {
    const exists = bibleReading.some((b) => b.book_id === bookId && b.chapter === chapter);
    if (exists) {
      setBibleReading((prev) => prev.filter((b) => !(b.book_id === bookId && b.chapter === chapter)));
      await store.removeBibleChapter(bookId, chapter);
    } else {
      const created = await store.addBibleChapter(bookId, chapter);
      setBibleReading((prev) => [
        ...prev.filter((b) => !(b.book_id === bookId && b.chapter === chapter)),
        created,
      ]);
    }
  };

  const addSubject = async (s: NewSubject) => {
    const created = await store.createSubject(s);
    setSubjects((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
  };
  const updateSubject = async (id: string, patch: Partial<Subject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    await store.updateSubject(id, patch);
  };
  const deleteSubject = async (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setLessonLogs((prev) => prev.filter((l) => l.subject_id !== id));
    await store.deleteSubject(id);
  };
  const addLessonLog = async (subjectId: string, date: string, durationMin: number | null) => {
    const created = await store.addLessonLog(subjectId, date, durationMin);
    setLessonLogs((prev) => [...prev, created]);
  };
  const removeLessonLog = async (id: string) => {
    setLessonLogs((prev) => prev.filter((l) => l.id !== id));
    await store.removeLessonLog(id);
  };

  const addBook = async (b: NewBook) => {
    const created = await store.createBook(b);
    setBooks((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
  };
  const updateBook = async (id: string, patch: Partial<Book>) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    await store.updateBook(id, patch);
  };
  const deleteBook = async (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    await store.deleteBook(id);
  };

  const addModule = async (m: Omit<Module, 'id' | 'created_at'>) => {
    const created = await store.createModule(m);
    setModules((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
  };
  const updateModule = async (id: string, patch: Partial<Module>) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    await store.updateModule(id, patch);
  };
  const deleteModule = async (id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
    setActivities((prev) => prev.filter((a) => a.module_id !== id));
    await store.deleteModule(id);
  };

  return (
    <Ctx.Provider
      value={{
        modules,
        activities,
        completions,
        bibleReading,
        subjects,
        lessonLogs,
        books,
        loading,
        error,
        refresh,
        addActivity,
        updateActivity,
        deleteActivity,
        toggleCompletion,
        toggleBibleChapter,
        addModule,
        updateModule,
        deleteModule,
        addSubject,
        updateSubject,
        deleteSubject,
        addLessonLog,
        removeLessonLog,
        addBook,
        updateBook,
        deleteBook,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

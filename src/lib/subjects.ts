import type { LessonLog, Subject } from './types';
import { addDays, pct, toISO } from './date';

export interface SubjectStats {
  done: number;
  total: number;
  pct: number;
  remaining: number;
  hours: number;
  lastDate: string | null;
  /** aulas por semana (média das últimas 4 semanas) */
  pace: number;
  /** semanas estimadas para concluir (null se sem ritmo) */
  etaWeeks: number | null;
  completed: boolean;
}

function logsOf(logs: LessonLog[], subjectId: string) {
  return logs.filter((l) => l.subject_id === subjectId);
}

export function subjectStats(subject: Subject, logs: LessonLog[]): SubjectStats {
  const mine = logsOf(logs, subject.id);
  const done = mine.length;
  const total = subject.total_lessons || 0;
  const remaining = Math.max(0, total - done);
  const hours = mine.reduce((a, l) => a + (l.duration_min || 0), 0) / 60;
  const lastDate = mine.length ? mine.map((l) => l.date).sort().slice(-1)[0] : null;

  // ritmo: aulas registradas nos últimos 28 dias / 4 semanas
  const cutoff = addDays(toISO(), -28);
  const recent = mine.filter((l) => l.date >= cutoff).length;
  const pace = recent / 4;
  const etaWeeks = pace > 0 && remaining > 0 ? Math.ceil(remaining / pace) : null;

  return {
    done,
    total,
    pct: Math.min(100, pct(done, total)),
    remaining,
    hours,
    lastDate,
    pace,
    etaWeeks,
    completed: total > 0 && done >= total,
  };
}

export interface OverallStudyStats {
  totalDone: number;
  totalTarget: number;
  pct: number;
  hours: number;
  completedSubjects: number;
  activeSubjects: number;
  lessonsThisWeek: number;
}

export function overallStudyStats(subjects: Subject[], logs: LessonLog[]): OverallStudyStats {
  const active = subjects.filter((s) => s.active);
  const totalDone = active.reduce((a, s) => a + logsOf(logs, s.id).length, 0);
  const totalTarget = active.reduce((a, s) => a + (s.total_lessons || 0), 0);
  const hours = logs.reduce((a, l) => a + (l.duration_min || 0), 0) / 60;
  const completedSubjects = active.filter((s) => {
    const done = logsOf(logs, s.id).length;
    return s.total_lessons > 0 && done >= s.total_lessons;
  }).length;

  const weekAgo = addDays(toISO(), -7);
  const lessonsThisWeek = logs.filter((l) => l.date >= weekAgo).length;

  return {
    totalDone,
    totalTarget,
    pct: Math.min(100, pct(totalDone, totalTarget)),
    hours,
    completedSubjects,
    activeSubjects: active.length,
    lessonsThisWeek,
  };
}

/** Aulas por semana nas últimas `weeks` semanas (para mini-gráfico de ritmo). */
export function weeklyPace(subjectId: string, logs: LessonLog[], weeks = 8): number[] {
  const mine = logsOf(logs, subjectId);
  const out: number[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const end = addDays(toISO(), -w * 7);
    const start = addDays(end, -6);
    out.push(mine.filter((l) => l.date >= start && l.date <= end).length);
  }
  return out;
}

/** Duração média de uma aula em minutos (para prever tempo restante). */
export function avgLessonMinutes(subjectId: string, logs: LessonLog[]): number {
  const withDur = logsOf(logs, subjectId).filter((l) => l.duration_min);
  if (!withDur.length) return 0;
  return Math.round(withDur.reduce((a, l) => a + (l.duration_min || 0), 0) / withDur.length);
}

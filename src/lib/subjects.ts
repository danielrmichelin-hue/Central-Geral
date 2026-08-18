import type { LessonLog, Subject } from './types';
import { addDays, addWeeks, pct, toISO, weekdayOf, weeksBetween } from './date';

/** Composição fixa do foco: 1 matéria + 2 cursos de carreira. */
export const FOCUS_LIMITS: Record<import('./types').SubjectKind, number> = { estudo: 1, carreira: 2 };
/** Total de vagas de foco (soma dos limites por área). */
export const FOCUS_LIMIT = FOCUS_LIMITS.estudo + FOCUS_LIMITS.carreira; // 3
/** Ritmo assumido (aulas/semana) quando não há meta nem histórico — usado no roadmap. */
export const DEFAULT_WEEKLY = 5;

/** A matéria tem estudo agendado nesta data (ISO)? Só conta as que estão em foco. */
export function subjectOnDate(s: Subject, iso: string): boolean {
  if (!s.active || s.status !== 'foco') return false;
  if (s.recurrence === 'fixed') return s.days_of_week.includes(weekdayOf(iso));
  if (s.recurrence === 'once') return s.study_date === iso;
  return false;
}

export function subjectsForDate(subjects: Subject[], iso: string): Subject[] {
  return subjects.filter((s) => subjectOnDate(s, iso));
}

/** Foi estudada (pelo menos uma aula registrada) nesta data? */
export function studiedOn(subjectId: string, logs: LessonLog[], iso: string): boolean {
  return logs.some((l) => l.subject_id === subjectId && l.date === iso);
}

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

/** A aula registrada mais recentemente de uma matéria (para o botão "− aula"). */
export function lastLessonLog(subjectId: string, logs: LessonLog[]): LessonLog | undefined {
  const mine = logs.filter((l) => l.subject_id === subjectId);
  if (!mine.length) return undefined;
  const withTs = mine.filter((l) => l.created_at);
  if (withTs.length) {
    return withTs.reduce((a, b) => ((a.created_at as string) > (b.created_at as string) ? a : b));
  }
  return mine[mine.length - 1];
}

/** Aulas registradas nesta semana (últimos 7 dias) para a matéria. */
export function lessonsThisWeek(subjectId: string, logs: LessonLog[]): number {
  const weekAgo = addDays(toISO(), -6);
  return logs.filter((l) => l.subject_id === subjectId && l.date >= weekAgo).length;
}

export type Farol = 'sem-meta' | 'adiantado' | 'no-ritmo' | 'atrasado';

export interface SubjectPlan {
  /** aulas/semana que a meta exige (de weekly_goal ou derivado da data-alvo) */
  requiredWeekly: number | null;
  /** previsão de término (ISO) no ritmo atual/meta */
  projectedEnd: string | null;
  /** ritmo real recente (aulas/semana) */
  pace: number;
  farol: Farol;
  weekDone: number;
}

/**
 * Plano de conclusão da matéria combinando meta de ritmo (weekly_goal) e/ou
 * data-alvo (target_date) com o ritmo real recente.
 */
export function subjectPlan(subject: Subject, logs: LessonLog[]): SubjectPlan {
  const st = subjectStats(subject, logs);
  const remaining = st.remaining;
  const today = toISO();

  // ritmo exigido: prioridade para weekly_goal; senão deriva da data-alvo
  let requiredWeekly: number | null = subject.weekly_goal ?? null;
  if (!requiredWeekly && subject.target_date && remaining > 0) {
    const wks = Math.max(0.2, weeksBetween(today, subject.target_date));
    requiredWeekly = Math.ceil(remaining / wks);
  }

  // previsão de término
  let projectedEnd: string | null = null;
  if (remaining <= 0) {
    projectedEnd = st.lastDate;
  } else {
    const rate = requiredWeekly ?? (st.pace > 0 ? st.pace : null);
    if (rate && rate > 0) projectedEnd = addWeeks(today, remaining / rate);
    else if (subject.target_date) projectedEnd = subject.target_date;
  }

  // farol: compara ritmo real com o exigido
  let farol: Farol = 'sem-meta';
  if (requiredWeekly && requiredWeekly > 0 && remaining > 0) {
    if (st.pace >= requiredWeekly) farol = 'adiantado';
    else if (st.pace >= requiredWeekly * 0.8) farol = 'no-ritmo';
    else farol = 'atrasado';
  }

  return {
    requiredWeekly,
    projectedEnd,
    pace: st.pace,
    farol,
    weekDone: lessonsThisWeek(subject.id, logs),
  };
}

export interface RoadmapItem {
  subject: Subject;
  startISO: string;
  endISO: string;
  weeks: number;
  lane: number;
}

/**
 * Projeta a linha do tempo dos ciclos: matérias em foco começam agora; as da
 * fila entram numa das `lanes` trilhas assim que uma vaga abre. O ritmo de cada
 * matéria é weekly_goal → ritmo real → DEFAULT_WEEKLY (nessa ordem).
 */
export function buildRoadmap(
  subjects: Subject[],
  logs: LessonLog[],
  lanes = FOCUS_LIMIT,
): { items: RoadmapItem[]; endISO: string | null } {
  const today = toISO();
  const weeksFor = (s: Subject) => {
    const st = subjectStats(s, logs);
    if (st.remaining <= 0) return 0;
    // Ritmo de planejamento: a meta semanal, ou o padrão. (Não usa o ritmo
    // residual — uma matéria na fila com 1 aula solta distorceria a projeção.)
    const rate = s.weekly_goal && s.weekly_goal > 0 ? s.weekly_goal : DEFAULT_WEEKLY;
    return Math.max(0.2, st.remaining / rate);
  };

  // ordena: em foco primeiro, depois fila — ambos por sort_order
  const rank = (s: Subject) => (s.status === 'foco' ? 0 : 1);
  const queue = subjects
    .filter((s) => s.active && s.status !== 'concluida')
    .sort((a, b) => rank(a) - rank(b) || a.sort_order - b.sort_order);

  // cada trilha guarda a data (em semanas a partir de hoje) em que fica livre
  const laneFreeAt = Array.from({ length: Math.max(1, lanes) }, () => 0);
  const items: RoadmapItem[] = [];
  let maxWeeks = 0;

  for (const s of queue) {
    const dur = weeksFor(s);
    // escolhe a trilha que libera mais cedo
    let lane = 0;
    for (let i = 1; i < laneFreeAt.length; i++) if (laneFreeAt[i] < laneFreeAt[lane]) lane = i;
    const startW = laneFreeAt[lane];
    const endW = startW + dur;
    laneFreeAt[lane] = endW;
    maxWeeks = Math.max(maxWeeks, endW);
    items.push({
      subject: s,
      startISO: addWeeks(today, startW),
      endISO: addWeeks(today, endW),
      weeks: dur,
      lane,
    });
  }

  return { items, endISO: items.length ? addWeeks(today, maxWeeks) : null };
}

export interface RoadmapLane {
  kind: import('./types').SubjectKind;
  label: string;
  items: RoadmapItem[];
}

/**
 * Roadmap com a composição fixa do foco: 1 trilha de Matéria + 2 de Carreira.
 * Cada área é simulada com seu próprio número de trilhas e respeita a ordem
 * (foco primeiro, depois a fila por sort_order).
 */
export function buildFocusRoadmap(
  subjects: Subject[],
  logs: LessonLog[],
): { lanes: RoadmapLane[]; endISO: string | null } {
  const mat = buildRoadmap(
    subjects.filter((s) => (s.kind ?? 'estudo') === 'estudo'),
    logs,
    FOCUS_LIMITS.estudo,
  );
  const car = buildRoadmap(
    subjects.filter((s) => (s.kind ?? 'estudo') === 'carreira'),
    logs,
    FOCUS_LIMITS.carreira,
  );

  const lanes: RoadmapLane[] = [];
  for (let i = 0; i < FOCUS_LIMITS.estudo; i++) {
    lanes.push({ kind: 'estudo', label: 'Matéria', items: mat.items.filter((it) => it.lane === i) });
  }
  for (let i = 0; i < FOCUS_LIMITS.carreira; i++) {
    lanes.push({ kind: 'carreira', label: 'Carreira', items: car.items.filter((it) => it.lane === i) });
  }

  const ends = [mat.endISO, car.endISO].filter(Boolean) as string[];
  const endISO = ends.length ? ends.sort().slice(-1)[0] : null;
  return { lanes, endISO };
}

/** Duração média de uma aula em minutos (para prever tempo restante). */
export function avgLessonMinutes(subjectId: string, logs: LessonLog[]): number {
  const withDur = logsOf(logs, subjectId).filter((l) => l.duration_min);
  if (!withDur.length) return 0;
  return Math.round(withDur.reduce((a, l) => a + (l.duration_min || 0), 0) / withDur.length);
}

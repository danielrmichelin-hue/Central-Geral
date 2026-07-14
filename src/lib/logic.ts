import type { Activity, Completion } from './types';
import { weekdayOf } from './date';

/** A atividade acontece nesta data (ISO)? */
export function activityOnDate(a: Activity, iso: string): boolean {
  if (!a.active) return false;
  if (a.recurrence === 'once') return a.date === iso;
  return a.days_of_week.includes(weekdayOf(iso));
}

/** Atividades que caem em uma data. */
export function activitiesForDate(activities: Activity[], iso: string): Activity[] {
  return activities.filter((a) => activityOnDate(a, iso));
}

export function isDone(completions: Completion[], activityId: string, iso: string): boolean {
  return completions.some((c) => c.activity_id === activityId && c.date === iso);
}

/** Streak de dias consecutivos com pelo menos 1 conclusão (pula fim de semana sem nada). */
export function computeStreak(completions: Completion[]): number {
  const done = new Set(completions.map((c) => c.date));
  let count = 0;
  const d = new Date();
  let first = true;
  for (let i = 0; i < 400; i++) {
    const iso =
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const wd = d.getDay();
    const active = done.has(iso);
    const weekend = wd === 0 || wd === 6;
    if (active) count++;
    else if (weekend) {
      /* ponte de fim de semana: não quebra */
    } else if (first) {
      /* hoje ainda em curso */
    } else break;
    first = false;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

// ─────────────────────────────────────────────────────────────
// Modelo de dados da Central Geral
// ─────────────────────────────────────────────────────────────

export type Recurrence = 'fixed' | 'once';

/** Um módulo = uma área da vida (Profissional, Intelectual, Pessoal...) */
export interface Module {
  id: string;
  user_id?: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at?: string;
}

/** Uma atividade/matéria dentro de um módulo. */
export interface Activity {
  id: string;
  user_id?: string;
  module_id: string;
  title: string;
  notes: string | null;
  /** 'fixed' = repete toda semana nos dias marcados. 'once' = única em uma data. */
  recurrence: Recurrence;
  /** Para 'fixed': dias da semana (0=Dom ... 6=Sáb). */
  days_of_week: number[];
  /** Para 'once': data 'YYYY-MM-DD'. */
  date: string | null;
  /** Horário opcional 'HH:MM'. */
  time: string | null;
  duration_min: number | null;
  /** Cor opcional; se null herda a cor do módulo. */
  color: string | null;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

/** Marca uma atividade como concluída em uma data específica. */
export interface Completion {
  id: string;
  user_id?: string;
  activity_id: string;
  date: string;
  created_at?: string;
}

export interface NewActivity {
  module_id: string;
  title: string;
  notes?: string | null;
  recurrence: Recurrence;
  days_of_week?: number[];
  date?: string | null;
  time?: string | null;
  duration_min?: number | null;
  color?: string | null;
}

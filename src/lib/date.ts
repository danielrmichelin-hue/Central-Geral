// ─────────────────────────────────────────────────────────────
// Helpers de data (leves, sem dependências)
// ─────────────────────────────────────────────────────────────

export const WD = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const WD3 = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const MES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
export const MES3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** 'YYYY-MM-DD' no fuso local (não UTC — evita bug de virada de dia). */
export function toISO(d = new Date()): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function weekdayOf(iso: string): number {
  return parseISO(iso).getDay();
}

export function fmtShort(iso: string): string {
  const d = parseISO(iso);
  return d.getDate() + ' ' + MES3[d.getMonth()];
}

export function fmtLong(iso: string): string {
  const d = parseISO(iso);
  return `${WD[d.getDay()]}, ${d.getDate()} de ${MES[d.getMonth()]}`;
}

export function fmtMin(m: number | null | undefined): string {
  if (!m) return '';
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h}h${r}` : `${h}h`;
  }
  return m + 'min';
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Segunda a domingo da semana que contém `iso`. */
export function weekDays(iso: string): string[] {
  const d = parseISO(iso);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // segunda como início
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    return toISO(x);
  });
}

export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function pct(a: number, b: number): number {
  return b ? Math.round((a / b) * 100) : 0;
}

export function isToday(iso: string): boolean {
  return iso === toISO();
}

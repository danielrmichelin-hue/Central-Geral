import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { buildFocusRoadmap, DEFAULT_WEEKLY } from '../lib/subjects';
import { MES3, fmtMonthYear, parseISO, toISO, weeksBetween } from '../lib/date';
import type { Subject } from '../lib/types';

export function RoadmapPage() {
  const { subjects, lessonLogs, modules } = useData();
  const { lanes, endISO } = useMemo(() => buildFocusRoadmap(subjects, lessonLogs), [subjects, lessonLogs]);

  const colorOf = (s: Subject) =>
    s.color || (s.module_id ? modules.find((m) => m.id === s.module_id)?.color : undefined) || 'var(--accent)';

  const today = toISO();
  const totalWeeks = endISO ? Math.max(1, weeksBetween(today, endISO)) : 1;
  const posOf = (iso: string) => Math.max(0, Math.min(100, (weeksBetween(today, iso) / totalWeeks) * 100));
  const allItems = lanes.flatMap((l) => l.items);

  // faixas de ano (visão "por ano")
  const years: { year: number; left: number; width: number }[] = [];
  if (endISO) {
    const y0 = parseISO(today).getFullYear();
    const y1 = parseISO(endISO).getFullYear();
    for (let y = y0; y <= y1; y++) {
      const start = y === y0 ? today : `${y}-01-01`;
      const end = y === y1 ? endISO : `${y}-12-31`;
      years.push({ year: y, left: posOf(start), width: posOf(end) - posOf(start) });
    }
  }
  // gridlines por trimestre
  const ticks: { pos: number; label: string }[] = [];
  if (endISO) {
    const s = parseISO(today);
    let m = new Date(s.getFullYear(), s.getMonth(), 1);
    const e = parseISO(endISO);
    while (m <= e) {
      if (m.getMonth() % 3 === 0) {
        const iso = toISO(m);
        ticks.push({ pos: posOf(iso), label: MES3[m.getMonth()] });
      }
      m = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    }
  }

  const laneColor = (kind: string) => (kind === 'carreira' ? 'var(--gold)' : 'var(--accent)');

  return (
    <>
      <div className="mb-5">
        <div className="font-serif text-2xl font-semibold">Roadmap</div>
        <p className="mt-1 text-[13px] text-ink-muted">
          Foco fixo: <b>1 matéria + 2 cursos</b> em paralelo, até concluir. A ordem da fila (nas telas Matérias e
          Carreira) define a sequência abaixo.
        </p>
      </div>

      {allItems.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center text-ink-muted">
          <div className="mb-2 text-3xl opacity-40">🗺️</div>
          Sem matérias/cursos em andamento. Coloque em foco ou na fila para ver a projeção.
        </div>
      ) : (
        <>
          <div className="card mb-5">
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
              <div>
                <div className="eyebrow">Conclusão prevista de tudo</div>
                <div className="my-0.5 font-serif text-xl font-semibold">{endISO ? fmtMonthYear(endISO) : '—'}</div>
                <div className="text-[13px] text-ink-muted">{allItems.length} na trilha · 1 matéria + 2 cursos em paralelo</div>
              </div>
              <p className="max-w-sm text-[12px] text-ink-muted">
                Projeção pelo ritmo de cada item (meta semanal → ritmo real → {DEFAULT_WEEKLY}/sem quando não há dados).
                Ajuste metas e a ordem da fila para refinar.
              </p>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <div className="min-w-[720px]">
              {/* faixa de anos */}
              <div className="relative mb-1 h-6">
                {years.map((y) => (
                  <div
                    key={y.year}
                    className="absolute top-0 flex h-6 items-center justify-center border-l border-line-strong"
                    style={{ left: `${y.left}%`, width: `${y.width}%` }}
                  >
                    <span className="text-[12px] font-semibold tracking-wide text-ink">{y.year}</span>
                  </div>
                ))}
              </div>
              {/* trimestres */}
              <div className="relative mb-2 h-4 border-b border-line">
                {ticks.map((t, i) => (
                  <span key={i} className="absolute top-0 pl-1 text-[9px] uppercase tracking-wide text-faint" style={{ left: `${t.pos}%` }}>
                    {t.label}
                  </span>
                ))}
              </div>

              {/* trilhas */}
              <div className="space-y-2">
                {lanes.map((lane, li) => (
                  <div key={li} className="flex items-center gap-3">
                    <div className="flex w-[68px] flex-shrink-0 items-center gap-1.5 text-[11px] font-semibold text-ink-muted">
                      <span className="h-2 w-2 rounded-full" style={{ background: laneColor(lane.kind) }} />
                      {lane.label}
                    </div>
                    <div className="relative h-11 flex-1 rounded-sm bg-surface-2/50">
                      {years.map((y) => (
                        <div key={y.year} className="absolute top-0 h-full w-px bg-line/70" style={{ left: `${y.left}%` }} />
                      ))}
                      {lane.items.map((it) => {
                        const c = colorOf(it.subject);
                        const left = posOf(it.startISO);
                        const width = Math.max(2.5, posOf(it.endISO) - left);
                        return (
                          <div
                            key={it.subject.id}
                            className="absolute top-1 flex h-9 items-center overflow-hidden rounded-md px-2"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              background: `color-mix(in srgb, ${c} 26%, var(--surface))`,
                              borderLeft: `3px solid ${c}`,
                            }}
                            title={`${it.subject.name} · ${fmtMonthYear(it.startISO)} → ${fmtMonthYear(it.endISO)} (~${Math.ceil(it.weeks)} sem)`}
                          >
                            <span className="truncate text-[12px] font-semibold">{it.subject.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* conclusão por item */}
              <div className="mt-4 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {[...allItems]
                  .sort((a, b) => a.endISO.localeCompare(b.endISO))
                  .map((it) => (
                    <div key={it.subject.id} className="flex items-center gap-2 text-[12px]">
                      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: colorOf(it.subject) }} />
                      <span className="flex-1 truncate">{it.subject.name}</span>
                      <span className="font-mono text-ink-muted">{fmtMonthYear(it.endISO)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

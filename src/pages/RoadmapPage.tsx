import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { buildRoadmap, DEFAULT_WEEKLY, FOCUS_LIMIT } from '../lib/subjects';
import { MES3, fmtMonthYear, parseISO, toISO, weeksBetween } from '../lib/date';
import type { Subject, SubjectKind } from '../lib/types';

const KIND_LABEL: Record<SubjectKind, string> = { estudo: 'Matérias', carreira: 'Carreira' };

export function RoadmapPage() {
  const { subjects, lessonLogs, modules } = useData();
  const [kind, setKind] = useState<SubjectKind>('estudo');

  const ofKind = useMemo(() => subjects.filter((s) => (s.kind ?? 'estudo') === kind), [subjects, kind]);
  const { items, endISO } = useMemo(() => buildRoadmap(ofKind, lessonLogs), [ofKind, lessonLogs]);

  const colorOf = (s: Subject) =>
    s.color || (s.module_id ? modules.find((m) => m.id === s.module_id)?.color : undefined) || 'var(--accent)';

  const today = toISO();
  const totalWeeks = endISO ? Math.max(1, weeksBetween(today, endISO)) : 1;

  // marcos de mês
  const ticks: { pos: number; label: string }[] = [];
  if (endISO) {
    const start = parseISO(today);
    let m = new Date(start.getFullYear(), start.getMonth(), 1);
    const end = parseISO(endISO);
    while (m <= end) {
      const iso = toISO(m);
      const pos = (weeksBetween(today, iso) / totalWeeks) * 100;
      if (pos >= -2 && pos <= 102) ticks.push({ pos: Math.max(0, Math.min(100, pos)), label: `${MES3[m.getMonth()]}` });
      m = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    }
  }

  const lanes = Array.from({ length: FOCUS_LIMIT }, (_, i) => items.filter((it) => it.lane === i));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-serif text-2xl font-semibold">Roadmap</div>
          <p className="mt-1 text-[13px] text-ink-muted">
            Sua trilha de estudo em foco: {FOCUS_LIMIT} por vez, até concluir. Veja quando cada uma termina.
          </p>
        </div>
        <div className="inline-flex gap-1 rounded-sm border border-line bg-surface p-1">
          {(['estudo', 'carreira'] as SubjectKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-[6px] px-3 py-1.5 text-[12.5px] font-semibold transition ${
                kind === k ? 'bg-surface-3 text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center text-ink-muted">
          <div className="mb-2 text-3xl opacity-40">🗺️</div>
          Sem matérias em andamento. Adicione matérias (em foco ou na fila) para ver a projeção.
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="card mb-5">
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
              <div>
                <div className="eyebrow">Conclusão prevista de tudo</div>
                <div className="my-0.5 font-serif text-xl font-semibold">
                  {endISO ? fmtMonthYear(endISO) : '—'}
                </div>
                <div className="text-[13px] text-ink-muted">
                  {items.length} {KIND_LABEL[kind].toLowerCase()} na trilha · {FOCUS_LIMIT} em paralelo
                </div>
              </div>
              <p className="max-w-sm text-[12px] text-ink-muted">
                Projeção pelo ritmo de cada matéria (meta semanal → ritmo real → {DEFAULT_WEEKLY}/sem quando não há
                dados). Ajuste as metas nas matérias para refinar.
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="card overflow-x-auto">
            <div className="min-w-[680px]">
              {/* eixo de meses */}
              <div className="relative mb-2 h-5 border-b border-line">
                {ticks.map((t, i) => (
                  <div
                    key={i}
                    className="absolute top-0 flex h-5 flex-col items-start"
                    style={{ left: `${t.pos}%` }}
                  >
                    <span className="whitespace-nowrap pl-1 text-[10px] uppercase tracking-wide text-faint">{t.label}</span>
                  </div>
                ))}
              </div>

              {/* trilhas */}
              <div className="space-y-2">
                {lanes.map((laneItems, li) => (
                  <div key={li} className="relative h-11 rounded-sm bg-surface-2/50">
                    {/* linhas de mês */}
                    {ticks.map((t, i) => (
                      <div key={i} className="absolute top-0 h-full w-px bg-line/60" style={{ left: `${t.pos}%` }} />
                    ))}
                    {laneItems.map((it) => {
                      const left = (weeksBetween(today, it.startISO) / totalWeeks) * 100;
                      const width = Math.max(3, (it.weeks / totalWeeks) * 100);
                      const c = colorOf(it.subject);
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
                          title={`${it.subject.name} · ${it.startISO ? fmtMonthYear(it.startISO) : ''} → ${fmtMonthYear(it.endISO)} (~${Math.ceil(it.weeks)} sem)`}
                        >
                          <span className="truncate text-[12px] font-semibold">{it.subject.name}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* legenda de conclusão por item */}
              <div className="mt-4 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {[...items]
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

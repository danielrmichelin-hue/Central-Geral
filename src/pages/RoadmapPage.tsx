import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { buildRoadmap, DEFAULT_WEEKLY, FOCUS_LIMIT, subjectStats } from '../lib/subjects';
import { Icon } from '../lib/icons';
import { MES3, fmtMonthYear, fmtShort, parseISO, toISO, weeksBetween } from '../lib/date';
import type { Subject } from '../lib/types';

export function RoadmapPage() {
  const { subjects, lessonLogs, modules, updateSubject } = useData();

  const kindColor = (s: Subject) => (s.kind === 'carreira' ? 'var(--gold)' : 'var(--accent)');
  const colorOf = (s: Subject) =>
    s.color || (s.module_id ? modules.find((m) => m.id === s.module_id)?.color : undefined) || kindColor(s);

  const active = useMemo(
    () => subjects.filter((s) => s.active && s.status !== 'concluida'),
    [subjects],
  );
  const byOrder = (a: Subject, b: Subject) => a.sort_order - b.sort_order;
  const foco = active.filter((s) => s.status === 'foco').sort(byOrder);
  const fila = active.filter((s) => s.status === 'fila').sort(byOrder);
  const totalFoco = foco.length;

  const { items, endISO } = useMemo(() => buildRoadmap(subjects, lessonLogs, FOCUS_LIMIT), [subjects, lessonLogs]);

  // ---- organizador ----
  const reindex = (newFila: Subject[]) => {
    const ordered = [...foco, ...newFila];
    ordered.forEach((s, i) => {
      if (s.sort_order !== i) updateSubject(s.id, { sort_order: i });
    });
  };
  const moveFila = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= fila.length) return;
    const arr = [...fila];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    reindex(arr);
  };
  const focus = (s: Subject) => {
    if (totalFoco >= FOCUS_LIMIT) {
      alert(`Você já tem ${FOCUS_LIMIT} em foco. Conclua ou devolva uma à fila antes de puxar a próxima.`);
      return;
    }
    updateSubject(s.id, { status: 'foco' });
  };
  const toFila = (s: Subject) => updateSubject(s.id, { status: 'fila' });
  const complete = (s: Subject) => updateSubject(s.id, { status: 'concluida' });

  // ---- eixo por ano ----
  const today = toISO();
  const totalWeeks = endISO ? Math.max(1, weeksBetween(today, endISO)) : 1;
  const posOf = (iso: string) => Math.max(0, Math.min(100, (weeksBetween(today, iso) / totalWeeks) * 100));
  const years: { year: number; left: number; width: number }[] = [];
  const ticks: { pos: number; label: string }[] = [];
  if (endISO) {
    const y0 = parseISO(today).getFullYear();
    const y1 = parseISO(endISO).getFullYear();
    for (let y = y0; y <= y1; y++) {
      const start = y === y0 ? today : `${y}-01-01`;
      const end = y === y1 ? endISO : `${y}-12-31`;
      years.push({ year: y, left: posOf(start), width: posOf(end) - posOf(start) });
    }
    const s = parseISO(today);
    let m = new Date(s.getFullYear(), s.getMonth(), 1);
    const e = parseISO(endISO);
    while (m <= e) {
      if (m.getMonth() % 3 === 0) ticks.push({ pos: posOf(toISO(m)), label: MES3[m.getMonth()] });
      m = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    }
  }
  const lanes = [0, 1, 2].map((li) => items.filter((it) => it.lane === li));

  return (
    <>
      <div className="mb-5">
        <div className="font-serif text-2xl font-semibold">Roadmap</div>
        <p className="mt-1 text-[13px] text-ink-muted">
          3 vagas de foco, <b>mix livre</b> de matérias e cursos. Organize embaixo: escolha as 3 atuais e a ordem da fila —
          a linha do tempo se ajusta.
        </p>
      </div>

      {active.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center text-ink-muted">
          <div className="mb-2 text-3xl opacity-40">🗺️</div>
          Sem matérias/cursos em andamento. Adicione em Matérias ou Carreira para montar sua trilha.
        </div>
      ) : (
        <>
          {/* Resumo + timeline */}
          <div className="card mb-4">
            <div className="mb-4 flex flex-wrap items-center gap-x-10 gap-y-3">
              <div>
                <div className="eyebrow">Conclusão prevista de tudo</div>
                <div className="my-0.5 font-serif text-xl font-semibold">{endISO ? fmtMonthYear(endISO) : '—'}</div>
                <div className="text-[13px] text-ink-muted">{items.length} na trilha · até 3 em paralelo</div>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} /> Matéria
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: 'var(--gold)' }} /> Carreira
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="relative mb-1 h-6">
                  {years.map((y) => (
                    <div
                      key={y.year}
                      className="absolute top-0 flex h-6 items-center justify-center border-l border-line-strong"
                      style={{ left: `${y.left}%`, width: `${y.width}%` }}
                    >
                      <span className="text-[12px] font-semibold text-ink">{y.year}</span>
                    </div>
                  ))}
                </div>
                <div className="relative mb-2 h-4 border-b border-line">
                  {ticks.map((t, i) => (
                    <span key={i} className="absolute top-0 pl-1 text-[9px] uppercase tracking-wide text-faint" style={{ left: `${t.pos}%` }}>
                      {t.label}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  {lanes.map((laneItems, li) => (
                    <div key={li} className="relative h-11 rounded-sm bg-surface-2/50">
                      {years.map((y) => (
                        <div key={y.year} className="absolute top-0 h-full w-px bg-line/70" style={{ left: `${y.left}%` }} />
                      ))}
                      {laneItems.map((it) => {
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
                            title={`${it.subject.name} · ${fmtMonthYear(it.startISO)} → ${fmtMonthYear(it.endISO)}`}
                          >
                            <span className="truncate text-[12px] font-semibold">{it.subject.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Organizador */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Em foco */}
            <div className="card">
              <div className="card-title">
                <span className="flex items-center gap-2 text-accent">
                  🎯 <span className="text-ink">Em foco agora</span>
                </span>
                <span className="font-mono text-faint">{totalFoco}/{FOCUS_LIMIT}</span>
              </div>
              {foco.length === 0 && <div className="py-4 text-center text-sm text-ink-muted">Nenhuma em foco. Puxe da fila →</div>}
              {foco.map((s) => {
                const st = subjectStats(s, lessonLogs);
                const finished = st.done >= st.total;
                return (
                  <div key={s.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-none">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: colorOf(s) }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{s.name}</div>
                      <div className="text-[11px] text-ink-muted">
                        {st.done}/{st.total} · {st.pct}%
                      </div>
                    </div>
                    <button
                      className={`btn btn-sm ${finished ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => complete(s)}
                      title="Concluir (abre vaga)"
                    >
                      <Icon name="check" size={13} /> Concluir
                    </button>
                    <button className="icon-btn" onClick={() => toFila(s)} title="Voltar para a fila">
                      ↩
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Fila */}
            <div className="card">
              <div className="card-title">
                <span className="flex items-center gap-2">📋 <span className="text-ink">Próximas (fila)</span></span>
                <span className="font-mono text-faint">{fila.length}</span>
              </div>
              {fila.length === 0 && <div className="py-4 text-center text-sm text-ink-muted">Fila vazia.</div>}
              {fila.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-none">
                  <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-sm bg-surface-3 font-mono text-[11px] text-ink-muted">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: colorOf(s) }} />
                      <span className="truncate font-medium">{s.name}</span>
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      {s.total_lessons} aulas{s.weekly_goal ? ` · ${s.weekly_goal}/sem` : ` · ~${DEFAULT_WEEKLY}/sem`}
                      {s.target_date ? ` · até ${fmtShort(s.target_date)}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button className="icon-btn" onClick={() => moveFila(i, -1)} disabled={i === 0} title="Subir">
                      ↑
                    </button>
                    <button className="icon-btn" onClick={() => moveFila(i, 1)} disabled={i === fila.length - 1} title="Descer">
                      ↓
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => focus(s)}
                      disabled={totalFoco >= FOCUS_LIMIT}
                      title={totalFoco >= FOCUS_LIMIT ? 'As 3 vagas estão ocupadas' : 'Colocar em foco'}
                    >
                      ▶
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

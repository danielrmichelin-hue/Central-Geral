import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { ActivityModal } from '../components/ActivityModal';
import { Icon } from '../lib/icons';
import { WD3, addDays, fmtShort, isToday, toISO, weekDays, weekdayOf } from '../lib/date';
import { activitiesForDate } from '../lib/logic';
import type { Activity } from '../lib/types';

export function SchedulePage() {
  const { modules, activities } = useData();
  const [anchor, setAnchor] = useState(toISO());
  const [editing, setEditing] = useState<Activity | null>(null);
  const [creatingDay, setCreatingDay] = useState<number | null>(null);

  const days = useMemo(() => weekDays(anchor), [anchor]);
  const moduleOf = (id: string) => modules.find((m) => m.id === id);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-serif text-2xl font-semibold">Cronograma</div>
          <p className="mt-1 max-w-xl text-[13px] text-ink-muted">
            Sua grade da semana. Clique em uma atividade para editar, ou em <b>+</b> num dia para adicionar. Tudo aqui
            alimenta o painel <b>Hoje</b>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="grid h-9 w-9 place-items-center rounded-sm border border-line text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            onClick={() => setAnchor((a) => addDays(a, -7))}
            title="Semana anterior"
          >
            <Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAnchor(toISO())}>
            Esta semana
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-sm border border-line text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            onClick={() => setAnchor((a) => addDays(a, 7))}
            title="Próxima semana"
          >
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {days.map((iso) => {
          const wd = weekdayOf(iso);
          const items = activitiesForDate(activities, iso);
          const today = isToday(iso);
          return (
            <div
              key={iso}
              className={`flex min-h-[180px] flex-col rounded border bg-surface p-3 ${
                today ? 'border-accent' : 'border-line'
              } ${wd === 0 || wd === 6 ? 'border-dashed' : ''}`}
            >
              <div className="mb-2.5 flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${today ? 'text-accent' : 'text-ink-muted'}`}>
                  {WD3[wd]}
                </span>
                <span className="font-mono text-[10px] text-faint">{fmtShort(iso)}</span>
              </div>

              <div className="flex-1 space-y-1.5">
                {items.map((a) => {
                  const m = moduleOf(a.module_id);
                  const color = a.color || m?.color || 'var(--accent)';
                  return (
                    <button
                      key={a.id}
                      onClick={() => setEditing(a)}
                      className="flex w-full items-center gap-2 rounded-md bg-surface-2 px-2 py-1.5 text-left text-[12px] transition hover:bg-surface-3"
                    >
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: color }} />
                      <span className="min-w-0 flex-1 truncate">{a.title}</span>
                      {a.recurrence === 'once' && <span className="text-[9px] text-gold">•</span>}
                    </button>
                  );
                })}
                {items.length === 0 && <div className="py-3 text-center text-[11px] text-faint">livre</div>}
              </div>

              <button
                onClick={() => setCreatingDay(wd)}
                className="mt-2 rounded-sm py-1.5 text-[12px] text-faint transition hover:bg-surface-2 hover:text-ink-muted"
              >
                + adicionar
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 px-1 text-xs text-ink-muted">
        {modules.map((m) => (
          <span key={m.id} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
            {m.name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="text-gold">•</span> pontual (só naquele dia)
        </span>
      </div>

      <AnimatePresence>
        {creatingDay !== null && (
          <ActivityModal
            onClose={() => setCreatingDay(null)}
            defaultModuleId={modules[0]?.id}
            defaultRecurrence="fixed"
            defaultDays={[creatingDay]}
          />
        )}
        {editing && <ActivityModal activity={editing} onClose={() => setEditing(null)} />}
      </AnimatePresence>
    </>
  );
}

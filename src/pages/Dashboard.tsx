import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { ActivityRow } from '../components/ActivityRow';
import { ActivityModal } from '../components/ActivityModal';
import { Ring } from '../components/Ring';
import { Icon } from '../lib/icons';
import { activitiesForDate, isDone } from '../lib/logic';
import { addDays, fmtLong, isToday, pct, toISO } from '../lib/date';
import type { Activity } from '../lib/types';

export function Dashboard() {
  const { modules, activities, completions } = useData();
  const [date, setDate] = useState(toISO());
  const [editing, setEditing] = useState<Activity | null>(null);
  const [creating, setCreating] = useState(false);

  const todays = useMemo(() => activitiesForDate(activities, date), [activities, date]);
  const done = todays.filter((a) => isDone(completions, a.id, date)).length;
  const total = todays.length;
  const percent = pct(done, total);

  const groups = modules
    .map((m) => ({ module: m, items: todays.filter((a) => a.module_id === m.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {/* Hero */}
      <div
        className="mb-4 rounded border border-line p-6"
        style={{ background: 'linear-gradient(135deg,var(--surface),var(--surface-2))' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Ring pct={percent} />
            <div>
              <div className="eyebrow">{isToday(date) ? 'Hoje' : 'Agenda'} · {fmtLong(date)}</div>
              <div className="my-1 font-serif text-2xl font-semibold">
                {total ? `${done} de ${total} concluídos` : 'Dia livre'}
              </div>
              <div className="text-[13px] text-ink-muted">
                {total === 0
                  ? 'Nenhuma atividade programada para este dia.'
                  : percent >= 100
                    ? 'Tudo feito. Excelente. ✦'
                    : percent >= 50
                      ? 'Bom ritmo — continue.'
                      : 'Vamos começar.'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-sm border border-line text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                    onClick={() => setDate((d) => addDays(d, -1))} title="Dia anterior">
              <Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setDate(toISO())}>
              Hoje
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-sm border border-line text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                    onClick={() => setDate((d) => addDays(d, 1))} title="Próximo dia">
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="eyebrow">Tudo o que importa neste dia</div>
        <button className="btn btn-ghost btn-sm" onClick={() => setCreating(true)}>
          <Icon name="plus" size={15} /> Nova atividade
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="card grid place-items-center py-14 text-center text-ink-muted">
          <div className="mb-2 text-3xl opacity-40">✧</div>
          Nada programado. Adicione atividades nos módulos ou crie uma pontual para hoje.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map(({ module, items }) => {
            const md = items.filter((a) => isDone(completions, a.id, date)).length;
            return (
              <div key={module.id} className="card">
                <div className="card-title">
                  <span className="flex items-center gap-2" style={{ color: module.color }}>
                    <Icon name={module.icon} size={15} />
                    <span className="text-ink">{module.name}</span>
                  </span>
                  <span className="font-mono text-faint">
                    {md}/{items.length}
                  </span>
                </div>
                {items.map((a) => (
                  <ActivityRow key={a.id} activity={a} date={date} module={module} onEdit={setEditing} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {creating && <ActivityModal onClose={() => setCreating(false)} defaultModuleId={modules[0]?.id} />}
        {editing && <ActivityModal activity={editing} onClose={() => setEditing(null)} />}
      </AnimatePresence>
    </>
  );
}

import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { ActivityModal } from '../components/ActivityModal';
import { Icon } from '../lib/icons';
import { WD3, fmtMin, fmtShort, toISO, weekdayOf } from '../lib/date';
import type { Activity } from '../lib/types';

export function ModulePage() {
  const { slug } = useParams();
  const { modules, activities } = useData();
  const [editing, setEditing] = useState<Activity | null>(null);
  const [creating, setCreating] = useState(false);

  const module = modules.find((m) => m.slug === slug);
  const list = useMemo(
    () => activities.filter((a) => module && a.module_id === module.id && a.active),
    [activities, module],
  );

  if (!module) {
    return <div className="card text-center text-ink-muted">Módulo não encontrado.</div>;
  }

  const fixed = list.filter((a) => a.recurrence === 'fixed');
  const once = list
    .filter((a) => a.recurrence === 'once')
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const today = toISO();
  const upcoming = once.filter((a) => (a.date || '') >= today);
  const past = once.filter((a) => (a.date || '') < today);

  const Row = ({ a }: { a: Activity }) => {
    const color = a.color || module.color;
    return (
      <button
        onClick={() => setEditing(a)}
        className="group flex w-full items-center gap-3.5 border-b border-line px-1 py-3 text-left transition last:border-none hover:bg-surface-2"
      >
        <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: color }} />
        <div className="min-w-0 flex-1">
          <div className="font-medium">{a.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
            {a.recurrence === 'fixed' ? (
              WD3.map((w, i) => (
                <span
                  key={i}
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                    a.days_of_week.includes(i) ? 'bg-accent/15 text-accent' : 'text-faint'
                  }`}
                >
                  {w}
                </span>
              ))
            ) : (
              <span className="font-mono">{a.date ? fmtShort(a.date) : ''}</span>
            )}
            {a.time && <span className="font-mono">· {a.time}</span>}
            {a.duration_min ? <span>· {fmtMin(a.duration_min)}</span> : null}
          </div>
        </div>
        <Icon
          name="edit"
          size={15}
          className="text-faint opacity-0 transition group-hover:opacity-100"
        />
      </button>
    );
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-lg"
            style={{ background: `${module.color}22`, color: module.color }}
          >
            <Icon name={module.icon} size={22} />
          </span>
          <div>
            <div className="font-serif text-2xl font-semibold">{module.name}</div>
            <div className="text-[13px] text-ink-muted">
              {fixed.length} fixa{fixed.length !== 1 ? 's' : ''} · {once.length} pontua{once.length !== 1 ? 'is' : 'l'}
            </div>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
          <Icon name="plus" size={15} /> Nova atividade
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="card-title">
            Fixas · toda semana
            <span className="font-mono text-faint">{fixed.length}</span>
          </div>
          {fixed.length ? (
            fixed.map((a) => <Row key={a.id} a={a} />)
          ) : (
            <div className="py-8 text-center text-sm text-ink-muted">Nenhuma atividade semanal ainda.</div>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            Pontuais · datas específicas
            <span className="font-mono text-faint">{once.length}</span>
          </div>
          {upcoming.length || past.length ? (
            <>
              {upcoming.map((a) => (
                <Row key={a.id} a={a} />
              ))}
              {past.length > 0 && (
                <div className="px-1 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-faint">
                  Passadas
                </div>
              )}
              {past.map((a) => (
                <div key={a.id} className="opacity-50">
                  <Row a={a} />
                </div>
              ))}
            </>
          ) : (
            <div className="py-8 text-center text-sm text-ink-muted">Nenhuma atividade pontual.</div>
          )}
        </div>
      </div>

      {/* Grade rápida da semana deste módulo */}
      <div className="card mt-4">
        <div className="card-title">Distribuição na semana</div>
        <div className="grid grid-cols-7 gap-2">
          {WD3.map((w, i) => {
            const count = fixed.filter((a) => a.days_of_week.includes(i)).length;
            const isToday = weekdayOf(today) === i;
            return (
              <div
                key={i}
                className={`rounded-sm border px-2 py-3 text-center ${
                  isToday ? 'border-accent' : 'border-line'
                }`}
              >
                <div className={`text-[11px] font-semibold uppercase ${isToday ? 'text-accent' : 'text-ink-muted'}`}>
                  {w}
                </div>
                <div className="mt-1 font-mono text-lg font-semibold" style={{ color: count ? module.color : 'var(--faint)' }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {creating && <ActivityModal onClose={() => setCreating(false)} defaultModuleId={module.id} />}
        {editing && <ActivityModal activity={editing} onClose={() => setEditing(null)} />}
      </AnimatePresence>
    </>
  );
}

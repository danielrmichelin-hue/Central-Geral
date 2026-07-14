import { Checkbox } from './Checkbox';
import { Icon } from '../lib/icons';
import { useData } from '../context/DataContext';
import { isDone } from '../lib/logic';
import { fmtMin } from '../lib/date';
import type { Activity, Module } from '../lib/types';

interface Props {
  activity: Activity;
  date: string;
  module?: Module;
  onEdit?: (a: Activity) => void;
}

export function ActivityRow({ activity, date, module, onEdit }: Props) {
  const { completions, toggleCompletion } = useData();
  const done = isDone(completions, activity.id, date);
  const color = activity.color || module?.color || 'var(--accent)';

  return (
    <div
      className={`group flex items-center gap-3.5 border-b border-line px-1 py-3 transition last:border-none ${
        done ? 'opacity-60' : ''
      }`}
    >
      <Checkbox done={done} color={color} onToggle={() => toggleCompletion(activity.id, date)} />
      <div className="min-w-0 flex-1">
        <div className={`font-medium ${done ? 'text-ink-muted line-through decoration-faint' : ''}`}>
          {activity.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          {module && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              {module.name}
            </span>
          )}
          {activity.recurrence === 'once' && <span className="text-gold">pontual</span>}
          {activity.time && <span className="font-mono">{activity.time}</span>}
        </div>
      </div>
      {activity.duration_min ? (
        <span className="whitespace-nowrap rounded-md bg-surface-3 px-2 py-0.5 font-mono text-[11px] text-ink-muted">
          {fmtMin(activity.duration_min)}
        </span>
      ) : null}
      {onEdit && (
        <button
          onClick={() => onEdit(activity)}
          className="grid h-8 w-8 place-items-center rounded-sm text-faint opacity-0 transition hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
          title="Editar"
        >
          <Icon name="edit" size={15} />
        </button>
      )}
    </div>
  );
}

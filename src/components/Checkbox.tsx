import { Icon } from '../lib/icons';

interface Props {
  done: boolean;
  onToggle: () => void;
  color?: string;
}

export function Checkbox({ done, onToggle, color }: Props) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={done}
      className={`grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-md border-2 transition-all duration-150 ${
        done ? 'border-transparent' : 'border-line-strong hover:border-accent'
      }`}
      style={done ? { background: color || 'var(--success)' } : undefined}
    >
      {done && (
        <span className="animate-pop" style={{ color: '#0B0D10' }}>
          <Icon name="check" size={14} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

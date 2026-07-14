interface RingProps {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}

export function Ring({ pct, size = 104, stroke = 8, color = 'var(--accent)', label }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="font-mono text-2xl font-semibold tabular-nums">
          {pct}
          <span className="text-sm text-ink-muted">%</span>
        </div>
        {label && <div className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</div>}
      </div>
    </div>
  );
}

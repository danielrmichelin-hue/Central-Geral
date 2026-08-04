import { AnimatePresence, motion } from 'framer-motion';
import { usePomodoro, type PomoMode } from '../context/PomodoroContext';
import { useData } from '../context/DataContext';
import { Icon } from '../lib/icons';

const LABELS: Record<PomoMode, string> = { foco: 'Foco', curta: 'Pausa curta', longa: 'Pausa longa' };

function fmtClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

export function Pomodoro() {
  const p = usePomodoro();
  const { subjects } = useData();
  const active = p.running && !p.paused;
  const isBreak = p.mode !== 'foco';
  const total = p.config[p.mode] * 60;
  const R = 80;
  const C = 2 * Math.PI * R;
  const off = C * (1 - p.remaining / total);
  const color = isBreak ? 'var(--success)' : 'var(--accent)';
  const subj = subjects.find((s) => s.id === p.subjectId);

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3">
      <AnimatePresence>
        {p.open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.3, 1] }}
            className="w-[320px] rounded-lg border border-line-strong bg-surface p-5 shadow-soft"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="clock" size={16} /> Pomodoro
              </div>
              <button className="grid h-7 w-7 place-items-center rounded-sm text-ink-muted hover:bg-surface-2" onClick={p.toggleOpen}>
                <Icon name="plus" size={16} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            {/* Relógio */}
            <div className="relative mx-auto my-2 h-[176px] w-[176px]">
              <svg width="176" height="176" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="88" cy="88" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="7" />
                <circle
                  cx="88"
                  cy="88"
                  r={R}
                  fill="none"
                  stroke={color}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={off}
                  style={{ transition: 'stroke-dashoffset .3s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <div className="font-mono text-[40px] font-semibold tabular-nums tracking-wider">{fmtClock(p.remaining)}</div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">{LABELS[p.mode]}</div>
              </div>
            </div>

            {/* Modos */}
            <div className="mb-3 flex gap-1 rounded-sm border border-line bg-bg p-1">
              {(['foco', 'curta', 'longa'] as PomoMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => p.setMode(m)}
                  className={`flex-1 rounded-[6px] py-1.5 text-[12px] font-semibold transition ${
                    p.mode === m ? 'bg-surface-3 text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {LABELS[m].replace('Pausa ', '')}
                </button>
              ))}
            </div>

            {/* Matéria */}
            <select
              className="inp mb-3"
              value={p.subjectId ?? ''}
              onChange={(e) => p.setSubject(e.target.value || null)}
            >
              <option value="">Foco livre (sem matéria)</option>
              {subjects.filter((s) => s.active).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Controles */}
            <div className="mb-3 flex gap-2">
              <button className={`btn flex-1 ${active ? 'btn-ghost' : 'btn-primary'}`} onClick={p.toggleRun}>
                {active ? 'Pausar' : p.paused ? 'Retomar' : 'Iniciar'}
              </button>
              <button className="btn btn-ghost" onClick={p.reset} title="Reiniciar">
                ↺
              </button>
              <button className="btn btn-ghost" onClick={p.skip} title="Pular">
                ⏭
              </button>
            </div>

            {/* Registrar aula */}
            <button className="btn btn-gold btn-block mb-3" onClick={p.registerLesson} disabled={!p.subjectId}>
              <Icon name="check" size={15} />
              {subj ? `Registrar aula · ${subj.name}` : 'Registrar aula'}
            </button>

            {/* Rodapé */}
            <div className="flex items-center justify-between border-t border-line pt-3 text-[12px] text-ink-muted">
              <span>
                🍅 {p.sessionFocusMin}min · {p.cycle} ciclo{p.cycle !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-1.5" title={`Minutos de ${LABELS[p.mode].toLowerCase()}`}>
                <button className="grid h-6 w-6 place-items-center rounded-sm text-ink-muted hover:bg-surface-3" onClick={() => p.adjust(p.mode, -1)}>
                  −
                </button>
                <span className="w-5 text-center font-mono text-[12px] font-semibold">{p.config[p.mode]}</span>
                <button className="grid h-6 w-6 place-items-center rounded-sm text-ink-muted hover:bg-surface-3" onClick={() => p.adjust(p.mode, 1)}>
                  +
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={p.toggleOpen}
        className={`flex items-center gap-2.5 rounded-full border bg-surface px-4 py-2.5 shadow-soft transition hover:bg-surface-2 ${
          active ? 'border-accent' : p.paused ? 'border-warning' : 'border-line-strong'
        }`}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: active ? color : p.paused ? 'var(--warning)' : 'var(--faint)' }}
        />
        <span className="font-mono text-[15px] font-semibold tabular-nums">{fmtClock(p.remaining)}</span>
        <span className="max-w-[90px] truncate text-[12px] font-semibold text-ink-muted">
          {active || p.paused ? (subj ? subj.name : LABELS[p.mode]) : 'Foco'}
        </span>
      </button>
    </div>
  );
}

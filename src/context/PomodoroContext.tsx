import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useData } from './DataContext';
import { useToast } from '../components/Toast';
import { toISO } from '../lib/date';

export type PomoMode = 'foco' | 'curta' | 'longa';

interface PomoConfig {
  foco: number;
  curta: number;
  longa: number;
}

interface PomodoroCtx {
  open: boolean;
  mode: PomoMode;
  running: boolean;
  paused: boolean;
  remaining: number;
  subjectId: string | null;
  sessionFocusMin: number;
  cycle: number;
  config: PomoConfig;
  toggleOpen: () => void;
  setMode: (m: PomoMode) => void;
  toggleRun: () => void;
  reset: () => void;
  skip: () => void;
  adjust: (m: PomoMode, delta: number) => void;
  setSubject: (id: string | null) => void;
  registerLesson: () => Promise<void>;
}

const Ctx = createContext<PomodoroCtx>(null as unknown as PomodoroCtx);
export const usePomodoro = () => useContext(Ctx);

const CFG_KEY = 'central_geral_pomo';
const DEFAULT_CFG: PomoConfig = { foco: 25, curta: 5, longa: 15 };

function loadCfg(): PomoConfig {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (raw) return { ...DEFAULT_CFG, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_CFG;
}

function beep() {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    [0, 160].forEach((t, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.value = i ? 660 : 880;
      const st = ctx.currentTime + t / 1000;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.28, st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.4);
      o.start(st);
      o.stop(st + 0.42);
    });
    setTimeout(() => ctx.close(), 900);
  } catch {
    /* ignore */
  }
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { addLessonLog } = useData();
  const toast = useToast();

  const [config, setConfig] = useState<PomoConfig>(loadCfg);
  const [open, setOpen] = useState(false);
  const [mode, setModeState] = useState<PomoMode>('foco');
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(config.foco * 60);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [sessionFocusMin, setSessionFocusMin] = useState(0);
  const [cycle, setCycle] = useState(0);

  const cycleRef = useRef(cycle);
  cycleRef.current = cycle;

  const switchMode = (m: PomoMode) => {
    setModeState(m);
    setRemaining(config[m] * 60);
    setRunning(false);
    setPaused(false);
  };

  // tique do relógio
  useEffect(() => {
    if (!running || paused) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [running, paused]);

  // fim do bloco
  useEffect(() => {
    if (!running || paused || remaining > 0) return;
    beep();
    if (mode === 'foco') {
      const min = config.foco;
      setSessionFocusMin((m) => m + min);
      setCycle((c) => c + 1);
      toast(`🍅 Foco concluído · ${min}min`, 'success');
      const next = (cycleRef.current + 1) % 4 === 0 ? 'longa' : 'curta';
      switchMode(next);
    } else {
      toast('Pausa concluída — de volta ao foco');
      switchMode('foco');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running, paused]);

  const toggleOpen = () => setOpen((o) => !o);
  const setMode = (m: PomoMode) => switchMode(m);
  const toggleRun = () => {
    if (running && !paused) setPaused(true);
    else {
      setRunning(true);
      setPaused(false);
    }
  };
  const reset = () => {
    setRemaining(config[mode] * 60);
    setRunning(false);
    setPaused(false);
  };
  const skip = () => {
    if (mode === 'foco') switchMode((cycle + 1) % 4 === 0 ? 'longa' : 'curta');
    else switchMode('foco');
  };
  const adjust = (m: PomoMode, delta: number) => {
    setConfig((prev) => {
      const next = { ...prev, [m]: Math.max(1, Math.min(90, prev[m] + delta)) };
      localStorage.setItem(CFG_KEY, JSON.stringify(next));
      if (m === mode && !running) setRemaining(next[m] * 60);
      return next;
    });
  };
  const setSubject = (id: string | null) => setSubjectId(id);
  const registerLesson = async () => {
    if (!subjectId) {
      toast('Escolha uma matéria primeiro', 'danger');
      return;
    }
    const minutes = sessionFocusMin > 0 ? sessionFocusMin : config.foco;
    await addLessonLog(subjectId, toISO(), minutes);
    setSessionFocusMin(0);
    toast(`Aula registrada · ${minutes}min ✓`, 'success');
  };

  return (
    <Ctx.Provider
      value={{
        open,
        mode,
        running,
        paused,
        remaining,
        subjectId,
        sessionFocusMin,
        cycle,
        config,
        toggleOpen,
        setMode,
        toggleRun,
        reset,
        skip,
        adjust,
        setSubject,
        registerLesson,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

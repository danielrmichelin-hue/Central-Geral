import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Ring } from '../components/Ring';
import { Modal } from '../components/Modal';
import { SubjectModal } from '../components/SubjectModal';
import { Icon } from '../lib/icons';
import { fmtMin, fmtShort, toISO } from '../lib/date';
import { lastLessonLog, overallStudyStats, subjectStats, weeklyPace } from '../lib/subjects';
import type { Subject, SubjectKind } from '../lib/types';

interface KindCopy {
  title: string;
  subtitle: string;
  add: string;
  empty: string;
  emoji: string;
  eyebrow: string;
  activeLabel: string;
  completedText: (n: number) => string;
}

const COPY: Record<SubjectKind, KindCopy> = {
  estudo: {
    title: 'Matérias',
    subtitle: 'Cada matéria tem um cronograma de aulas. Registre com o Pomodoro (canto inferior) ou no “+ aula”.',
    add: 'Nova matéria',
    empty: 'Nenhuma matéria ainda. Crie a primeira e defina quantas aulas ela tem.',
    emoji: '🎓',
    eyebrow: 'Progresso geral dos estudos',
    activeLabel: 'Matérias ativas',
    completedText: (n) => `${n} matéria${n !== 1 ? 's' : ''} concluída${n !== 1 ? 's' : ''}`,
  },
  carreira: {
    title: 'Carreira',
    subtitle: 'Cursos e treinamentos de carreira — mesmo esquema das matérias: aulas, progresso, ritmo e Pomodoro.',
    add: 'Novo curso',
    empty: 'Nenhum curso ainda. Crie o primeiro e defina quantas aulas ele tem.',
    emoji: '💼',
    eyebrow: 'Progresso geral da carreira',
    activeLabel: 'Cursos ativos',
    completedText: (n) => `${n} curso${n !== 1 ? 's' : ''} concluído${n !== 1 ? 's' : ''}`,
  },
};

function Bar({ value, color = 'var(--accent)' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
      <span
        className="block h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

function Stat({ v, k }: { v: string; k: string }) {
  return (
    <div className="min-w-[84px]">
      <div className="font-mono text-2xl font-semibold tabular-nums">{v}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-muted">{k}</div>
    </div>
  );
}

export function SubjectsPage({ kind = 'estudo' }: { kind?: SubjectKind }) {
  const { subjects, lessonLogs, modules, addLessonLog, removeLessonLog } = useData();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [detail, setDetail] = useState<Subject | null>(null);
  const copy = COPY[kind];

  const removeLastLesson = (subjectId: string) => {
    const last = lastLessonLog(subjectId, lessonLogs);
    if (last) removeLessonLog(last.id);
  };

  const ofKind = useMemo(() => subjects.filter((s) => (s.kind ?? 'estudo') === kind), [subjects, kind]);
  const active = useMemo(
    () => ofKind.filter((s) => s.active).sort((a, b) => a.sort_order - b.sort_order),
    [ofKind],
  );
  const overall = overallStudyStats(ofKind, lessonLogs);
  const moduleOf = (id: string | null) => (id ? modules.find((m) => m.id === id) : undefined);
  const colorOf = (s: Subject) => s.color || moduleOf(s.module_id)?.color || 'var(--accent)';

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-serif text-2xl font-semibold">{copy.title}</div>
          <p className="mt-1 text-[13px] text-ink-muted">{copy.subtitle}</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
          <Icon name="plus" size={15} /> {copy.add}
        </button>
      </div>

      {/* Indicadores gerais */}
      <div className="card mb-5">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
          <div className="flex items-center gap-5">
            <Ring pct={overall.pct} size={92} />
            <div>
              <div className="eyebrow">{copy.eyebrow}</div>
              <div className="my-0.5 font-serif text-lg font-semibold">
                {overall.totalDone} de {overall.totalTarget} aulas
              </div>
              <div className="text-[13px] text-ink-muted">{copy.completedText(overall.completedSubjects)}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <Stat v={String(overall.totalDone)} k="Aulas feitas" />
            <Stat v={overall.hours.toFixed(1) + 'h'} k="Horas estudadas" />
            <Stat v={String(overall.lessonsThisWeek)} k="Aulas na semana" />
            <Stat v={String(overall.activeSubjects)} k={copy.activeLabel} />
          </div>
        </div>
      </div>

      {/* Lista de matérias */}
      {active.length === 0 ? (
        <div className="card grid place-items-center py-14 text-center text-ink-muted">
          <div className="mb-2 text-3xl opacity-40">{copy.emoji}</div>
          {copy.empty}
        </div>
      ) : (
        <div className="space-y-2.5">
          {active.map((s) => {
            const st = subjectStats(s, lessonLogs);
            const color = colorOf(s);
            return (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-4 rounded border border-line bg-surface p-4 transition hover:border-line-strong"
              >
                <button className="min-w-[180px] flex-1 text-left" onClick={() => setDetail(s)}>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    {s.name}
                    {st.completed && <span className="text-success"><Icon name="check" size={15} /></span>}
                  </div>
                  <div className="mt-1 text-xs text-ink-muted">
                    Aula {Math.min(st.done + 1, st.total)} de {st.total}
                    {st.lastDate ? ` · última ${fmtShort(st.lastDate)}` : ''}
                    {st.pace > 0 && !st.completed ? ` · ~${st.pace.toFixed(1)}/sem` : ''}
                    {st.etaWeeks ? ` · termina em ~${st.etaWeeks} sem` : ''}
                  </div>
                </button>

                <div className="w-[160px]">
                  <Bar value={st.pct} color={st.completed ? 'var(--success)' : color} />
                </div>
                <div className="w-[76px] text-right">
                  <div className="font-mono font-semibold tabular-nums">{st.pct}%</div>
                  <div className="text-[11px] text-ink-muted">faltam {st.remaining}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={st.done === 0}
                    onClick={() => removeLastLesson(s.id)}
                    title="Remover a última aula registrada"
                  >
                    <Icon name="minus" size={14} />
                  </button>
                  <button
                    className="btn btn-gold btn-sm"
                    disabled={st.completed}
                    onClick={() => addLessonLog(s.id, toISO(), null)}
                    title="Registrar 1 aula concluída"
                  >
                    <Icon name="plus" size={14} /> aula
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modais */}
      <AnimatePresence>
        {creating && <SubjectModal kind={kind} onClose={() => setCreating(false)} />}
        {editing && <SubjectModal subject={editing} onClose={() => setEditing(null)} />}
        {detail && (
          <SubjectDetail
            subject={detail}
            onEdit={() => {
              setEditing(detail);
              setDetail(null);
            }}
            onClose={() => setDetail(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function SubjectDetail({ subject, onEdit, onClose }: { subject: Subject; onEdit: () => void; onClose: () => void }) {
  const { lessonLogs, modules, addLessonLog, removeLessonLog } = useData();
  const [dur, setDur] = useState('');
  const st = subjectStats(subject, lessonLogs);
  const pace = weeklyPace(subject.id, lessonLogs, 8);
  const maxPace = Math.max(1, ...pace);
  const color = subject.color || (subject.module_id ? modules.find((m) => m.id === subject.module_id)?.color : undefined) || 'var(--accent)';
  const mine = lessonLogs
    .filter((l) => l.subject_id === subject.id)
    .sort((a, b) => (b.created_at || b.date).localeCompare(a.created_at || a.date));

  const register = async () => {
    await addLessonLog(subject.id, toISO(), dur ? Number(dur) : null);
    setDur('');
  };

  return (
    <Modal
      title={subject.name}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost mr-auto" onClick={onEdit}>
            <Icon name="edit" size={14} /> Editar
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Fechar
          </button>
        </>
      }
    >
      <div className="flex items-center gap-5">
        <Ring pct={st.pct} size={92} color={st.completed ? 'var(--success)' : color} />
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          <Stat v={`${st.done}/${st.total}`} k="Aulas" />
          <Stat v={String(st.remaining)} k="Faltam" />
          <Stat v={st.hours.toFixed(1) + 'h'} k="Horas" />
          <Stat v={st.etaWeeks ? `~${st.etaWeeks}` : '—'} k="Semanas p/ fim" />
        </div>
      </div>

      {/* Ritmo semanal */}
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ritmo · aulas por semana (8 sem)</div>
        <div className="flex h-16 items-end gap-1.5">
          {pace.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t"
                style={{ height: `${(v / maxPace) * 100}%`, minHeight: 2, background: i === pace.length - 1 ? 'var(--gold)' : color }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Registrar aula com duração */}
      <div className="flex items-end gap-2 rounded-sm border border-line bg-bg p-3">
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-muted">Registrar aula — duração (min, opcional)</span>
          <input
            className="inp mt-1"
            type="number"
            min={0}
            placeholder="ex: 50"
            value={dur}
            onChange={(e) => setDur(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && register()}
          />
        </label>
        <button className="btn btn-gold" onClick={register} disabled={st.completed}>
          <Icon name="check" size={15} /> Concluir aula
        </button>
      </div>

      {/* Histórico */}
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          Histórico · {mine.length} aula{mine.length !== 1 ? 's' : ''}
        </div>
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {mine.length === 0 && <div className="py-4 text-center text-sm text-ink-muted">Nenhuma aula registrada.</div>}
          {mine.map((l, idx) => (
            <div key={l.id} className="flex items-center gap-3 rounded-sm bg-surface-2 px-3 py-2 text-[13px]">
              <span className="text-success">
                <Icon name="check" size={14} />
              </span>
              <span className="flex-1">
                Aula {mine.length - idx}
                <span className="text-ink-muted">
                  {' · '}
                  {fmtShort(l.date)}
                  {l.duration_min ? ` · ${fmtMin(l.duration_min)}` : ''}
                </span>
              </span>
              <button className="text-xs text-faint hover:text-danger" onClick={() => removeLessonLog(l.id)}>
                desfazer
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

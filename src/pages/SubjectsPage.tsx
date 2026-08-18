import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Ring } from '../components/Ring';
import { Modal } from '../components/Modal';
import { SubjectModal } from '../components/SubjectModal';
import { Icon } from '../lib/icons';
import { fmtMin, fmtMonthYear, fmtShort, toISO } from '../lib/date';
import { useNavigate } from 'react-router-dom';
import {
  FOCUS_LIMIT,
  lastLessonLog,
  overallStudyStats,
  subjectPlan,
  subjectStats,
  weeklyPace,
  type Farol,
} from '../lib/subjects';
import type { Subject, SubjectKind } from '../lib/types';

interface KindCopy {
  title: string;
  subtitle: string;
  add: string;
  unit: string; // "matéria" | "curso"
  eyebrow: string;
}

const COPY: Record<SubjectKind, KindCopy> = {
  estudo: {
    title: 'Matérias',
    subtitle: 'Estude em foco: no máximo 3 de cada vez, até concluir. As demais esperam na fila.',
    add: 'Nova matéria',
    unit: 'matéria',
    eyebrow: 'Progresso geral dos estudos',
  },
  carreira: {
    title: 'Carreira',
    subtitle: 'Cursos de carreira em foco: no máximo 3 simultâneos, até concluir. Os demais na fila.',
    add: 'Novo curso',
    unit: 'curso',
    eyebrow: 'Progresso geral da carreira',
  },
};

const FAROL: Record<Farol, { label: string; color: string; bg: string }> = {
  adiantado: { label: 'Adiantado', color: 'var(--success)', bg: 'rgba(74,222,128,.13)' },
  'no-ritmo': { label: 'No ritmo', color: 'var(--accent)', bg: 'rgba(110,139,255,.14)' },
  atrasado: { label: 'Atrasado', color: 'var(--warning)', bg: 'rgba(245,180,90,.14)' },
  'sem-meta': { label: 'Sem meta', color: 'var(--faint)', bg: 'var(--surface-3)' },
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
  const { subjects, lessonLogs, modules, addLessonLog, removeLessonLog, updateSubject } = useData();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [detail, setDetail] = useState<Subject | null>(null);
  const [showDone, setShowDone] = useState(false);
  const copy = COPY[kind];

  const ofKind = useMemo(() => subjects.filter((s) => (s.kind ?? 'estudo') === kind), [subjects, kind]);
  const foco = useMemo(
    () => ofKind.filter((s) => s.status === 'foco').sort((a, b) => a.sort_order - b.sort_order),
    [ofKind],
  );
  const fila = useMemo(
    () => ofKind.filter((s) => s.status === 'fila').sort((a, b) => a.sort_order - b.sort_order),
    [ofKind],
  );
  const done = useMemo(
    () => ofKind.filter((s) => s.status === 'concluida').sort((a, b) => a.sort_order - b.sort_order),
    [ofKind],
  );
  // Foco é um pool global de 3 (mix livre de matérias e cursos).
  const totalFoco = subjects.filter((s) => s.status === 'foco').length;
  const atLimit = totalFoco >= FOCUS_LIMIT;
  const overall = overallStudyStats(ofKind, lessonLogs);

  const moduleOf = (id: string | null) => (id ? modules.find((m) => m.id === id) : undefined);
  const colorOf = (s: Subject) => s.color || moduleOf(s.module_id)?.color || 'var(--accent)';

  const removeLast = (id: string) => {
    const last = lastLessonLog(id, lessonLogs);
    if (last) removeLessonLog(last.id);
  };
  const focus = (s: Subject) => {
    if (atLimit) {
      alert(`Você já tem ${FOCUS_LIMIT} em foco no total (matérias + cursos). Conclua ou devolva uma à fila antes.`);
      return;
    }
    updateSubject(s.id, { status: 'foco' });
  };
  const complete = (s: Subject) => updateSubject(s.id, { status: 'concluida' });
  const toQueue = (s: Subject) => updateSubject(s.id, { status: 'fila' });

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
              <div className="text-[13px] text-ink-muted">
                {foco.length} em foco · {fila.length} na fila · {done.length} concluída{done.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <Stat v={`${totalFoco}/${FOCUS_LIMIT}`} k="Em foco (total)" />
            <Stat v={overall.hours.toFixed(1) + 'h'} k="Horas" />
            <Stat v={String(overall.lessonsThisWeek)} k="Aulas na semana" />
            <Stat v={String(done.length)} k="Concluídas" />
          </div>
        </div>
      </div>

      {/* EM FOCO */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">🎯 Em foco</span>
        <span className="font-mono text-xs text-faint">{totalFoco}/{FOCUS_LIMIT} no total</span>
        <button className="ml-auto text-[11px] text-ink-muted hover:text-ink" onClick={() => navigate('/roadmap')}>
          organizar a sequência no Roadmap →
        </button>
      </div>
      {foco.length === 0 ? (
        <div className="card mb-6 grid place-items-center py-10 text-center text-sm text-ink-muted">
          Nenhuma {copy.unit} em foco aqui.{' '}
          {atLimit ? 'As 3 vagas estão ocupadas — conclua uma para abrir espaço.' : 'Puxe da fila abaixo.'}
        </div>
      ) : (
        <div className="mb-6 space-y-3">
          {foco.map((s) => (
            <FocusCard
              key={s.id}
              s={s}
              logs={lessonLogs}
              color={colorOf(s)}
              onDetail={() => setDetail(s)}
              onEdit={() => setEditing(s)}
              onAdd={() => addLessonLog(s.id, toISO(), null)}
              onRemove={() => removeLast(s.id)}
              onComplete={() => complete(s)}
              onQueue={() => toQueue(s)}
            />
          ))}
        </div>
      )}

      {/* FILA */}
      {fila.length > 0 && (
        <>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">📋 Na fila</span>
            <span className="font-mono text-xs text-faint">{fila.length}</span>
            <span className="text-[11px] text-faint">· ordene no Roadmap</span>
          </div>
          <div className="mb-6 space-y-2">
            {fila.map((s) => {
              const st = subjectStats(s, lessonLogs);
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-3 rounded border border-line bg-surface p-3.5">
                  <button className="min-w-[140px] flex-1 text-left" onClick={() => setEditing(s)}>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full" style={{ background: colorOf(s) }} />
                      {s.name}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-muted">
                      {st.done}/{st.total} aulas{s.weekly_goal ? ` · meta ${s.weekly_goal}/sem` : ''}
                      {s.target_date ? ` · até ${fmtShort(s.target_date)}` : ''}
                    </div>
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => focus(s)}
                    disabled={atLimit}
                    title={atLimit ? `Máximo de ${FOCUS_LIMIT} em foco` : 'Colocar em foco'}
                  >
                    ▶ Focar
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* CONCLUÍDAS */}
      {done.length > 0 && (
        <>
          <button
            className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted hover:text-ink"
            onClick={() => setShowDone((v) => !v)}
          >
            ✅ Concluídas <span className="font-mono text-faint">{done.length}</span>
            <span className="text-faint">{showDone ? '▲' : '▼'}</span>
          </button>
          {showDone && (
            <div className="space-y-2">
              {done.map((s) => {
                const st = subjectStats(s, lessonLogs);
                return (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 rounded border border-line bg-surface/60 p-3 opacity-80">
                    <span className="text-success">
                      <Icon name="check" size={16} />
                    </span>
                    <span className="min-w-[140px] flex-1 font-medium line-through decoration-faint">{s.name}</span>
                    <span className="text-xs text-ink-muted">{st.done}/{st.total} aulas · {st.hours.toFixed(1)}h</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => toQueue(s)}>
                      Reabrir
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modais */}
      <AnimatePresence>
        {creating && <SubjectModal kind={kind} focoCount={totalFoco} onClose={() => setCreating(false)} />}
        {editing && <SubjectModal subject={editing} focoCount={totalFoco} onClose={() => setEditing(null)} />}
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

function FarolChip({ farol }: { farol: Farol }) {
  const f = FAROL[farol];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: f.color, background: f.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.color }} />
      {f.label}
    </span>
  );
}

function FocusCard({
  s,
  logs,
  color,
  onDetail,
  onEdit,
  onAdd,
  onRemove,
  onComplete,
  onQueue,
}: {
  s: Subject;
  logs: import('../lib/types').LessonLog[];
  color: string;
  onDetail: () => void;
  onEdit: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onComplete: () => void;
  onQueue: () => void;
}) {
  const st = subjectStats(s, logs);
  const plan = subjectPlan(s, logs);
  const goal = plan.requiredWeekly ?? 0;
  const finished = st.done >= st.total;

  return (
    <div className="card">
      <div className="flex flex-wrap items-start gap-5">
        <Ring pct={st.pct} size={78} color={finished ? 'var(--success)' : color} />
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button className="font-serif text-lg font-semibold hover:underline" onClick={onDetail}>
              {s.name}
            </button>
            <FarolChip farol={finished ? 'adiantado' : plan.farol} />
            <button className="icon-btn ml-auto" onClick={onEdit} title="Editar">
              <Icon name="edit" size={14} />
            </button>
            <button className="icon-btn" onClick={onQueue} title="Devolver à fila">
              ↩
            </button>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink-muted">
            <span>
              <b className="text-ink">{st.done}</b>/{st.total} aulas · faltam {st.remaining}
            </span>
            {plan.requiredWeekly ? <span>Meta: <b className="text-ink">{plan.requiredWeekly}</b>/sem</span> : null}
            {plan.projectedEnd ? (
              <span>Previsão: <b className="text-ink">{fmtMonthYear(plan.projectedEnd)}</b></span>
            ) : null}
            {s.target_date ? <span>Alvo: {fmtShort(s.target_date)}</span> : null}
          </div>

          {/* progresso da semana vs meta */}
          {goal > 0 && (
            <div className="mt-2.5">
              <div className="mb-1 flex justify-between text-[11px] text-ink-muted">
                <span>Esta semana</span>
                <span className="font-mono">
                  {plan.weekDone}/{goal}
                </span>
              </div>
              <Bar value={(plan.weekDone / goal) * 100} color={plan.weekDone >= goal ? 'var(--success)' : color} />
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <button className="btn btn-ghost btn-sm" onClick={onRemove} disabled={st.done === 0} title="Tirar 1 aula">
              <Icon name="minus" size={14} />
            </button>
            <button className="btn btn-gold btn-sm" onClick={onAdd} disabled={finished} title="Registrar 1 aula">
              <Icon name="plus" size={14} /> aula
            </button>
            <button
              className={`btn btn-sm ${finished ? 'btn-primary' : 'btn-ghost'}`}
              onClick={onComplete}
              title="Marcar como concluída e abrir vaga no foco"
            >
              <Icon name="check" size={14} /> {finished ? 'Concluir 🎉' : 'Concluir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubjectDetail({ subject, onEdit, onClose }: { subject: Subject; onEdit: () => void; onClose: () => void }) {
  const { lessonLogs, modules, addLessonLog, removeLessonLog } = useData();
  const [dur, setDur] = useState('');
  const st = subjectStats(subject, lessonLogs);
  const plan = subjectPlan(subject, lessonLogs);
  const pace = weeklyPace(subject.id, lessonLogs, 8);
  const maxPace = Math.max(1, ...pace);
  const color =
    subject.color || (subject.module_id ? modules.find((m) => m.id === subject.module_id)?.color : undefined) || 'var(--accent)';
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
          <Stat v={plan.projectedEnd ? fmtMonthYear(plan.projectedEnd) : '—'} k="Previsão" />
        </div>
      </div>

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

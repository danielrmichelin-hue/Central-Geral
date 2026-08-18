import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ActivityRow } from '../components/ActivityRow';
import { ActivityModal } from '../components/ActivityModal';
import { Checkbox } from '../components/Checkbox';
import { Icon } from '../lib/icons';
import { activitiesForDate, isDone, computeStreak } from '../lib/logic';
import {
  FOCUS_LIMIT,
  buildFocusRoadmap,
  overallStudyStats,
  subjectPlan,
  subjectStats,
  subjectsForDate,
  studiedOn,
} from '../lib/subjects';
import { BIBLE_TOTAL_CHAPTERS } from '../lib/bible';
import { addDays, fmtLong, fmtMonthYear, isToday, pct, toISO } from '../lib/date';
import type { Activity, Subject } from '../lib/types';

function Kpi({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  accent?: string;
}) {
  return (
    <div className="rounded border border-line bg-surface p-4">
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">
        {icon && <Icon name={icon} size={13} />}
        {label}
      </div>
      <div className="mt-1.5 font-mono text-[26px] font-semibold leading-none tabular-nums" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-faint">{sub}</div>}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function Dashboard() {
  const { modules, activities, completions, subjects, lessonLogs, books, bibleReading, addLessonLog, removeLessonLog } =
    useData();
  const navigate = useNavigate();
  const [date, setDate] = useState(toISO());
  const [editing, setEditing] = useState<Activity | null>(null);
  const [creating, setCreating] = useState(false);

  // ---- KPIs (sempre "hoje") ----
  const today = toISO();
  const kToday = activitiesForDate(activities, today);
  const kSubs = subjectsForDate(subjects, today);
  const kDone =
    kToday.filter((a) => isDone(completions, a.id, today)).length +
    kSubs.filter((s) => studiedOn(s.id, lessonLogs, today)).length;
  const kTotal = kToday.length + kSubs.length;

  const study = overallStudyStats(subjects, lessonLogs);
  const totalFoco = subjects.filter((s) => s.status === 'foco').length;
  const streak = computeStreak(completions);
  const roadmapEnd = useMemo(() => buildFocusRoadmap(subjects, lessonLogs).endISO, [subjects, lessonLogs]);

  const booksRead = books.filter((b) => b.active).reduce((a, b) => a + Math.min(b.chapters_read, b.total_chapters), 0);
  const booksTotal = books.filter((b) => b.active).reduce((a, b) => a + b.total_chapters, 0);
  const bibleRead = bibleReading.length;

  const focoSubjects = useMemo(
    () => subjects.filter((s) => s.status === 'foco').sort((a, b) => a.sort_order - b.sort_order),
    [subjects],
  );

  // ---- Agenda do dia selecionado ----
  const todays = useMemo(() => activitiesForDate(activities, date), [activities, date]);
  const todaySubjects = useMemo(() => subjectsForDate(subjects, date), [subjects, date]);
  const subjectsDone = todaySubjects.filter((s) => studiedOn(s.id, lessonLogs, date)).length;
  const doneSel = todays.filter((a) => isDone(completions, a.id, date)).length + subjectsDone;
  const totalSel = todays.length + todaySubjects.length;

  const toggleSubject = async (subjectId: string) => {
    const todayLogs = lessonLogs.filter((l) => l.subject_id === subjectId && l.date === date);
    if (todayLogs.length) await removeLessonLog(todayLogs[todayLogs.length - 1].id);
    else await addLessonLog(subjectId, date, null);
  };
  const moduleOf = (id: string | null) => (id ? modules.find((m) => m.id === id) : undefined);
  const colorOf = (s: Subject) => s.color || moduleOf(s.module_id)?.color || 'var(--gold)';
  const groups = modules
    .map((m) => ({ module: m, items: todays.filter((a) => a.module_id === m.id) }))
    .filter((g) => g.items.length > 0);

  const pageOf = (s: Subject) => ((s.kind ?? 'estudo') === 'carreira' ? '/carreira' : '/materias');

  return (
    <>
      <div className="mb-1 font-serif text-2xl font-semibold">
        {greeting()} 👋
      </div>
      <p className="mb-5 text-[13px] text-ink-muted">{fmtLong(today)}</p>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Hoje" value={`${pct(kDone, kTotal)}%`} sub={`${kDone}/${kTotal} do dia`} icon="sun" accent="var(--accent)" />
        <Kpi label="Em foco" value={`${totalFoco}/${FOCUS_LIMIT}`} sub="1 matéria + 2 cursos" icon="grad" />
        <Kpi label="Na semana" value={String(study.lessonsThisWeek)} sub="aulas registradas" icon="check" />
        <Kpi label="Sequência" value={`${streak}`} sub="dias seguidos" icon="fire" accent="var(--gold)" />
        <Kpi label="Horas" value={`${study.hours.toFixed(0)}h`} sub="estudadas no total" icon="clock" />
        <Kpi label="Conclusão" value={roadmapEnd ? fmtMonthYear(roadmapEnd) : '—'} sub="previsão (roadmap)" icon="calendar" />
      </div>

      {/* Em foco agora */}
      {focoSubjects.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="eyebrow">Em foco agora</div>
            <button className="text-[12px] text-ink-muted hover:text-ink" onClick={() => navigate('/roadmap')}>
              ver roadmap →
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {focoSubjects.map((s) => {
              const st = subjectStats(s, lessonLogs);
              const plan = subjectPlan(s, lessonLogs);
              const color = colorOf(s);
              const goal = plan.requiredWeekly ?? 0;
              return (
                <div key={s.id} className="rounded border border-line bg-surface p-4">
                  <button className="flex w-full items-center gap-2 text-left font-semibold" onClick={() => navigate(pageOf(s))}>
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: color }} />
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    <span className="font-mono text-[12px] text-ink-muted">{st.pct}%</span>
                  </button>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <span className="block h-full rounded-full" style={{ width: `${st.pct}%`, background: color }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>
                      {st.done}/{st.total} · faltam {st.remaining}
                    </span>
                    {goal > 0 ? (
                      <span className="font-mono">
                        sem: {plan.weekDone}/{goal}
                      </span>
                    ) : (
                      <span className="text-faint">sem meta</span>
                    )}
                  </div>
                  <button
                    className="btn btn-gold btn-sm mt-3 w-full"
                    onClick={() => addLessonLog(s.id, today, null)}
                    disabled={st.done >= st.total}
                  >
                    <Icon name="plus" size={14} /> registrar aula
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leitura */}
      {(booksTotal > 0 || bibleRead > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <button className="rounded border border-line bg-surface p-4 text-left transition hover:border-line-strong" onClick={() => navigate('/leitura-dirigida')}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold">
                <Icon name="book" size={15} /> Leitura Dirigida
              </span>
              <span className="font-mono text-[12px] text-ink-muted">{pct(booksRead, booksTotal)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${pct(booksRead, booksTotal)}%` }} />
            </div>
            <div className="mt-1.5 text-[11px] text-ink-muted">{booksRead} de {booksTotal} capítulos</div>
          </button>
          <button className="rounded border border-line bg-surface p-4 text-left transition hover:border-line-strong" onClick={() => navigate('/biblia')}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold" style={{ color: 'var(--gold)' }}>
                <Icon name="cross" size={15} /> <span className="text-ink">Leitura Bíblica</span>
              </span>
              <span className="font-mono text-[12px] text-ink-muted">{pct(bibleRead, BIBLE_TOTAL_CHAPTERS)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <span className="block h-full rounded-full" style={{ width: `${pct(bibleRead, BIBLE_TOTAL_CHAPTERS)}%`, background: 'var(--gold)' }} />
            </div>
            <div className="mt-1.5 text-[11px] text-ink-muted">{bibleRead} de {BIBLE_TOTAL_CHAPTERS} capítulos</div>
          </button>
        </div>
      )}

      {/* Agenda do dia */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="eyebrow">
          {isToday(date) ? 'Agenda de hoje' : `Agenda · ${fmtLong(date)}`}
          {totalSel > 0 && <span className="ml-2 font-mono text-faint">{doneSel}/{totalSel}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button className="icon-btn h-9 w-9" onClick={() => setDate((d) => addDays(d, -1))} title="Dia anterior">
            <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setDate(toISO())}>
            Hoje
          </button>
          <button className="icon-btn h-9 w-9" onClick={() => setDate((d) => addDays(d, 1))} title="Próximo dia">
            <Icon name="arrow" size={15} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCreating(true)}>
            <Icon name="plus" size={15} /> Atividade
          </button>
        </div>
      </div>

      {groups.length === 0 && todaySubjects.length === 0 ? (
        <div className="card grid place-items-center py-14 text-center text-ink-muted">
          <div className="mb-2 text-3xl opacity-40">✧</div>
          Nada programado para este dia. Coloque matérias em foco ou crie uma atividade.
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

      {todaySubjects.length > 0 && (
        <div className="card mt-4">
          <div className="card-title">
            <span className="flex items-center gap-2" style={{ color: 'var(--gold)' }}>
              <Icon name="grad" size={15} />
              <span className="text-ink">Matérias de hoje</span>
            </span>
            <span className="font-mono text-faint">
              {subjectsDone}/{todaySubjects.length}
            </span>
          </div>
          {todaySubjects.map((s) => {
            const st = subjectStats(s, lessonLogs);
            const studied = studiedOn(s.id, lessonLogs, date);
            const color = colorOf(s);
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3.5 border-b border-line px-1 py-3 transition last:border-none ${
                  studied ? 'opacity-60' : ''
                }`}
              >
                <Checkbox done={studied} color={color} onToggle={() => toggleSubject(s.id)} />
                <div className="min-w-0 flex-1">
                  <div className={`font-medium ${studied ? 'text-ink-muted line-through decoration-faint' : ''}`}>{s.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      Aula {Math.min(st.done + 1, st.total)} de {st.total}
                    </span>
                    {s.recurrence === 'once' && <span className="text-gold">pontual</span>}
                  </div>
                </div>
                <span className="whitespace-nowrap rounded-md bg-surface-3 px-2 py-0.5 font-mono text-[11px] text-ink-muted">
                  {st.pct}%
                </span>
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

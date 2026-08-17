import { useState } from 'react';
import { Modal, Field } from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from './Toast';
import { WD3, toISO } from '../lib/date';
import type { Subject, SubjectKind, SubjectSchedule } from '../lib/types';

interface Props {
  subject?: Subject | null;
  kind?: SubjectKind;
  onClose: () => void;
}

export function SubjectModal({ subject, kind = 'estudo', onClose }: Props) {
  const { modules, addSubject, updateSubject, deleteSubject } = useData();
  const toast = useToast();
  const isNew = !subject;

  const [name, setName] = useState(subject?.name ?? '');
  const [moduleId, setModuleId] = useState<string>(subject?.module_id ?? '');
  const [total, setTotal] = useState<string>(subject ? String(subject.total_lessons) : '100');
  const [notes, setNotes] = useState(subject?.notes ?? '');
  const [recurrence, setRecurrence] = useState<SubjectSchedule>(subject?.recurrence ?? 'none');
  const [days, setDays] = useState<number[]>(subject?.days_of_week?.length ? subject.days_of_week : [1, 3]);
  const [studyDate, setStudyDate] = useState<string>(subject?.study_date ?? toISO());

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const save = async () => {
    if (!name.trim()) return;
    if (recurrence === 'fixed' && days.length === 0) {
      toast('Escolha ao menos um dia da semana', 'danger');
      return;
    }
    const payload = {
      kind: subject?.kind ?? kind,
      name: name.trim(),
      module_id: moduleId || null,
      total_lessons: Math.max(1, Number(total) || 1),
      notes: notes.trim() || null,
      recurrence,
      days_of_week: recurrence === 'fixed' ? days : [],
      study_date: recurrence === 'once' ? studyDate : null,
    };
    try {
      if (isNew) {
        await addSubject(payload);
        toast('Matéria criada', 'success');
      } else {
        await updateSubject(subject!.id, payload);
        toast('Matéria atualizada', 'success');
      }
      onClose();
    } catch (e) {
      console.error('Erro ao salvar matéria:', e);
      const msg = e instanceof Error ? e.message : String(e);
      // Dica quando o banco ainda não tem as tabelas/colunas de matérias.
      const hint = /column|relation|schema|does not exist|find the/i.test(msg)
        ? ' — rode o SQL de configuração das Matérias no Supabase (veja a última mensagem do chat).'
        : '';
      toast('Não foi possível salvar' + hint, 'danger');
    }
  };

  const remove = async () => {
    if (!subject) return;
    if (!confirm(`Excluir "${subject.name}" e todo o histórico de aulas?`)) return;
    await deleteSubject(subject.id);
    toast('Matéria excluída');
    onClose();
  };

  const noun = (subject?.kind ?? kind) === 'carreira' ? 'curso' : 'matéria';

  return (
    <Modal
      title={isNew ? `Nov${noun === 'curso' ? 'o' : 'a'} ${noun}` : `Editar ${noun}`}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button className="btn btn-danger mr-auto" onClick={remove}>
              Excluir
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={save}>
            {isNew ? 'Criar' : 'Salvar'}
          </button>
        </>
      }
    >
      <Field label="Nome">
        <input
          className="inp"
          value={name}
          autoFocus
          placeholder={noun === 'curso' ? 'Ex: Vendas, Excel avançado, Liderança...' : 'Ex: Filosofia, Cálculo I, Direito...'}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Total de aulas">
          <input className="inp" type="number" min={1} value={total} onChange={(e) => setTotal(e.target.value)} />
        </Field>
        <Field label="Módulo (opcional)">
          <select className="inp" value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
            <option value="">— nenhum —</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Quando estudar?">
        <div className="inline-flex w-full gap-1 rounded-sm border border-line bg-surface p-1">
          {(
            [
              ['none', 'Não agendar'],
              ['fixed', 'Fixa (semanal)'],
              ['once', 'Pontual (um dia)'],
            ] as const
          ).map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setRecurrence(val)}
              className={`flex-1 rounded-[6px] px-2 py-2 text-[12px] font-semibold transition ${
                recurrence === val ? 'bg-surface-3 text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </Field>

      {recurrence === 'fixed' && (
        <Field label="Em quais dias?">
          <div className="flex flex-wrap gap-2">
            {WD3.map((w, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`h-10 w-11 rounded-sm border text-[12.5px] font-semibold transition ${
                  days.includes(i)
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-line bg-surface-2 text-ink-muted hover:border-line-strong'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </Field>
      )}

      {recurrence === 'once' && (
        <Field label="Data do estudo">
          <input className="inp" type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)} />
        </Field>
      )}

      {recurrence !== 'none' && (
        <p className="-mt-1 text-[12px] text-ink-muted">
          Vai aparecer no painel <b>Hoje</b> e no <b>Cronograma</b> nos dias marcados. Marcar lá registra 1 aula.
        </p>
      )}

      <Field label="Notas (opcional)">
        <textarea className="inp" value={notes} placeholder="Ementa, links, objetivos..." onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Modal>
  );
}

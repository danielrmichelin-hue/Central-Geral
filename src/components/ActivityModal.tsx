import { useState } from 'react';
import { Modal, Field } from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from './Toast';
import { WD3, toISO } from '../lib/date';
import type { Activity, Recurrence } from '../lib/types';

interface Props {
  activity?: Activity | null;
  defaultModuleId?: string;
  defaultRecurrence?: Recurrence;
  defaultDays?: number[];
  defaultDate?: string;
  onClose: () => void;
}

export function ActivityModal({
  activity,
  defaultModuleId,
  defaultRecurrence,
  defaultDays,
  defaultDate,
  onClose,
}: Props) {
  const { modules, addActivity, updateActivity, deleteActivity } = useData();
  const toast = useToast();
  const isNew = !activity;

  const [title, setTitle] = useState(activity?.title ?? '');
  const [moduleId, setModuleId] = useState(activity?.module_id ?? defaultModuleId ?? modules[0]?.id ?? '');
  const [recurrence, setRecurrence] = useState<Recurrence>(activity?.recurrence ?? defaultRecurrence ?? 'fixed');
  const [days, setDays] = useState<number[]>(activity?.days_of_week ?? defaultDays ?? [1, 3]);
  const [date, setDate] = useState<string>(activity?.date ?? defaultDate ?? toISO());
  const [time, setTime] = useState<string>(activity?.time ?? '');
  const [duration, setDuration] = useState<string>(activity?.duration_min ? String(activity.duration_min) : '');
  const [notes, setNotes] = useState<string>(activity?.notes ?? '');

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const save = async () => {
    if (!title.trim()) return;
    if (recurrence === 'fixed' && days.length === 0) {
      toast('Escolha ao menos um dia da semana', 'danger');
      return;
    }
    const payload = {
      module_id: moduleId,
      title: title.trim(),
      notes: notes.trim() || null,
      recurrence,
      days_of_week: recurrence === 'fixed' ? days : [],
      date: recurrence === 'once' ? date : null,
      time: time || null,
      duration_min: duration ? Number(duration) : null,
    };
    if (isNew) {
      await addActivity(payload);
      toast('Atividade criada', 'success');
    } else {
      await updateActivity(activity!.id, payload);
      toast('Atividade atualizada', 'success');
    }
    onClose();
  };

  const remove = async () => {
    if (!activity) return;
    if (!confirm(`Excluir "${activity.title}"?`)) return;
    await deleteActivity(activity.id);
    toast('Atividade excluída');
    onClose();
  };

  return (
    <Modal
      title={isNew ? 'Nova atividade' : 'Editar atividade'}
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
      <Field label="O que é?">
        <input
          className="inp"
          value={title}
          autoFocus
          placeholder="Ex: Estudar Filosofia, Trocar lâmpada, Deep work..."
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
      </Field>

      <Field label="Módulo">
        <select className="inp" value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Frequência">
        <div className="inline-flex w-full gap-1 rounded-sm border border-line bg-surface p-1">
          {(
            [
              ['fixed', 'Toda semana (fixa)'],
              ['once', 'Só neste dia (pontual)'],
            ] as const
          ).map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setRecurrence(val)}
              className={`flex-1 rounded-[6px] px-3 py-2 text-[12.5px] font-semibold transition ${
                recurrence === val ? 'bg-surface-3 text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </Field>

      {recurrence === 'fixed' ? (
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
      ) : (
        <Field label="Data">
          <input className="inp" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Horário (opcional)">
          <input className="inp" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="Duração (min)">
          <input
            className="inp"
            type="number"
            min={0}
            placeholder="60"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Notas (opcional)">
        <textarea className="inp" value={notes} placeholder="Detalhes, links, contexto..." onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Modal>
  );
}

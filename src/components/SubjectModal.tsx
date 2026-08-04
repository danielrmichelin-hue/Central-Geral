import { useState } from 'react';
import { Modal, Field } from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from './Toast';
import type { Subject } from '../lib/types';

interface Props {
  subject?: Subject | null;
  onClose: () => void;
}

export function SubjectModal({ subject, onClose }: Props) {
  const { modules, addSubject, updateSubject, deleteSubject } = useData();
  const toast = useToast();
  const isNew = !subject;

  const [name, setName] = useState(subject?.name ?? '');
  const [moduleId, setModuleId] = useState<string>(subject?.module_id ?? '');
  const [total, setTotal] = useState<string>(subject ? String(subject.total_lessons) : '100');
  const [notes, setNotes] = useState(subject?.notes ?? '');

  const save = async () => {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      module_id: moduleId || null,
      total_lessons: Math.max(1, Number(total) || 1),
      notes: notes.trim() || null,
    };
    if (isNew) {
      await addSubject(payload);
      toast('Matéria criada', 'success');
    } else {
      await updateSubject(subject!.id, payload);
      toast('Matéria atualizada', 'success');
    }
    onClose();
  };

  const remove = async () => {
    if (!subject) return;
    if (!confirm(`Excluir "${subject.name}" e todo o histórico de aulas?`)) return;
    await deleteSubject(subject.id);
    toast('Matéria excluída');
    onClose();
  };

  return (
    <Modal
      title={isNew ? 'Nova matéria' : 'Editar matéria'}
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
      <Field label="Nome da matéria">
        <input
          className="inp"
          value={name}
          autoFocus
          placeholder="Ex: Filosofia, Cálculo I, Direito Constitucional..."
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
      <Field label="Notas (opcional)">
        <textarea className="inp" value={notes} placeholder="Ementa, links, objetivos..." onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Modal>
  );
}

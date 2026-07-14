import { useState } from 'react';
import { Modal, Field } from './Modal';
import { Icon, ICON_CHOICES } from '../lib/icons';
import { useData } from '../context/DataContext';
import { useToast } from './Toast';
import type { Module } from '../lib/types';

const COLORS = ['#6E8BFF', '#C9A961', '#4ADE80', '#FB923C', '#F87171', '#A78BFA', '#22D3EE', '#F472B6'];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function ModuleModal({ module, onClose }: { module?: Module | null; onClose: () => void }) {
  const { modules, addModule, updateModule, deleteModule } = useData();
  const toast = useToast();
  const isNew = !module;

  const [name, setName] = useState(module?.name ?? '');
  const [color, setColor] = useState(module?.color ?? COLORS[0]);
  const [icon, setIcon] = useState(module?.icon ?? 'layers');

  const save = async () => {
    if (!name.trim()) return;
    if (isNew) {
      await addModule({
        name: name.trim(),
        slug: slugify(name) || 'modulo-' + Date.now().toString(36),
        color,
        icon,
        sort_order: modules.length + 1,
      });
      toast('Módulo criado', 'success');
    } else {
      await updateModule(module!.id, { name: name.trim(), color, icon });
      toast('Módulo atualizado', 'success');
    }
    onClose();
  };

  const remove = async () => {
    if (!module) return;
    if (!confirm(`Excluir o módulo "${module.name}" e todas as suas atividades?`)) return;
    await deleteModule(module.id);
    toast('Módulo excluído');
    onClose();
  };

  return (
    <Modal
      title={isNew ? 'Novo módulo' : 'Editar módulo'}
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
      <Field label="Nome do módulo">
        <input
          className="inp"
          value={name}
          autoFocus
          placeholder="Ex: Finanças, Saúde, Relacionamentos..."
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Cor">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="h-8 w-8 rounded-full transition"
              style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : undefined }}
            />
          ))}
        </div>
      </Field>
      <Field label="Ícone">
        <div className="flex flex-wrap gap-2">
          {ICON_CHOICES.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className={`grid h-10 w-10 place-items-center rounded-sm border transition ${
                icon === ic ? 'border-accent' : 'border-line text-ink-muted hover:border-line-strong'
              }`}
              style={icon === ic ? { color } : undefined}
            >
              <Icon name={ic} size={18} />
            </button>
          ))}
        </div>
      </Field>
    </Modal>
  );
}

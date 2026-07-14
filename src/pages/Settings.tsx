import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ModuleModal } from '../components/ModuleModal';
import { Icon } from '../lib/icons';
import { toISO } from '../lib/date';
import type { Module } from '../lib/types';

export function Settings() {
  const { modules, activities, completions } = useData();
  const { user, configured, signOut } = useAuth();
  const toast = useToast();
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [creatingModule, setCreatingModule] = useState(false);

  const exportData = () => {
    const dump = {
      _app: 'Central Geral',
      _exportedAt: new Date().toISOString(),
      modules,
      activities,
      completions,
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `central-geral-backup-${toISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup exportado', 'success');
  };

  return (
    <>
      <div className="mb-5 font-serif text-2xl font-semibold">Ajustes</div>

      {/* Conexão */}
      <div className="card mb-4">
        <div className="card-title">Conexão</div>
        <div className="flex items-center gap-3">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: configured ? 'var(--success)' : 'var(--warning)' }}
          />
          <div className="flex-1">
            <div className="font-medium">
              {configured ? 'Supabase conectado' : 'Modo demonstração (local)'}
            </div>
            <div className="text-[13px] text-ink-muted">
              {configured
                ? `Seus dados estão sincronizados na nuvem${user?.email ? ' · ' + user.email : ''}.`
                : 'Os dados ficam só neste navegador. Configure o Supabase (README) para sincronizar e ter login real.'}
            </div>
          </div>
        </div>
      </div>

      {/* Módulos */}
      <div className="card mb-4">
        <div className="card-title">
          Seus módulos
          <button className="btn btn-ghost btn-sm" onClick={() => setCreatingModule(true)}>
            <Icon name="plus" size={14} /> Novo módulo
          </button>
        </div>
        <div className="space-y-2">
          {modules.map((m) => {
            const count = activities.filter((a) => a.module_id === m.id).length;
            return (
              <button
                key={m.id}
                onClick={() => setEditingModule(m)}
                className="flex w-full items-center gap-3 rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-left transition hover:border-line-strong"
              >
                <span className="grid h-9 w-9 place-items-center rounded-sm" style={{ background: `${m.color}22`, color: m.color }}>
                  <Icon name={m.icon} size={18} />
                </span>
                <div className="flex-1">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-ink-muted">{count} atividade{count !== 1 ? 's' : ''}</div>
                </div>
                <Icon name="edit" size={15} className="text-faint" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Backup */}
      <div className="card mb-4">
        <div className="card-title">Backup dos dados</div>
        <p className="mb-4 text-[13px] text-ink-muted">
          Exporte um arquivo JSON com todos os seus módulos, atividades e histórico. Guarde regularmente.
        </p>
        <button className="btn btn-primary" onClick={exportData}>
          <Icon name="arrow" size={15} style={{ transform: 'rotate(90deg)' }} /> Exportar tudo (JSON)
        </button>
      </div>

      {/* Sair */}
      <div className="card">
        <div className="card-title">Sessão</div>
        <button className="btn btn-danger" onClick={signOut}>
          <Icon name="logout" size={15} /> {user?.demo ? 'Sair do modo demo' : 'Sair'}
        </button>
      </div>

      <AnimatePresence>
        {creatingModule && <ModuleModal onClose={() => setCreatingModule(false)} />}
        {editingModule && <ModuleModal module={editingModule} onClose={() => setEditingModule(null)} />}
      </AnimatePresence>
    </>
  );
}

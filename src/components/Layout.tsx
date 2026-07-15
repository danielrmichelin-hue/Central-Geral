import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../lib/icons';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { computeStreak } from '../lib/logic';

export function Layout() {
  const { modules, completions } = useData();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const streak = computeStreak(completions);
  const loc = useLocation();

  const navItem = (to: string, icon: string, label: string, color?: string) => (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={() => setOpen(false)}
      className={({ isActive }) =>
        `relative flex w-full items-center gap-3 rounded-sm px-3 py-2 text-[13.5px] font-medium transition ${
          isActive ? 'bg-surface-2 text-ink' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute -left-3 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r bg-accent" />
          )}
          <span style={color ? { color } : undefined} className="opacity-90">
            <Icon name={icon} size={17} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[236px] flex-col gap-0.5 border-r border-line bg-surface px-3 py-[18px] transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-0.5 px-2.5 pb-4 pt-1">
          <div className="font-serif text-[19px] font-semibold leading-tight">
            Central <span className="text-gold">Geral</span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[1.6px] text-faint">Sua vida, em módulos</div>
        </div>

        {navItem('/', 'sun', 'Hoje')}

        <div className="px-3 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-faint">
          Módulos
        </div>
        {modules.map((m) => navItem(`/m/${m.slug}`, m.icon, m.name, m.color))}

        <div className="px-3 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-faint">
          Leitura
        </div>
        {navItem('/biblia', 'cross', 'Leitura Bíblica', 'var(--gold)')}

        <div className="px-3 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-faint">
          Sistema
        </div>
        {navItem('/cronograma', 'calendar', 'Cronograma')}
        {navItem('/ajustes', 'gear', 'Ajustes')}

        <div className="flex-1" />
        <div className="rounded-sm border border-line px-3 py-2.5 text-xs text-ink-muted">
          {user?.demo ? 'Modo demonstração' : user?.email || 'Conectado'}
        </div>
      </aside>

      {/* Backdrop mobile */}
      {open && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line px-5 py-4 backdrop-blur-md md:px-8"
             style={{ background: 'rgba(11,13,16,.82)' }}>
          <button
            className="grid h-9 w-9 place-items-center rounded-sm border border-line text-ink-muted md:hidden"
            onClick={() => setOpen(true)}
          >
            <Icon name="layers" size={18} />
          </button>
          <div className="flex-1" />
          {streak > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold tabular-nums"
              style={{ background: 'rgba(251,146,60,.13)', color: 'var(--streak)' }}
            >
              <Icon name="fire" size={15} />
              {streak} {streak === 1 ? 'dia' : 'dias'}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.3, 1] }}
            className="mx-auto max-w-[1240px] px-5 pb-24 pt-7 md:px-8"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

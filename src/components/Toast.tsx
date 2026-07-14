import { createContext, useCallback as _u, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastItem {
  id: string;
  msg: string;
  tone: 'default' | 'success' | 'danger';
}

const Ctx = createContext<(msg: string, tone?: ToastItem['tone']) => void>(() => {});
export const useToast = () => useContext(Ctx);

// (evita import não usado do React em alguns setups)
void _u;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = (msg: string, tone: ToastItem['tone'] = 'default') => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, msg, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2600);
  };

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2.5">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.3, 1] }}
              className="flex items-center gap-2.5 rounded-full border border-line-strong bg-surface-3 px-5 py-2.5 text-sm font-medium shadow-soft"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    t.tone === 'danger' ? 'var(--danger)' : t.tone === 'success' ? 'var(--success)' : 'var(--accent)',
                }}
              />
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

import { useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../lib/icons';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ title, onClose, children, footer }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 pt-[12vh]"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-[min(540px,94vw)] overflow-hidden rounded-lg border border-line-strong bg-surface shadow-soft"
        initial={{ y: 16, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 10, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.3, 1] }}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4 text-[15px] font-semibold">
          {title}
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-sm text-ink-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="plus" size={18} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2.5 border-t border-line px-6 py-3.5">{footer}</div>}
      </motion.div>
    </motion.div>
  );
}

export function Field({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold text-ink-muted">{label}</span>}
      {children}
    </label>
  );
}

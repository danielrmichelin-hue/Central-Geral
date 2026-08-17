import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Ring } from '../components/Ring';
import { BookModal } from '../components/BookModal';
import { Icon } from '../lib/icons';
import { pct } from '../lib/date';
import type { Book } from '../lib/types';

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

export function BooksPage() {
  const { books, updateBook } = useData();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);

  const active = useMemo(
    () => books.filter((b) => b.active).sort((a, b) => a.sort_order - b.sort_order),
    [books],
  );

  const totalRead = active.reduce((a, b) => a + Math.min(b.chapters_read, b.total_chapters), 0);
  const totalChapters = active.reduce((a, b) => a + b.total_chapters, 0);
  const done = active.filter((b) => b.chapters_read >= b.total_chapters).length;

  const setRead = (b: Book, next: number) =>
    updateBook(b.id, { chapters_read: Math.min(b.total_chapters, Math.max(0, next)) });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-serif text-2xl font-semibold">Leitura Dirigida</div>
          <p className="mt-1 text-[13px] text-ink-muted">
            Seus livros com progresso por capítulos — quanto já leu, quanto falta e o percentual.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
          <Icon name="plus" size={15} /> Novo livro
        </button>
      </div>

      {/* Indicadores gerais */}
      <div className="card mb-5">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
          <div className="flex items-center gap-5">
            <Ring pct={pct(totalRead, totalChapters)} size={92} />
            <div>
              <div className="eyebrow">Progresso geral da leitura</div>
              <div className="my-0.5 font-serif text-lg font-semibold">
                {totalRead} de {totalChapters} capítulos
              </div>
              <div className="text-[13px] text-ink-muted">
                {done} livro{done !== 1 ? 's' : ''} concluído{done !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <Stat v={String(active.length)} k="Livros" />
            <Stat v={String(totalRead)} k="Capítulos lidos" />
            <Stat v={String(Math.max(0, totalChapters - totalRead))} k="Faltam" />
            <Stat v={String(done)} k="Concluídos" />
          </div>
        </div>
      </div>

      {/* Lista de livros */}
      {active.length === 0 ? (
        <div className="card grid place-items-center py-14 text-center text-ink-muted">
          <div className="mb-2 text-3xl opacity-40">📖</div>
          Nenhum livro ainda. Adicione o primeiro e defina quantos capítulos ele tem.
        </div>
      ) : (
        <div className="space-y-2.5">
          {active.map((b) => {
            const read = Math.min(b.chapters_read, b.total_chapters);
            const p = pct(read, b.total_chapters);
            const isDone = read >= b.total_chapters;
            const color = isDone ? 'var(--success)' : 'var(--accent)';
            return (
              <div
                key={b.id}
                className="flex flex-wrap items-center gap-4 rounded border border-line bg-surface p-4 transition hover:border-line-strong"
              >
                <button className="min-w-[180px] flex-1 text-left" onClick={() => setEditing(b)}>
                  <div className="flex items-center gap-2 font-semibold">
                    <Icon name="book" size={15} style={{ color }} />
                    {b.title}
                    {isDone && (
                      <span className="text-success">
                        <Icon name="check" size={15} />
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-ink-muted">
                    {b.author ? `${b.author} · ` : ''}Capítulo {Math.min(read + 1, b.total_chapters)} de {b.total_chapters}
                  </div>
                </button>

                <div className="w-[160px]">
                  <Bar value={p} color={color} />
                </div>
                <div className="w-[76px] text-right">
                  <div className="font-mono font-semibold tabular-nums">{p}%</div>
                  <div className="text-[11px] text-ink-muted">faltam {Math.max(0, b.total_chapters - read)}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={read === 0}
                    onClick={() => setRead(b, read - 1)}
                    title="Tirar 1 capítulo"
                  >
                    <Icon name="minus" size={14} />
                  </button>
                  <button
                    className="btn btn-gold btn-sm"
                    disabled={isDone}
                    onClick={() => setRead(b, read + 1)}
                    title="Marcar +1 capítulo lido"
                  >
                    <Icon name="plus" size={14} /> cap.
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {creating && <BookModal onClose={() => setCreating(false)} />}
        {editing && <BookModal book={editing} onClose={() => setEditing(null)} />}
      </AnimatePresence>
    </>
  );
}

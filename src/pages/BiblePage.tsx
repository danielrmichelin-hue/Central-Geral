import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Ring } from '../components/Ring';
import { Modal } from '../components/Modal';
import { Icon } from '../lib/icons';
import { pct } from '../lib/date';
import { BIBLE_BOOKS, BIBLE_TOTAL_CHAPTERS, classificacoesDe, type BibleBook, type Testament } from '../lib/bible';

export function BiblePage() {
  const { bibleReading, toggleBibleChapter } = useData();
  const [test, setTest] = useState<Testament>('velho');
  const [openBook, setOpenBook] = useState<BibleBook | null>(null);

  const readByBook = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const r of bibleReading) {
      if (!map.has(r.book_id)) map.set(r.book_id, new Set());
      map.get(r.book_id)!.add(r.chapter);
    }
    return map;
  }, [bibleReading]);

  const chaps = (bookId: string) => readByBook.get(bookId)?.size ?? 0;
  const bookPct = (b: BibleBook) => pct(chaps(b.id), b.totalCapitulos);

  const totalRead = BIBLE_BOOKS.reduce((a, b) => a + chaps(b.id), 0);
  const done = BIBLE_BOOKS.filter((b) => chaps(b.id) >= b.totalCapitulos).length;
  const andamento = BIBLE_BOOKS.filter((b) => {
    const c = chaps(b.id);
    return c > 0 && c < b.totalCapitulos;
  }).length;

  return (
    <>
      {/* Hero */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-6">
          <Ring pct={pct(totalRead, BIBLE_TOTAL_CHAPTERS)} />
          <div>
            <div className="eyebrow">Leitura Bíblica · progresso geral</div>
            <div className="my-1 font-serif text-xl font-semibold">
              {totalRead} de {BIBLE_TOTAL_CHAPTERS} capítulos
            </div>
            <div className="text-[13px] text-ink-muted">
              {done} livros concluídos · {andamento} em andamento
            </div>
          </div>
        </div>
      </div>

      {/* Testamento */}
      <div className="mb-4 inline-flex gap-1 rounded-sm border border-line bg-surface p-1">
        {(
          [
            ['velho', 'Velho Testamento'],
            ['novo', 'Novo Testamento'],
          ] as const
        ).map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setTest(val)}
            className={`rounded-[6px] px-3 py-1.5 text-[12.5px] font-semibold transition ${
              test === val ? 'bg-surface-3 text-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Grupos */}
      {classificacoesDe(test).map((cl) => {
        const livros = BIBLE_BOOKS.filter((b) => b.testamento === test && b.classificacao === cl);
        return (
          <div key={cl} className="mb-6">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold">{cl}</h4>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2.5">
              {livros.map((b) => {
                const c = chaps(b.id);
                const p = bookPct(b);
                const isDone = p >= 100;
                return (
                  <button
                    key={b.id}
                    onClick={() => setOpenBook(b)}
                    className={`rounded-sm border bg-surface p-2.5 text-left transition hover:bg-surface-2 ${
                      isDone ? 'border-success/30' : 'border-line hover:border-line-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 text-[13px] font-semibold">
                      {b.nome}
                      {isDone && (
                        <span className="text-success">
                          <Icon name="check" size={14} />
                        </span>
                      )}
                    </div>
                    <div className="my-1.5 font-mono text-[11px] text-ink-muted">
                      {c}/{b.totalCapitulos}
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-surface-3">
                      <span
                        className="block h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${p}%`, background: isDone ? 'var(--success)' : 'var(--accent)' }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <AnimatePresence>
        {openBook && (
          <Modal
            title={openBook.nome}
            onClose={() => setOpenBook(null)}
            footer={
              <button className="btn btn-primary" onClick={() => setOpenBook(null)}>
                Concluído
              </button>
            }
          >
            <p className="text-[13px] text-ink-muted">
              {openBook.nome} · {chaps(openBook.id)} de {openBook.totalCapitulos} capítulos. Toque para marcar.
            </p>
            <div className="grid grid-cols-[repeat(8,1fr)] gap-1.5">
              {Array.from({ length: openBook.totalCapitulos }, (_, i) => i + 1).map((c) => {
                const isRead = readByBook.get(openBook.id)?.has(c) ?? false;
                return (
                  <button
                    key={c}
                    onClick={() => toggleBibleChapter(openBook.id, c)}
                    className="rounded-[6px] border py-2 text-center font-mono text-[12px] font-semibold transition"
                    style={{
                      borderColor: isRead ? 'var(--success)' : 'var(--line)',
                      background: isRead ? 'rgba(74,222,128,.13)' : 'var(--surface-2)',
                      color: isRead ? 'var(--success)' : 'var(--muted)',
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

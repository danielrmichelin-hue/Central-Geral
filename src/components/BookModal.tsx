import { useState } from 'react';
import { Modal, Field } from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from './Toast';
import type { Book } from '../lib/types';

interface Props {
  book?: Book | null;
  onClose: () => void;
}

export function BookModal({ book, onClose }: Props) {
  const { addBook, updateBook, deleteBook } = useData();
  const toast = useToast();
  const isNew = !book;

  const [title, setTitle] = useState(book?.title ?? '');
  const [author, setAuthor] = useState(book?.author ?? '');
  const [total, setTotal] = useState<string>(book ? String(book.total_chapters) : '20');
  const [read, setRead] = useState<string>(book ? String(book.chapters_read) : '0');
  const [notes, setNotes] = useState(book?.notes ?? '');

  const save = async () => {
    if (!title.trim()) return;
    const totalN = Math.max(1, Number(total) || 1);
    const readN = Math.min(totalN, Math.max(0, Number(read) || 0));
    const payload = {
      title: title.trim(),
      author: author.trim() || null,
      total_chapters: totalN,
      chapters_read: readN,
      notes: notes.trim() || null,
    };
    try {
      if (isNew) {
        await addBook(payload);
        toast('Livro adicionado', 'success');
      } else {
        await updateBook(book!.id, payload);
        toast('Livro atualizado', 'success');
      }
      onClose();
    } catch (e) {
      console.error('Erro ao salvar livro:', e);
      const msg = e instanceof Error ? e.message : String(e);
      const hint = /column|relation|schema|does not exist|find the/i.test(msg)
        ? ' — rode o SQL da tabela de livros no Supabase (veja a última mensagem do chat).'
        : '';
      toast('Não foi possível salvar' + hint, 'danger');
    }
  };

  const remove = async () => {
    if (!book) return;
    if (!confirm(`Excluir "${book.title}"?`)) return;
    await deleteBook(book.id);
    toast('Livro excluído');
    onClose();
  };

  return (
    <Modal
      title={isNew ? 'Novo livro' : 'Editar livro'}
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
            {isNew ? 'Adicionar' : 'Salvar'}
          </button>
        </>
      }
    >
      <Field label="Título">
        <input
          className="inp"
          value={title}
          autoFocus
          placeholder="Ex: A República, Sapiens, Hábitos Atômicos..."
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
      </Field>
      <Field label="Autor (opcional)">
        <input className="inp" value={author} placeholder="Ex: Platão" onChange={(e) => setAuthor(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Total de capítulos">
          <input className="inp" type="number" min={1} value={total} onChange={(e) => setTotal(e.target.value)} />
        </Field>
        <Field label="Capítulos já lidos">
          <input className="inp" type="number" min={0} value={read} onChange={(e) => setRead(e.target.value)} />
        </Field>
      </div>
      <Field label="Notas (opcional)">
        <textarea className="inp" value={notes} placeholder="Anotações, citações, objetivo..." onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Modal>
  );
}

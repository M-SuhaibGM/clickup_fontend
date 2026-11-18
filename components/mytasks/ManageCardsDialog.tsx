'use client';

import { useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { CARDS, type CardId } from './types';

/** Switch cards on and off. Hidden cards keep their place and come back where they were. */
export default function ManageCardsDialog({
  hidden, onToggle, onReset, onClose,
}: {
  hidden: CardId[];
  onToggle: (id: CardId) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/60 p-4 pt-[12vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-cards-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[color:var(--mt-border)] bg-[color:var(--c-232426)] p-5 shadow-2xl"
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 id="manage-cards-title" className="text-[16px] font-bold text-[color:var(--c-white)]">Manage cards</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-3 text-[12.5px] text-[color:var(--c-8a8c91)]">Choose what shows on My Tasks. Drag a card by its grip to reorder.</p>

        <ul className="divide-y divide-[color:var(--mt-border)] rounded-xl border border-[color:var(--mt-border)]">
          {CARDS.map((c) => {
            const on = !hidden.includes(c.id);
            return (
              <li key={c.id} className="flex items-center gap-3 px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-[color:var(--c-white)]">{c.title}</p>
                  <p className="text-[12px] text-[color:var(--c-8a8c91)]">{c.desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={on}
                  aria-label={`Show ${c.title}`}
                  onClick={() => onToggle(c.id)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? 'bg-indigo-600' : 'bg-[color:var(--c-444548)]'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-center justify-between">
          <button onClick={onReset} className="flex items-center gap-1.5 text-[12.5px] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">
            <RotateCcw className="h-3.5 w-3.5" /> Reset to default
          </button>
          <button onClick={onClose} className="rounded-lg bg-[color:var(--c-white)] px-4 py-1.5 text-[13px] font-semibold text-[color:var(--c-1e1f21)] hover:opacity-85">Done</button>
        </div>
      </div>
    </div>
  );
}

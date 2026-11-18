'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#3b82f6'];

/** Same tag → same colour, everywhere. */
export const tagColor = (tag: string) => {
  let h = 0;
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

export default function TagsField({ tags, editable, onChange }: { tags: string[]; editable: boolean; onChange: (tags: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const t = draft.trim().slice(0, 30);
    setDraft('');
    if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...tags, t]);
    else setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium" style={{ color: tagColor(t), backgroundColor: `${tagColor(t)}22` }}>
          {t}
          {editable && (
            <button onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`} className="opacity-70 hover:opacity-100">
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {editable && adding ? (
        <input
          autoFocus
          value={draft}
          maxLength={30}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { commit(); setAdding(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { e.stopPropagation(); setDraft(''); setAdding(false); }
          }}
          placeholder="Tag name"
          className="w-24 rounded-md border border-[color:var(--c-333438)] bg-transparent px-2 py-0.5 text-[12px] text-[color:var(--c-white)] outline-none focus:border-indigo-500"
        />
      ) : editable ? (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[13px] text-[color:var(--c-8a8c91)] transition hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)]">
          {tags.length === 0 ? 'Empty' : <Plus className="h-3.5 w-3.5" />}
        </button>
      ) : (
        tags.length === 0 && <span className="px-2 text-[13px] text-[color:var(--c-8a8c91)]">Empty</span>
      )}
    </div>
  );
}

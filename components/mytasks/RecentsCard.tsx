'use client';

import { useRouter } from 'next/navigation';
import { CircleDot, Clock, FolderKanban } from 'lucide-react';
import { useRecents } from '@/lib/recents';

/** The tasks and projects you opened most recently. */
export default function RecentsCard({ onOpenTask }: { onOpenTask: (task: { id: string; listId: string }) => void }) {
  const router = useRouter();
  const recents = useRecents();

  if (recents.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 pb-6 text-center">
        <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--mt-border)] text-[color:var(--c-8a8c91)]"><Clock className="h-5 w-5" /></span>
        <p className="text-[14px] font-semibold text-[color:var(--c-white)]">Nothing here yet</p>
        <p className="text-[12.5px] text-[color:var(--c-8a8c91)]">Tasks and projects you open will show up here.</p>
      </div>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto px-2 pb-3 custom-scrollbar">
      {recents.map((r) => {
        const Icon = r.kind === 'task' ? CircleDot : FolderKanban;
        const open = () => (r.kind === 'task' ? r.listId && onOpenTask({ id: r.id, listId: r.listId }) : router.push(`/projects/${r.id}`));
        return (
          <li key={`${r.kind}-${r.id}`}>
            <button onClick={open} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-[color:var(--c-2a2b2e)]">
              <Icon className="h-4 w-4 shrink-0 text-[color:var(--c-8a8c91)]" />
              <span className="min-w-0 flex-1 truncate text-[14px] text-[color:var(--c-white)]">
                {r.title}
                {r.context && <span className="text-[color:var(--c-8a8c91)]"> · in {r.context}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

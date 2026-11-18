'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, ListChecks, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { apiError } from '@/lib/apiError';
import { useApi } from '@/lib/useApi';

interface PersonalTask {
  id: string;
  title: string;
  done: boolean;
}

/** A private to-do list: not tied to any project, only visible to you. */
export default function PersonalListCard({ workspaceId, reloadKey }: { workspaceId: string; reloadKey: number }) {
  const { data, loading, error, mutate } = useApi<{ tasks: PersonalTask[] }>(`/workspaces/${workspaceId}/personal-tasks`, undefined, reloadKey);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);

  const tasks = data?.tasks ?? [];
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const add = async () => {
    const title = draft.trim();
    if (!title) return;
    setDraft('');
    try {
      const { data: res } = await api.post<{ task: PersonalTask }>(`/workspaces/${workspaceId}/personal-tasks`, { title });
      mutate((d) => ({ tasks: [...d.tasks, res.task] }));
    } catch (err) {
      setDraft(title);
      toast.error(apiError(err, 'Failed to add the task'));
    }
  };

  const patch = async (task: PersonalTask, change: Partial<PersonalTask>) => {
    mutate((d) => ({ tasks: d.tasks.map((t) => (t.id === task.id ? { ...t, ...change } : t)) }));
    try {
      await api.patch(`/personal-tasks/${task.id}`, change);
    } catch (err) {
      mutate((d) => ({ tasks: d.tasks.map((t) => (t.id === task.id ? task : t)) }));
      toast.error(apiError(err, 'Failed to update the task'));
    }
  };

  const remove = async (task: PersonalTask) => {
    mutate((d) => ({ tasks: d.tasks.filter((t) => t.id !== task.id) }));
    try {
      await api.delete(`/personal-tasks/${task.id}`);
    } catch (err) {
      mutate((d) => ({ tasks: [...d.tasks, task] }));
      toast.error(apiError(err, 'Failed to delete the task'));
    }
  };

  const commitEdit = () => {
    if (!editing) return;
    const task = tasks.find((t) => t.id === editing.id);
    const title = editing.title.trim();
    setEditing(null);
    if (task && title && title !== task.title) patch(task, { title });
  };

  const row = (t: PersonalTask) => (
    <li key={t.id} className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-[color:var(--c-2a2b2e)]">
      <button onClick={() => patch(t, { done: !t.done })} aria-label={t.done ? 'Mark as to do' : 'Mark complete'} className="shrink-0 transition hover:scale-110">
        {t.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-[color:var(--c-8a8c91)]" />}
      </button>
      {editing?.id === t.id ? (
        <input
          autoFocus
          value={editing.title}
          maxLength={200}
          onChange={(e) => setEditing({ id: t.id, title: e.target.value })}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditing(null);
          }}
          className="min-w-0 flex-1 rounded border border-indigo-500 bg-[color:var(--c-1e1f21)] px-1.5 py-0.5 text-[13.5px] text-[color:var(--c-white)] outline-none"
        />
      ) : (
        <button onClick={() => setEditing({ id: t.id, title: t.title })} title="Click to rename" className={`min-w-0 flex-1 truncate text-left text-[13.5px] ${t.done ? 'text-[color:var(--c-8a8c91)] line-through' : 'text-[color:var(--c-white)]'}`}>
          {t.title}
        </button>
      )}
      <button onClick={() => remove(t)} aria-label="Delete" title="Delete" className="rounded p-1 text-[color:var(--c-8a8c91)] opacity-0 transition hover:text-red-400 group-hover:opacity-100">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );

  const addBox = (
    <div className="flex items-center gap-2 rounded-lg border border-indigo-500/60 bg-[color:var(--c-232426)] px-2.5 py-2">
      <Plus className="h-4 w-4 shrink-0 text-[color:var(--c-8a8c91)]" />
      <input
        autoFocus
        value={draft}
        maxLength={200}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') add();
          if (e.key === 'Escape') { setAdding(false); setDraft(''); }
        }}
        onBlur={() => !draft.trim() && setAdding(false)}
        placeholder="Task name (Enter to add)"
        className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
      />
      <button onClick={() => { setAdding(false); setDraft(''); }} aria-label="Cancel" className="text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]"><X className="h-3.5 w-3.5" /></button>
    </div>
  );

  if (loading && !data) return <p className="flex flex-1 items-center justify-center text-[13px] text-[color:var(--c-8a8c91)]">Loading…</p>;
  if (error && !data) return <p className="flex flex-1 items-center justify-center text-[13px] text-red-400">Couldn&apos;t load your personal list.</p>;

  if (tasks.length === 0 && !adding) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 pb-6 text-center">
        <span className="mb-1 flex h-14 w-14 items-center justify-center rounded-xl border border-[color:var(--mt-border)] text-[color:var(--c-8a8c91)]">
          <ListChecks className="h-6 w-6" />
        </span>
        <p className="text-[13px] text-[color:var(--c-8a8c91)]">Personal List is a home for your own tasks, visible only to you.</p>
        <button onClick={() => setAdding(true)} className="mt-2 flex items-center gap-1.5 rounded-md bg-[color:var(--c-white)] px-3 py-1.5 text-[13px] font-semibold text-[color:var(--c-1e1f21)] hover:opacity-85">
          <Plus className="h-3.5 w-3.5" /> Create a task
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
        <ul>{open.map(row)}</ul>
        {done.length > 0 && (
          <>
            <p className="px-2.5 pb-1 pt-3 text-[12px] font-semibold text-[color:var(--c-8a8c91)]">Done <span className="font-normal opacity-70">{done.length}</span></p>
            <ul>{done.map(row)}</ul>
          </>
        )}
      </div>
      <div className="shrink-0 border-t border-[color:var(--mt-border)] p-2">
        {adding ? addBox : (
          <button onClick={() => setAdding(true)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-[color:var(--c-8a8c91)] transition hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)]">
            <Plus className="h-4 w-4" /> Add a personal task
          </button>
        )}
      </div>
    </div>
  );
}

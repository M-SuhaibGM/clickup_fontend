'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronsLeftRight, Circle, CircleDashed, CheckCircle2, MoreHorizontal, Plus, X } from 'lucide-react';
import type { Task } from '@/types/task';
import TaskCard from './TaskCard';
import { MenuRow } from './ToolbarMenu';

export interface BoardGroup {
  key: string;
  label: string;
  color: string;
  tasks: Task[];
}

interface Props {
  group: BoardGroup;
  /** the status look (filled pills, tinted panel) only applies when grouping by status */
  statusStyle: boolean;
  isOver: boolean;
  canAdd: boolean;
  showSubtasks: boolean;
  onTaskClick: (task: Task) => void;
  /** resolves when the task was created; rejects (silently) on failure */
  onCreate: (title: string) => Promise<void>;
}

const STATUS_LOOK: Record<string, { panel: string; pill: string; icon: typeof Circle; addText: string }> = {
  TODO: { panel: 'bg-white/[0.04]', pill: 'bg-transparent text-[color:var(--c-e5e5e5)] border border-[color:var(--c-444548)]', icon: CircleDashed, addText: 'text-[color:var(--c-8a8c91)]' },
  IN_PROGRESS: { panel: 'bg-blue-500/[0.07]', pill: 'bg-blue-600 text-white', icon: Circle, addText: 'text-blue-400' },
  DONE: { panel: 'bg-emerald-500/[0.07]', pill: 'bg-emerald-600 text-white', icon: CheckCircle2, addText: 'text-emerald-400' },
};

export default function BoardColumn({ group, statusStyle, isOver, canAdd, showSubtasks, onTaskClick, onCreate }: Props) {
  const { setNodeRef } = useDroppable({ id: `group-${group.key}` });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const look = statusStyle ? STATUS_LOOK[group.key] : undefined;
  const Icon = look?.icon;
  const panel = look?.panel ?? 'bg-white/[0.04]';

  const submit = async () => {
    const name = title.trim();
    if (!name) return;
    try {
      await onCreate(name);
      setTitle(''); // stay open for the next one
    } catch { /* the store already toasts */ }
  };

  const pill: ReactNode = (
    <span
      className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${look?.pill ?? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)]'}`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} />}
      <span className="truncate max-w-[150px]">{group.label}</span>
    </span>
  );

  if (collapsed) {
    return (
      <div ref={setNodeRef} className={`w-12 shrink-0 self-start rounded-xl ${panel} ${isOver ? 'ring-1 ring-indigo-500/50' : ''}`}>
        <button onClick={() => setCollapsed(false)} aria-label={`Expand ${group.label}`} className="flex w-full flex-col items-center gap-3 py-3">
          <ChevronsLeftRight className="h-4 w-4 text-[color:var(--c-8a8c91)]" />
          <span className="text-[11px] text-[color:var(--c-8a8c91)]">{group.tasks.length}</span>
          <span className="text-[11px] font-bold uppercase text-[color:var(--c-e5e5e5)] [writing-mode:vertical-rl]">{group.label}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`group/col flex w-[264px] shrink-0 flex-col self-start rounded-xl p-2 transition-shadow ${panel} ${isOver ? 'ring-1 ring-indigo-500/50' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-1 pb-2 pt-0.5">
        {pill}
        <span className={`text-[13px] ${look ? look.addText : 'text-[color:var(--c-8a8c91)]'}`}>{group.tasks.length}</span>

        <div className="relative ml-auto flex items-center gap-0.5 opacity-0 group-hover/col:opacity-100 focus-within:opacity-100 transition-opacity" ref={menuRef}>
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="Column actions" className={`rounded p-1 hover:bg-white/10 ${look?.addText ?? 'text-[color:var(--c-8a8c91)]'}`}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {canAdd && (
            <button
              onClick={() => { setAdding(true); setCollapsed(false); }}
              aria-label={`Add task to ${group.label}`}
              className={`rounded p-1 hover:bg-white/10 ${look?.addText ?? 'text-[color:var(--c-8a8c91)]'}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] p-1 shadow-2xl">
              {canAdd && <MenuRow onClick={() => { setAdding(true); setMenuOpen(false); }}>Add task</MenuRow>}
              <MenuRow onClick={() => { setCollapsed(true); setMenuOpen(false); }}>Collapse column</MenuRow>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <SortableContext items={group.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {group.tasks.map((task) => (
            <TaskCard key={task.id} task={task} showSubtasks={showSubtasks} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </SortableContext>

      {/* Add task */}
      {canAdd &&
        (adding ? (
          <div className={`${group.tasks.length ? 'mt-2' : ''} rounded-xl border border-indigo-500/60 bg-[color:var(--c-1e1f21)] p-2.5`}>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') { setAdding(false); setTitle(''); }
              }}
              placeholder="Task name"
              className="w-full bg-transparent text-[13.5px] text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
            />
            <div className="mt-2 flex items-center justify-end gap-1.5">
              <button onClick={() => { setAdding(false); setTitle(''); }} aria-label="Cancel" className="rounded p-1 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">
                <X className="h-3.5 w-3.5" />
              </button>
              <button onClick={submit} disabled={!title.trim()} className="rounded bg-indigo-600 px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className={`${group.tasks.length ? 'mt-1' : ''} flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] hover:bg-white/5 transition ${look?.addText ?? 'text-[color:var(--c-8a8c91)]'}`}
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        ))}
    </div>
  );
}

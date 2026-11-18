'use client';

import { Circle, CheckCircle2, CircleDashed, Flag, GitFork, MessageSquare } from 'lucide-react';
import { startOfDay } from '@/lib/dateUtils';
import { PRIORITY_OPTIONS } from '@/lib/taskColumns';
import type { MyTask } from './types';

const STATUS_ICON = { TODO: Circle, IN_PROGRESS: CircleDashed, DONE: CheckCircle2 } as const;
const STATUS_COLOR = { TODO: '#8a8c91', IN_PROGRESS: '#3b82f6', DONE: '#22c55e' } as const;

export function dueLabel(due: Date) {
  const diff = Math.round((startOfDay(due) - startOfDay(new Date())) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** One task in a card: status circle, title, project, due date, priority. */
export default function TaskLine({
  task, onOpen, onToggle,
}: {
  task: MyTask;
  onOpen: (task: MyTask) => void;
  onToggle: (task: MyTask) => void;
}) {
  const done = task.status === 'DONE';
  const Icon = STATUS_ICON[task.status];
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = !!due && !done && startOfDay(due) < startOfDay(new Date());
  const isToday = !!due && startOfDay(due) === startOfDay(new Date());
  const prio = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
  const subs = task.subtasks.length;
  const comments = task.comments?.length ?? 0;

  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-[color:var(--c-2a2b2e)]">
      <button
        onClick={() => onToggle(task)}
        aria-label={done ? 'Mark as to do' : 'Mark complete'}
        title={done ? 'Mark as to do' : 'Mark complete'}
        className="shrink-0 transition hover:scale-110"
      >
        <Icon className="h-4 w-4" style={{ color: STATUS_COLOR[task.status] }} />
      </button>

      <button onClick={() => onOpen(task)} className="min-w-0 flex-1 text-left">
        <span className={`block truncate text-[13.5px] ${done ? 'text-[color:var(--c-8a8c91)] line-through' : 'text-[color:var(--c-white)]'}`}>{task.title}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[color:var(--c-8a8c91)]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: task.list.project.color }} />
          <span className="truncate">{task.list.project.name} / {task.list.name}</span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-2.5 text-[12px] text-[color:var(--c-8a8c91)]">
        {subs > 0 && <span className="flex items-center gap-1" title={`${subs} subtask${subs === 1 ? '' : 's'}`}><GitFork className="h-3.5 w-3.5" />{subs}</span>}
        {comments > 0 && <span className="flex items-center gap-1" title={`${comments} comment${comments === 1 ? '' : 's'}`}><MessageSquare className="h-3.5 w-3.5" />{comments}</span>}
        {prio && task.priority !== 'NORMAL' && <Flag className="h-3.5 w-3.5" style={{ color: prio.color }} fill={prio.color} aria-label={`${prio.label} priority`} />}
        {due && (
          <span className={`min-w-[52px] text-right ${overdue ? 'font-semibold text-red-400' : isToday ? 'font-medium text-emerald-400' : ''}`}>{dueLabel(due)}</span>
        )}
      </div>
    </div>
  );
}

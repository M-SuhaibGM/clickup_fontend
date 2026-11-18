// frontend/components/TaskCard.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, Flag, GitFork, MessageSquare, UserCircle } from 'lucide-react';
import type { Task } from '@/types/task';
import { PRIORITY_OPTIONS } from '@/lib/taskColumns';
import UserAvatar from './UserAvatar';

const chip =
  'flex h-7 min-w-7 items-center justify-center gap-1 rounded-md border border-[color:var(--c-333438)] px-1.5 text-[11px] text-[color:var(--c-8a8c91)]';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** The card itself — no drag behaviour, so the drag overlay can reuse it. */
export function TaskCardView({ task, showSubtasks = true }: { task: Task; showSubtasks?: boolean }) {
  const prio = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
  const hasPriority = !!prio && task.priority !== 'NORMAL';
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = !!due && task.status !== 'DONE' && due.getTime() < startOfToday();
  const subtasks = task._count?.subtasks ?? 0;
  const comments = task._count?.comments ?? 0;

  return (
    <>
      <p className={`text-[13.5px] font-medium leading-snug line-clamp-3 break-words ${task.status === 'DONE' ? 'text-[color:var(--c-8a8c91)] line-through' : 'text-[color:var(--c-white)]'}`}>
        {task.title}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className={chip} title={task.assignee ? task.assignee.name : 'Unassigned'}>
          {task.assignee ? <UserAvatar name={task.assignee.name} src={task.assignee.avatar} size={18} /> : <UserCircle className="h-4 w-4" />}
        </span>
        <span
          className={`${chip} ${overdue ? 'border-red-500/40 text-red-400' : ''}`}
          title={due ? `Due ${due.toLocaleDateString()}` : 'No due date'}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {due && due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <span className={chip} title={hasPriority ? `${prio!.label} priority` : 'No priority'}>
          <Flag className="h-3.5 w-3.5" style={hasPriority ? { color: prio!.color } : undefined} fill={hasPriority ? prio!.color : 'none'} />
        </span>
        {comments > 0 && (
          <span className={chip} title={`${comments} comment${comments === 1 ? '' : 's'}`}>
            <MessageSquare className="h-3.5 w-3.5" /> {comments}
          </span>
        )}
      </div>

      {showSubtasks && subtasks > 0 && (
        <p className="mt-2.5 flex items-center gap-2 text-[12.5px] text-[color:var(--c-8a8c91)]">
          <GitFork className="h-3.5 w-3.5" /> {subtasks} subtask{subtasks === 1 ? '' : 's'}
        </p>
      )}
    </>
  );
}

export default function TaskCard({
  task,
  onClick,
  showSubtasks = true,
}: {
  task: Task;
  onClick: () => void;
  showSubtasks?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onClick()}
      className="cursor-pointer rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] p-3 hover:border-[color:var(--c-555660)] hover:bg-[color:var(--c-232426)] transition-colors"
    >
      <TaskCardView task={task} showSubtasks={showSubtasks} />
    </div>
  );
}

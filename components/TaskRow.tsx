'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/task';
import Image from 'next/image';

const PRIORITY_STYLE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  NORMAL: 'bg-muted text-muted-foreground',
  LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
};

const STATUS_STYLE: Record<string, string> = {
  TODO: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
};

const STATUS_LABEL: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export default function TaskRow({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? 'var(--accent)' : undefined,
    zIndex: isDragging ? 10 : 1,
  };

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = due && due < new Date() && task.status !== 'DONE';

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick();
      }}
      className="group cursor-grab active:cursor-grabbing border-b border-border hover:bg-accent/30 transition"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full shrink-0" style={{
            backgroundColor:
              task.status === 'DONE' ? '#10b981'
                : task.status === 'IN_PROGRESS' ? '#f59e0b'
                  : '#9ca3af',
          }} />
          <span className="text-sm font-medium text-foreground truncate">
            {task.title}
          </span>
          
          {/* Subtask Progress Badge */}
          {task._count?.subtasks ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {task._count.subtasks}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.NORMAL
          }`}
        >
          {task.priority}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            STATUS_STYLE[task.status] ?? STATUS_STYLE.TODO
          }`}
        >
          {STATUS_LABEL[task.status] ?? task.status}
        </span>
      </td>
      <td className="px-4 py-3">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            {task.assignee.avatar ? (
              <Image 
                src={task.assignee.avatar} 
                width={24}
                height={24}
                alt={task.assignee.name} 
                className="h-6 w-6 rounded-full border border-border object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
                {task.assignee.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-xs text-foreground truncate">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs">
        {due ? (
          <span className={overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}>
            {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}
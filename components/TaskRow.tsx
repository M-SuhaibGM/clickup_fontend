// frontend/components/TaskRow.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/task';
import Image from 'next/image';
import { CheckSquare } from 'lucide-react';

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
    opacity: isDragging ? 0.4 : 1,
    backgroundColor: isDragging ? 'var(--accent)' : undefined,
    zIndex: isDragging ? 20 : 1,
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
      className="group cursor-grab active:cursor-grabbing border-b border-border/60 hover:bg-muted/30 transition-colors"
    >
      {/* Task Title & Subtasks */}
      <td className="px-3 sm:px-4 py-3 max-w-[200px] sm:max-w-none">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span
            className="h-2 w-2 rounded-full shrink-0 shadow-xs"
            style={{
              backgroundColor:
                task.status === 'DONE'
                  ? '#10b981'
                  : task.status === 'IN_PROGRESS'
                  ? '#f59e0b'
                  : '#9ca3af',
            }}
          />
          <span className="text-xs sm:text-sm font-medium text-foreground truncate flex-1">
            {task.title}
          </span>
          
          {/* Subtask Count Badge */}
          {task._count?.subtasks ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded-md shrink-0">
              <CheckSquare className="h-3 w-3" />
              {task._count.subtasks}
            </span>
          ) : null}
        </div>
      </td>

      {/* Priority */}
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold ${
            PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.NORMAL
          }`}
        >
          {task.priority}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium ${
            STATUS_STYLE[task.status] ?? STATUS_STYLE.TODO
          }`}
        >
          {STATUS_LABEL[task.status] ?? task.status}
        </span>
      </td>

      {/* Assignee */}
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            {task.assignee.avatar ? (
              <Image
                src={task.assignee.avatar}
                width={22}
                height={22}
                alt={task.assignee.name}
                className="h-5 sm:h-6 w-5 sm:w-6 rounded-full border border-border object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-5 sm:h-6 w-5 sm:w-6 rounded-full bg-indigo-600 text-white text-[9px] sm:text-[10px] flex items-center justify-center font-bold shrink-0">
                {task.assignee.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[11px] sm:text-xs text-foreground font-medium truncate max-w-[90px] sm:max-w-[130px]">
              {task.assignee.name}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
        )}
      </td>

      {/* Due Date */}
      <td className="px-3 sm:px-4 py-3 text-[11px] sm:text-xs whitespace-nowrap">
        {due ? (
          <span
            className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md ${
              overdue
                ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                : 'text-muted-foreground bg-muted/50'
            }`}
          >
            {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}
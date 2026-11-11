// frontend/components/TaskCard.tsx
'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/task';
import Image from 'next/image';
import { Calendar, CheckSquare, GripVertical } from 'lucide-react';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  URGENT: { label: 'Urgent', color: 'bg-red-500', bg: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400' },
  HIGH: { label: 'High', color: 'bg-orange-500', bg: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400' },
  NORMAL: { label: 'Normal', color: 'bg-blue-500', bg: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
  LOW: { label: 'Low', color: 'bg-slate-400', bg: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
};

export default function TaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.NORMAL;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={(e) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick();
      }}
      className="group relative bg-card p-3.5 rounded-xl border border-border shadow-xs hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-500/50 cursor-pointer transition-all duration-200"
    >
      {/* Top Row: Drag handle, Title & Priority Indicator */}
      <div className="flex items-start gap-2 mb-3">
        {/* Drag handle — the only element that captures drag on mobile */}
        <button
          {...listeners}
          type="button"
          aria-label="Drag task"
          onClick={(e) => e.stopPropagation()}
          style={{ touchAction: 'none' }}
          className="shrink-0 -ml-1 -mt-0.5 p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <span className="text-[13px] sm:text-sm font-semibold text-foreground leading-snug line-clamp-2 flex-1">
          {task.title}
        </span>

        {/* Priority Badge / Dot */}
        <span
          className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1 shadow-xs ${priorityInfo.color}`}
          title={`Priority: ${task.priority}`}
        />
      </div>

      {/* Middle/Bottom Metadata Row */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/60">
        {/* Assignee & Subtasks */}
        <div className="flex items-center gap-2 min-w-0">
          {task.assignee ? (
            <div className="flex items-center gap-1.5 min-w-0">
              {task.assignee.avatar ? (
                <Image
                  src={task.assignee.avatar}
                  width={22}
                  height={22}
                  className="h-5 w-5 rounded-full border border-border object-cover shrink-0"
                  alt={task.assignee.name}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                  {task.assignee.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[80px] sm:max-w-[100px]">
                {task.assignee.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
          )}

          {/* Subtask Badge */}
          {task._count?.subtasks ? (
            <span
              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md"
              title={`${task._count.subtasks} subtasks`}
            >
              <CheckSquare className="h-3 w-3" />
              {task._count.subtasks}
            </span>
          ) : null}
        </div>

        {/* Due Date Badge */}
        {task.dueDate && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md shrink-0">
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
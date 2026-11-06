'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/task';
import Image from 'next/image'; // ← Added for Google avatars

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  NORMAL: 'bg-blue-500',
  LOW: 'bg-gray-400',
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
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
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
      className="bg-card p-3 rounded-lg border border-border shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-foreground leading-tight flex-1">
          {task.title}
        </span>

        <div className="flex items-center gap-2 shrink-0 mt-1">
          {/* Subtask Badge */}
          {task._count?.subtasks ? (
            <span
              className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
              title={`${task._count.subtasks} subtasks`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {task._count.subtasks}
            </span>
          ) : null}

          {/* Priority Dot */}
          <span
            className={`h-2 w-2 rounded-full ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.NORMAL
              }`}
            title={`Priority: ${task.priority}`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            {task.assignee.avatar ? (
              <Image
                src={task.assignee.avatar}
                width={20}
                height={20}
                className="h-5 w-5 rounded-full border border-border object-cover"
                alt={task.assignee.name}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">
                {task.assignee.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[10px] text-muted-foreground">{task.assignee.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">Unassigned</span>
        )}

        {task.dueDate && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
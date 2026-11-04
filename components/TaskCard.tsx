'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/task';

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
      className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-gray-900 leading-tight">
          {task.title}
        </span>
        <span
          className={`h-2 w-2 rounded-full shrink-0 mt-1 ${
            PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.NORMAL
          }`}
          title={`Priority: ${task.priority}`}
        />
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            {task.assignee.avatar ? (
              <img src={task.assignee.avatar} className="h-5 w-5 rounded-full" alt="" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">
                {task.assignee.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[10px] text-gray-500">{task.assignee.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-[10px] text-gray-400">Unassigned</span>
        )}
        
        {task.dueDate && (
          <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
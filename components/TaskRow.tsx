'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/task';

const PRIORITY_STYLE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  NORMAL: 'bg-gray-100 text-gray-600',
  LOW: 'bg-blue-100 text-blue-700',
};

const STATUS_STYLE: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  DONE: 'bg-emerald-100 text-emerald-700',
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
    isDragging, // Make sure this is destructured
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#f9fafb' : undefined,
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
      // ADD THIS ONCLICK HANDLER:
      onClick={(e) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick();
      }}
      className="group cursor-grab active:cursor-grabbing border-b border-gray-100 hover:bg-indigo-50/30 transition"
    ><td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full shrink-0" style={{
            backgroundColor:
              task.status === 'DONE' ? '#10b981'
                : task.status === 'IN_PROGRESS' ? '#f59e0b'
                  : '#9ca3af',
          }} />
          <span className="text-sm font-medium text-gray-900 truncate">
            {task.title}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.NORMAL
            }`}
        >
          {task.priority}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[task.status] ?? STATUS_STYLE.TODO
            }`}
        >
          {STATUS_LABEL[task.status] ?? task.status}
        </span>
      </td>
      <td className="px-4 py-3">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            {task.assignee.avatar ? (
              <img src={task.assignee.avatar} alt="" className="h-6 w-6 rounded-full" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
                {task.assignee.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-xs text-gray-700 truncate">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Unassigned</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs">
        {due ? (
          <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
            {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}
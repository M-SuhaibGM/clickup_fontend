'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/task';
import Image from 'next/image';
import { Circle, CheckCircle2, CircleDashed, MessageSquare } from 'lucide-react';

const STATUS_ICONS: Record<string, any> = {
  TODO: Circle,
  IN_PROGRESS: CircleDashed,
  DONE: CheckCircle2,
};

const STATUS_LABEL: Record<string, string> = {
  TODO: 'TO DO',
  IN_PROGRESS: 'IN PROGRESS',
  DONE: 'COMPLETE',
};

export default function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  
  const StatusIcon = STATUS_ICONS[task.status] || Circle;
  const due = task.dueDate ? new Date(task.dueDate) : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="grid grid-cols-[1fr_120px_120px_150px_100px_40px] gap-2 px-3 py-2.5 border-b border-[#333438] hover:bg-[#2a2b2e] transition-colors cursor-pointer group items-center text-[13px] text-[#e5e5e5]"
    >
      {/* Name */}
      <div className="flex items-center gap-2 truncate">
         <Circle className="h-4 w-4 text-[#8a8c91]" /> {/* Fake check circle */}
         <span className="truncate">{task.title}</span>
      </div>

      {/* Assignee */}
      <div className="flex items-center">
        {task.assignee ? (
          <Image src={task.assignee.avatar || ''} alt="A" width={24} height={24} className="rounded-full border border-[#333438]" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-[#2a2b2e] border border-[#333438] flex items-center justify-center">
             <UserCircle className="h-4 w-4 text-[#8a8c91]" />
          </div>
        )}
      </div>

      {/* Due Date */}
      <div className="text-[12px] text-[#8a8c91]">
        {due ? due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : <CalendarIcon className="h-4 w-4 text-[#8a8c91]" />}
      </div>

      {/* Priority */}
      <div>
        <span className="flex items-center gap-1 text-[12px] text-[#8a8c91]">
          <Flag className="h-3.5 w-3.5" /> {task.priority}
        </span>
      </div>

      {/* Status Pill */}
      <div>
        <span className="flex items-center justify-center gap-1.5 px-2 py-0.5 bg-[#2a2b2e] border border-[#333438] rounded text-[11px] font-bold text-[#e5e5e5] w-max">
          <StatusIcon className="h-3.5 w-3.5" /> {STATUS_LABEL[task.status]}
        </span>
      </div>

      {/* Comments */}
      <div className="flex justify-center">
        <MessageSquare className="h-3.5 w-3.5 text-[#8a8c91] opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}

// Add these missing imports at top: 
// UserCircle, Calendar as CalendarIcon, Flag
'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '@/types/task';
import TaskCard from './TaskCard';
import { Plus, Circle, CircleDashed, CheckCircle2 } from 'lucide-react';

const COL_STYLES: Record<string, { icon: any, color: string, bg: string, text: string }> = {
  TODO: { icon: Circle, color: 'text-[color:var(--c-8a8c91)]', bg: 'bg-[color:var(--c-1e1f21)]', text: 'TO DO' },
  IN_PROGRESS: { icon: CircleDashed, color: 'text-blue-400', bg: 'bg-[#2c82f8]/10', text: 'IN PROGRESS' },
  DONE: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: 'COMPLETE' },
};

export default function BoardColumn({ id, tasks, onTaskClick }: any) {
  const { setNodeRef } = useDroppable({ id });
  const style = COL_STYLES[id] || COL_STYLES.TODO;
  const Icon = style.icon;

  return (
    <div className="w-full sm:w-[300px] shrink-0 flex flex-col gap-2">
      {/* Column Header */}
      <div className={`flex items-center justify-between px-3 py-1.5 rounded-md border ${id === 'IN_PROGRESS' ? 'border-blue-500/30' : id === 'DONE' ? 'border-emerald-500/30' : 'border-[color:var(--c-333438)]'}`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${style.color}`} />
          <h3 className={`text-[12px] font-bold ${style.color}`}>{style.text}</h3>
          <span className="text-[11px] text-[color:var(--c-8a8c91)]">{tasks.length}</span>
        </div>
        <button className="text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]"><Plus className="h-4 w-4" /></button>
      </div>

      {/* Droppable Area */}
      <SortableContext items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={`rounded-lg p-2 min-h-[150px] flex flex-col gap-2 ${style.bg}`}>
          {tasks.map((task: any) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
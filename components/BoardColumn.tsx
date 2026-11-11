'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '@/types/task';
import TaskCard from './TaskCard';

export default function BoardColumn({
  id,
  label,
  color,
  tasks,
  onTaskClick,
}: {
  id: string;
  label: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  // This makes the whole column a drop target, even if it's empty!
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="w-full sm:w-72 sm:shrink-0 flex flex-col gap-3">
      {/* Column Header */}
      <div className="flex items-center gap-2 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      {/* Droppable Area */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="bg-muted/50 rounded-xl p-2 min-h-[160px] sm:min-h-[400px] border border-border flex flex-col gap-2"
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}

          {/* Empty state placeholder */}
          {tasks.length === 0 && (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg min-h-[120px]">
              <span className="text-xs text-muted-foreground">Drop tasks here</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
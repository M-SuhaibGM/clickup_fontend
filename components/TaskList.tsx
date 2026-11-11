'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/types/task';
import TaskRow from './TaskRow';
import { Skeleton } from '@/components/ui/skeleton';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const EMPTY_TASKS: never[] = [];

export default function TaskList({
  listId,
  onTaskClick,
  isAdmin, // ← ADD
}: {
  listId: string;
  onTaskClick: (task: Task) => void;
  isAdmin: boolean; // ← ADD
}) {
  const tasks = useTaskStore((s) => s.tasksByList[listId] ?? EMPTY_TASKS);
  const loading = useTaskStore((s) => s.loadingLists[listId] ?? false);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const createTask = useTaskStore((s) => s.createTask);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Filter out subtasks (tasks with a parentId)
  const mainTasks = tasks.filter((t) => !t.parentId);

  useEffect(() => {
    fetchTasks(listId);
  }, [listId, fetchTasks]);

  

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isAdmin) return; // Members cannot reorder tasks
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = mainTasks.findIndex((t) => t.id === active.id);
    const newIndex = mainTasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newTasks = arrayMove(mainTasks, oldIndex, newIndex);

    // We need to merge the reordered mainTasks with the subtasks that are currently in the store
    const subtasks = tasks.filter((t) => t.parentId);
    const mergedTasks = [...newTasks, ...subtasks];


    reorderTasks(listId, mergedTasks);
  };



// AFTER (clean):
const handleAdd = async () => {
  if (!title.trim() || saving) return;
  setSaving(true);
  try {
    await createTask(listId, { title: title.trim() });
    setTitle('');
  } catch {
    // Store already shows toast
  } finally {
    setSaving(false);
  }
};

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        {/* Table */}
        <table className="w-full min-w-max md:min-w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left px-3 sm:px-4 py-2.5 font-semibold">Task</th>
              <th className="text-left px-3 sm:px-4 py-2.5 font-semibold w-24 sm:w-28">Priority</th>
              <th className="text-left px-3 sm:px-4 py-2.5 font-semibold w-28 sm:w-32">Status</th>
              <th className="text-left px-3 sm:px-4 py-2.5 font-semibold w-32 sm:w-40">Assignee</th>
              <th className="text-left px-3 sm:px-4 py-2.5 font-semibold w-20 sm:w-24">Due</th>
            </tr>
          </thead>

          <SortableContext
            items={mainTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {loading && mainTasks.length === 0 ? (
                // ─── SKELETON ROWS ───
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 sm:px-4 py-3.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                        <Skeleton className="h-4 w-32 sm:w-48" />
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3.5">
                      <Skeleton className="h-5 w-14 sm:w-16 rounded-full" />
                    </td>
                    <td className="px-3 sm:px-4 py-3.5">
                      <Skeleton className="h-5 w-16 sm:w-20 rounded-full" />
                    </td>
                    <td className="px-3 sm:px-4 py-3.5">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Skeleton className="h-5 sm:h-6 w-5 sm:w-6 rounded-full" />
                        <Skeleton className="h-3 w-10 sm:w-12" />
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3.5">
                      <Skeleton className="h-3 w-8 sm:w-10" />
                    </td>
                  </tr>
                ))
              ) : mainTasks.length === 0 && !adding ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No tasks yet. {isAdmin && 'Click "+ Add task" below to start.'}
                  </td>
                </tr>
              ) : (
                mainTasks.map((t) => (
                  <TaskRow key={t.id} task={t} onClick={() => onTaskClick(t)} />
                ))
              )}
            </tbody>
          </SortableContext>
        </table>

        {/* Inline add - Only show to Admin */}
        {isAdmin && (
          <div className="border-t border-border px-3 py-2">
            {adding ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') {
                      setAdding(false);
                      setTitle('');
                    }
                  }}
                  placeholder="Task title…"
                  disabled={saving}
                  className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <button
                  onClick={handleAdd}
                  disabled={saving || !title.trim()}
                  className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-sm font-medium px-3 py-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {saving ? (
                    <>
                      <span className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      Adding…
                    </>
                  ) : (
                    'Add'
                  )}
                </button>
                <button
                  onClick={() => {
                    setAdding(false);
                    setTitle('');
                  }}
                  className="text-muted-foreground hover:text-foreground text-sm px-2 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="text-sm text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-2 py-1 transition"
              >
                + Add task
              </button>
            )}
          </div>
        )}
      </div>
    </DndContext>
  );
}
// frontend/components/TaskList.tsx
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/types/task';
import TaskRow from './TaskRow';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, X, Loader2 } from 'lucide-react';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
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
  isAdmin,
}: {
  listId: string;
  onTaskClick: (task: Task) => void;
  isAdmin: boolean;
}) {
  const tasks = useTaskStore((s) => s.tasksByList[listId] ?? EMPTY_TASKS);
  const loading = useTaskStore((s) => s.loadingLists[listId] ?? false);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const createTask = useTaskStore((s) => s.createTask);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  // Configure sensors for both mouse and touch drag-and-drop support on mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold to start dragging, allowing vertical page scrolling
        tolerance: 5,
      },
    })
  );

  // Filter out subtasks (tasks with a parentId)
  const mainTasks = tasks.filter((t) => !t.parentId);

  useEffect(() => {
    fetchTasks(listId);
  }, [listId, fetchTasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isAdmin) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = mainTasks.findIndex((t) => t.id === active.id);
    const newIndex = mainTasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newTasks = arrayMove(mainTasks, oldIndex, newIndex);
    const subtasks = tasks.filter((t) => t.parentId);
    const mergedTasks = [...newTasks, ...subtasks];

    reorderTasks(listId, mergedTasks);
  };

  const handleAdd = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await createTask(listId, { title: title.trim() });
      setTitle('');
    } catch {
      // Store handles toast error
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
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {/* Table wrapper with smooth horizontal scrolling if needed */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] sm:min-w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-4 py-3 font-semibold">Task</th>
                <th className="text-left px-4 py-3 font-semibold w-28">Priority</th>
                <th className="text-left px-4 py-3 font-semibold w-32">Status</th>
                <th className="text-left px-4 py-3 font-semibold w-36">Assignee</th>
                <th className="text-left px-4 py-3 font-semibold w-24">Due</th>
              </tr>
            </thead>

            <SortableContext
              items={mainTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody className="divide-y divide-border/60">
                {loading && mainTasks.length === 0 ? (
                  // ─── SKELETON ROWS ───
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                          <Skeleton className="h-4 w-40 sm:w-56" />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-4 py-3.5">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Skeleton className="h-3 w-12" />
                      </td>
                    </tr>
                  ))
                ) : mainTasks.length === 0 && !adding ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No tasks yet. {isAdmin && 'Click "+ Add task" below to get started.'}
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
        </div>

        {/* Inline Add Task Section */}
        {isAdmin && (
          <div className="border-t border-border bg-muted/20 px-4 py-3">
            {adding ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
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
                  placeholder="What needs to be done?…"
                  disabled={saving}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={handleAdd}
                    disabled={saving || !title.trim()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding…
                      </>
                    ) : (
                      'Add Task'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setAdding(false);
                      setTitle('');
                    }}
                    className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3 py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold px-2 py-1 transition"
              >
                <Plus className="h-4 w-4" /> Add task
              </button>
            )}
          </div>
        )}
      </div>
    </DndContext>
  );
}
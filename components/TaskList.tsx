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
}: {
  listId: string;
  onTaskClick: (task: Task) => void;
}) {
  const tasks = useTaskStore((s) => s.tasksByList[listId] ?? EMPTY_TASKS);
  const loading = useTaskStore((s) => s.loadingLists[listId] ?? false);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const createTask = useTaskStore((s) => s.createTask);

  // Make sure you have added setTasks to your Zustand store
  const setTasks = useTaskStore((s) => s.setTasks);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    fetchTasks(listId);
  }, [listId, fetchTasks]);

  const handleAdd = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await createTask(listId, { title: title.trim() });
      setTitle('');
      toast.success('Task created');
    } catch {
      toast.error('Failed to create task');
    } finally {
      setSaving(false);
    }
  };
  // Inside TaskList.tsx


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    const newTasks = arrayMove(tasks, oldIndex, newIndex);

    // Update UI instantly and save to DB
    reorderTasks(listId, newTasks);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="text-left px-4 py-2.5 font-semibold">Task</th>
              <th className="text-left px-4 py-2.5 font-semibold w-28">Priority</th>
              <th className="text-left px-4 py-2.5 font-semibold w-32">Status</th>
              <th className="text-left px-4 py-2.5 font-semibold w-40">Assignee</th>
              <th className="text-left px-4 py-2.5 font-semibold w-24">Due</th>
            </tr>
          </thead>

          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {loading && tasks.length === 0 ? (
                // ─── SKELETON ROWS ───
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                        <Skeleton className="h-4 w-48" />
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
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-3 w-10" />
                    </td>
                  </tr>
                ))
              ) : tasks.length === 0 && !adding ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    No tasks yet. Click "+ Add task" below to start.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <TaskRow key={t.id} task={t} onClick={() => onTaskClick(t)} />
                ))
              )}
            </tbody>
          </SortableContext>
        </table>

        {/* Inline add */}
        <div className="border-t border-gray-100 px-3 py-2">
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
                className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 disabled:bg-gray-50"
              />
              <button
                onClick={handleAdd}
                disabled={saving || !title.trim()}
                className="inline-flex items-center gap-1.5 text-indigo-600 text-sm font-medium px-3 py-1.5 rounded hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                className="text-gray-400 hover:text-gray-700 text-sm px-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="text-sm text-gray-400 hover:text-indigo-600 font-medium px-2 py-1 transition"
            >
              + Add task
            </button>
          )}
        </div>
      </div>
    </DndContext>
  );
}
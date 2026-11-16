'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTaskStore } from '@/store/taskStore';
import TaskRow from './TaskRow';
import { ChevronDown, Plus, SlidersHorizontal, Filter, CheckCircle2, UserCircle, Search, Settings } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import type { Task } from '@/types/task';
import { toast } from 'sonner';

const EMPTY_TASKS: never[] = [];

const STATUS_DROP_HIGHLIGHT: Record<string, string> = {
  TODO: 'ring-1 ring-blue-500/40 bg-blue-500/5',
  IN_PROGRESS: 'ring-1 ring-amber-500/40 bg-amber-500/5',
  DONE: 'ring-1 ring-green-500/40 bg-green-500/5',
};

function StatusGroupDroppable({ status, isOver, children }: { status: string; isOver: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `status-${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`mb-2 transition-all duration-200 rounded ${isOver ? STATUS_DROP_HIGHLIGHT[status] ?? 'ring-1 ring-indigo-500/40 bg-indigo-500/5' : ''}`}
    >
      {children}
    </div>
  );
}

export default function TaskList({ listId, onTaskClick, isAdmin }: any) {
  const tasks = useTaskStore((s) => s.tasksByList[listId] ?? EMPTY_TASKS);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const createTask = useTaskStore((s) => s.createTask);
  const setTasks = useTaskStore((s) => s.setTasks);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const updateTask = useTaskStore((s) => s.updateTask);

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  // Only filter top-level tasks for the main groups (subtasks rendered inside TaskRow tree)
  const groupedTasks = useMemo(() => ({
    TODO: tasks.filter((t) => t.status === 'TODO' && !t.parentId),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS' && !t.parentId),
    DONE: tasks.filter((t) => t.status === 'DONE' && !t.parentId),
  }), [tasks]);

  useEffect(() => {
    fetchTasks(listId);
  }, [listId]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    await createTask(listId, { title: title.trim() });
    setTitle('');
    setAdding(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;
    if (!over) { setOverStatus(null); return; }

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) { setOverStatus(null); return; }

    const overId = String(over.id);
    let targetStatus: string | null = null;

    if (overId.startsWith('status-')) {
      targetStatus = overId.replace('status-', '');
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) targetStatus = overTask.status;
    }

    setOverStatus(targetStatus && targetStatus !== draggedTask.status ? targetStatus : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    setOverStatus(null);
    const { active, over } = event;
    if (!over) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    const overId = String(over.id);

    // Dropped on a status group container
    if (overId.startsWith('status-')) {
      const newStatus = overId.replace('status-', '') as Task['status'];
      if (draggedTask.status === newStatus) return;

      const updated = tasks.map((t) =>
        t.id === draggedTask.id ? { ...t, status: newStatus } : t
      );
      setTasks(listId, updated);
      try {
        await updateTask(draggedTask.id, listId, { status: newStatus });
        toast.success(`Moved to ${newStatus.replace('_', ' ')}`);
      } catch {
        toast.error('Failed to move task');
        fetchTasks(listId);
      }
      return;
    }

    // Dropped on another task
    if (active.id === over.id) return;
    const overTask = tasks.find((t) => t.id === over.id);
    if (!overTask) return;

    if (draggedTask.status === overTask.status) {
      if (!isAdmin) {
        toast.error('Only admins can reorder tasks');
        return;
      }
      const mainTasks = tasks.filter((t) => !t.parentId);
      const subtasks = tasks.filter((t) => t.parentId);
      const oldIndex = mainTasks.findIndex((t) => t.id === active.id);
      const newIndex = mainTasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(mainTasks, oldIndex, newIndex);
      setTasks(listId, [...reordered, ...subtasks]);
      reorderTasks(listId, [...reordered, ...subtasks]);
    } else {
      const newStatus = overTask.status;
      const updated = tasks.map((t) =>
        t.id === draggedTask.id ? { ...t, status: newStatus } : t
      );
      setTasks(listId, updated);
      try {
        await updateTask(draggedTask.id, listId, { status: newStatus });
        toast.success(`Moved to ${newStatus.replace('_', ' ')}`);
      } catch {
        toast.error('Failed to move task');
        fetchTasks(listId);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full bg-[#1e1f21] rounded-lg border border-[#333438] overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#232426] border-b border-[#333438] gap-2">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2.5 py-1 bg-[#2a2b2e] border border-[#333438] rounded text-xs font-medium text-white">
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" /> Group: Status
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button className="flex items-center gap-1 px-2.5 py-1 bg-[#2a2b2e] border border-[#333438] rounded text-[#8a8c91] hover:text-white">
              <Filter className="h-3 w-3" /> Filter
            </button>
            {isAdmin && (
              <button onClick={() => setAdding(true)} className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded shadow-sm">
                <Plus className="h-3.5 w-3.5" /> Add Task
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="w-full">
          <div className="grid grid-cols-[1fr_120px_120px_150px_100px_40px] gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#8a8c91] border-b border-[#333438]">
            <div>Name</div>
            <div>Assignee</div>
            <div>Due date</div>
            <div>Priority</div>
            <div>Status</div>
            <div className="text-center">Comments</div>
          </div>

          {Object.entries(groupedTasks).map(([status, groupTasks]) => {
            const isCollapsed = !!collapsedGroups[status];
            return (
              <StatusGroupDroppable key={status} status={status} isOver={overStatus === status}>
                <button
                  type="button"
                  onClick={() => setCollapsedGroups((prev) => ({ ...prev, [status]: !prev[status] }))}
                  className="flex items-center justify-between w-full px-3 py-1.5 bg-[#232426]/60 border-b border-[#333438] cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown className={`h-3.5 w-3.5 text-[#8a8c91] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#2a2b2e] border border-[#333438] rounded text-[11px] font-bold text-white">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block"></span> {status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-[#8a8c91]">{groupTasks.length}</span>
                  </div>
                </button>

                {!isCollapsed && (
                  <>
                    <SortableContext items={groupTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      {groupTasks.map((t) => (
                        <TaskRow key={t.id} task={t} allTasks={tasks} onClick={() => onTaskClick(t)} />
                      ))}
                    </SortableContext>

                    {groupTasks.length === 0 && (
                      <div className="px-3 py-4 text-center text-xs text-[#8a8c91]">
                        Drop tasks here
                      </div>
                    )}
                  </>
                )}
              </StatusGroupDroppable>
            );
          })}

          {isAdmin && adding && (
            <div className="px-3 py-2.5 border-b border-[#333438] bg-[#232426]">
               <input
                 autoFocus
                 value={title}
                 onChange={e => setTitle(e.target.value)}
                 onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                 placeholder="Task Name or type '/' for commands"
                 className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#8a8c91]"
               />
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="bg-[#2a2b2e] border border-indigo-500 rounded px-3 py-2 text-sm text-white shadow-xl opacity-90">
            {activeTask.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
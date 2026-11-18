// frontend/components/BoardView.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCorners,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Task } from '@/types/task';
import { PRIORITY_OPTIONS, STATUSES } from '@/lib/taskColumns';
import {
  UNASSIGNED,
  defaultsForGroup,
  groupKeyOf,
  patchForGroup,
  type GroupBy,
} from '@/lib/taskGrouping';
import { TaskCardView } from './TaskCard';
import BoardColumn, { type BoardGroup } from './BoardColumn';
import TaskViewToolbar from './TaskViewToolbar';
import { MenuLabel, MenuRow, ToolbarMenu, tbBtn, tbIdle, tbOn } from './ToolbarMenu';

const EMPTY_TASKS: never[] = [];
const VIEW_KEY = 'task-board-view';

type SortBy = 'manual' | 'dueDate' | 'priority' | 'title' | 'newest';
const SORT_LABEL: Record<SortBy, string> = {
  manual: 'Manual order',
  dueDate: 'Due date',
  priority: 'Priority',
  title: 'Name',
  newest: 'Newest first',
};
const PRIORITY_RANK: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

interface ViewPrefs {
  groupBy: GroupBy;
  sortBy: SortBy;
  showSubtasks: boolean;
  showClosed: boolean;
}
const DEFAULT_VIEW: ViewPrefs = { groupBy: 'status', sortBy: 'manual', showSubtasks: true, showClosed: true };

function loadView(): ViewPrefs {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) ?? 'null') as Partial<ViewPrefs> | null;
    if (!v) return DEFAULT_VIEW;
    return {
      groupBy: ['status', 'priority', 'assignee', 'none'].includes(v.groupBy as string) ? (v.groupBy as GroupBy) : 'status',
      sortBy: v.sortBy && v.sortBy in SORT_LABEL ? v.sortBy : 'manual',
      showSubtasks: v.showSubtasks ?? true,
      showClosed: v.showClosed ?? true,
    };
  } catch {
    return DEFAULT_VIEW;
  }
}

// Prefer the column under the pointer; fall back to the nearest corner
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : closestCorners(args);
};

const sorters: Record<Exclude<SortBy, 'manual'>, (a: Task, b: Task) => number> = {
  dueDate: (a, b) => (a.dueDate ? Date.parse(a.dueDate) : Infinity) - (b.dueDate ? Date.parse(b.dueDate) : Infinity),
  priority: (a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9),
  title: (a, b) => a.title.localeCompare(b.title),
  newest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
};

export default function BoardView({
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
  const updateTask = useTaskStore((s) => s.updateTask);
  const setTasks = useTaskStore((s) => s.setTasks);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);

  const me = useAuthStore((s) => s.user);
  const users = useUserStore((s) => s.users);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);

  const [view, setView] = useState<ViewPrefs>(loadView);
  const { groupBy, sortBy, showSubtasks, showClosed } = view;
  const patchView = (p: Partial<ViewPrefs>) =>
    setView((v) => {
      const next = { ...v, ...p };
      try { localStorage.setItem(VIEW_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });

  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overGroup, setOverGroup] = useState<string | null>(null);

  // Drag handle is the whole card: a short drag distance keeps clicks working, a press-delay keeps touch scrolling
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  useEffect(() => {
    if (tasks.length === 0) fetchTasks(listId);
  }, [listId, fetchTasks, tasks.length]);

  useEffect(() => {
    if (activeWorkspaceId && users.length === 0) useUserStore.getState().fetchUsers(activeWorkspaceId);
  }, [activeWorkspaceId, users.length]);

  const filtersActive = priorityFilter.length > 0 || assigneeFilter !== null || search.trim() !== '';

  const visibleTop = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tasks.filter((t) => {
      if (t.parentId) return false;
      if (!showClosed && t.status === 'DONE') return false;
      if (priorityFilter.length && !priorityFilter.includes(t.priority)) return false;
      if (assigneeFilter === UNASSIGNED) {
        if (t.assigneeId) return false;
      } else if (assigneeFilter && t.assigneeId !== assigneeFilter) {
        return false;
      }
      if (q && !t.title.toLowerCase().includes(q) && !tasks.some((s) => s.parentId === t.id && s.title.toLowerCase().includes(q))) return false;
      return true;
    });
    return sortBy === 'manual' ? list : [...list].sort(sorters[sortBy]);
  }, [tasks, showClosed, priorityFilter, assigneeFilter, search, sortBy]);

  // Every status/priority column is always shown (even empty); assignee columns follow who has tasks
  const groups = useMemo<BoardGroup[]>(() => {
    const by = (key: string, label: string, color: string): BoardGroup => ({
      key, label, color, tasks: visibleTop.filter((t) => groupKeyOf(groupBy, t) === key),
    });
    if (groupBy === 'status') return STATUSES.filter((s) => showClosed || s.value !== 'DONE').map((s) => by(s.value, s.label, s.color));
    if (groupBy === 'priority') return PRIORITY_OPTIONS.map((p) => by(p.value, p.label.toUpperCase(), p.color));
    if (groupBy === 'assignee') {
      const seen = new Map<string, string>();
      visibleTop.forEach((t) => t.assignee && seen.set(t.assignee.id, t.assignee.name));
      return [...[...seen].map(([id, name]) => by(id, name.toUpperCase(), '#6366f1')), by(UNASSIGNED, 'UNASSIGNED', '#8a8c91')];
    }
    return [by('all', 'ALL TASKS', '#6366f1')];
  }, [visibleTop, groupBy, showClosed]);

  // ── Drag & drop ──
  const moveToGroup = async (task: Task, key: string) => {
    const patch = patchForGroup(groupBy, key);
    if (!patch || groupKeyOf(groupBy, task) === key) return;
    if (groupBy !== 'status' && !isAdmin) return toast.error('Only admins can change this');
    if (groupBy === 'status') setTasks(listId, tasks.map((t) => (t.id === task.id ? { ...t, ...patch } : t)));
    try {
      await updateTask(task.id, listId, patch);
    } catch {
      fetchTasks(listId);
    }
  };

  const handleDragStart = (e: DragStartEvent) => {
    const task = tasks.find((t) => t.id === e.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = ({ over, active }: DragOverEvent) => {
    const dragged = tasks.find((t) => t.id === active.id);
    if (!over || !dragged) return setOverGroup(null);
    const overId = String(over.id);
    const overTask = tasks.find((t) => t.id === over.id);
    const target = overId.startsWith('group-') ? overId.slice(6) : overTask ? groupKeyOf(groupBy, overTask) : null;
    setOverGroup(target && target !== groupKeyOf(groupBy, dragged) ? target : null);
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    setOverGroup(null);
    if (!over) return;
    const dragged = tasks.find((t) => t.id === active.id);
    if (!dragged) return;

    const overId = String(over.id);
    if (overId.startsWith('group-')) return moveToGroup(dragged, overId.slice(6));
    if (active.id === over.id) return;

    const overTask = tasks.find((t) => t.id === over.id);
    if (!overTask) return;
    if (groupKeyOf(groupBy, dragged) !== groupKeyOf(groupBy, overTask)) {
      return moveToGroup(dragged, groupKeyOf(groupBy, overTask));
    }

    // Same column → reorder
    if (sortBy !== 'manual') return toast.info('Switch Sort to "Manual order" to reorder cards');
    if (!isAdmin) return toast.error('Only admins can reorder tasks');
    const main = tasks.filter((t) => !t.parentId);
    const subs = tasks.filter((t) => t.parentId);
    const from = main.findIndex((t) => t.id === active.id);
    const to = main.findIndex((t) => t.id === over.id);
    if (from === -1 || to === -1) return;
    const reordered = [...arrayMove(main, from, to), ...subs];
    setTasks(listId, reordered);
    reorderTasks(listId, reordered);
  };

  const resetView = () => {
    patchView(DEFAULT_VIEW);
    setPriorityFilter([]);
    setAssigneeFilter(null);
    setSearch('');
  };

  const sortMenu = (
    <ToolbarMenu
      align="right"
      button={(open, toggle) => (
        <button onClick={toggle} aria-expanded={open} className={`${tbBtn} ${sortBy !== 'manual' ? tbOn : tbIdle}`}>
          <ArrowUpDown className="h-3.5 w-3.5" /> Sort{sortBy !== 'manual' && <span className="font-semibold">· {SORT_LABEL[sortBy]}</span>}
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuLabel>Sort cards by</MenuLabel>
          {(Object.keys(SORT_LABEL) as SortBy[]).map((s) => (
            <MenuRow key={s} active={sortBy === s} onClick={() => { patchView({ sortBy: s }); close(); }}>
              {SORT_LABEL[s]}
            </MenuRow>
          ))}
        </>
      )}
    </ToolbarMenu>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <TaskViewToolbar
        groupBy={groupBy}
        onGroupBy={(g) => patchView({ groupBy: g })}
        showSubtasks={showSubtasks}
        onToggleSubtasks={() => patchView({ showSubtasks: !showSubtasks })}
        showClosed={showClosed}
        onToggleClosed={() => patchView({ showClosed: !showClosed })}
        priorityFilter={priorityFilter}
        onPriorityFilter={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilter={setAssigneeFilter}
        search={search}
        onSearch={setSearch}
        users={users}
        me={me}
        onReset={resetView}
        extraRight={sortMenu}
      />

      {filtersActive && visibleTop.length === 0 && tasks.length > 0 && (
        <p className="pb-3 text-sm text-[color:var(--c-8a8c91)]">
          No tasks match your filters.{' '}
          <button onClick={() => { setPriorityFilter([]); setAssigneeFilter(null); setSearch(''); }} className="text-indigo-400 hover:underline">Clear filters</button>
        </p>
      )}

      {loading && tasks.length === 0 ? (
        <p className="py-10 text-center text-sm text-[color:var(--c-8a8c91)]">Loading tasks…</p>
      ) : (
        <div className="flex items-start gap-3 overflow-x-auto pb-6 pt-1">
          {groups.map((group) => (
            <BoardColumn
              key={group.key}
              group={group}
              statusStyle={groupBy === 'status'}
              isOver={overGroup === group.key}
              canAdd={isAdmin}
              showSubtasks={showSubtasks}
              onTaskClick={onTaskClick}
              onCreate={async (title) => {
                await createTask(listId, { title, ...defaultsForGroup(groupBy, group.key) });
              }}
            />
          ))}

          <button
            onClick={() => toast.info('Custom groups are coming soon')}
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-[color:var(--c-8a8c91)] hover:bg-white/5 hover:text-[color:var(--c-white)] transition"
          >
            <Plus className="h-4 w-4" /> Add group
          </button>
        </div>
      )}

      <DragOverlay>
        {activeTask ? (
          <div className="w-[248px] cursor-grabbing rounded-xl border border-indigo-500 bg-[color:var(--c-1e1f21)] p-3 opacity-95 shadow-2xl rotate-1">
            <TaskCardView task={activeTask} showSubtasks={showSubtasks} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

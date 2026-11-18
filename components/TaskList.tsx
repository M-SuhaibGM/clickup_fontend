'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import TaskRow from './TaskRow';
import {
  ChevronDown,
  Columns3,
  ListPlus,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
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
import { GROUP_LABEL, UNASSIGNED, defaultGroupKey, defaultsForGroup, groupKeyOf, patchForGroup, type GroupBy } from '@/lib/taskGrouping';
import TaskViewToolbar from './TaskViewToolbar';
import { MenuLabel, MenuRow, ToolbarMenu, tbBtn, tbIdle } from './ToolbarMenu';
import {
  DEFAULT_COLUMNS,
  PRIORITY_OPTIONS,
  STATUSES,
  TASK_COLUMNS,
  gridTemplate,
  type ColumnKey,
} from '@/lib/taskColumns';

const EMPTY_TASKS: never[] = [];
const VIEW_KEY = 'task-list-view';


interface ViewPrefs {
  groupBy: GroupBy;
  columns: Record<ColumnKey, boolean>;
  showSubtasks: boolean;
  showClosed: boolean;
}
const DEFAULT_VIEW: ViewPrefs = { groupBy: 'status', columns: DEFAULT_COLUMNS, showSubtasks: true, showClosed: true };

function loadView(): ViewPrefs {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (!raw) return DEFAULT_VIEW;
    const v = JSON.parse(raw) as Partial<ViewPrefs>;
    return {
      groupBy: v.groupBy && v.groupBy in GROUP_LABEL ? v.groupBy : DEFAULT_VIEW.groupBy,
      columns: { ...DEFAULT_COLUMNS, ...(v.columns ?? {}) },
      showSubtasks: v.showSubtasks ?? true,
      showClosed: v.showClosed ?? true,
    };
  } catch {
    return DEFAULT_VIEW;
  }
}

interface Group {
  key: string;
  label: string;
  color: string;
  tasks: Task[];
}

const HIGHLIGHT = 'ring-1 ring-indigo-500/40 bg-indigo-500/5';

function GroupDroppable({ id, isOver, children }: { id: string; isOver: boolean; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `group-${id}` });
  return (
    <div ref={setNodeRef} className={`mb-3 transition-all duration-200 rounded ${isOver ? HIGHLIGHT : ''}`}>
      {children}
    </div>
  );
}

interface TaskListProps {
  listId: string;
  onTaskClick: (task: Task) => void;
  isAdmin: boolean;
}

export default function TaskList({ listId, onTaskClick, isAdmin }: TaskListProps) {
  const tasks = useTaskStore((s) => s.tasksByList[listId] ?? EMPTY_TASKS);
  const loadingTasks = useTaskStore((s) => s.loadingLists[listId] ?? false);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const createTask = useTaskStore((s) => s.createTask);
  const setTasks = useTaskStore((s) => s.setTasks);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const me = useAuthStore((s) => s.user);
  const users = useUserStore((s) => s.users);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);

  // View preferences (persisted)
  const [view, setView] = useState<ViewPrefs>(loadView);
  const { groupBy, columns, showSubtasks, showClosed } = view;
  const patchView = (p: Partial<ViewPrefs>) =>
    setView((v) => {
      const next = { ...v, ...p };
      try { localStorage.setItem(VIEW_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });

  // Filters (per visit)
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null); // user id | UNASSIGNED | null
  const [search, setSearch] = useState('');

  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const dragging = activeTask !== null;
  const [overGroup, setOverGroup] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [groupMenu, setGroupMenu] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  useEffect(() => {
    fetchTasks(listId);
  }, [listId, fetchTasks]);

  useEffect(() => {
    if (activeWorkspaceId && users.length === 0) useUserStore.getState().fetchUsers(activeWorkspaceId);
  }, [activeWorkspaceId, users.length]);

  // ── Filtering & grouping ──
  const filtersActive = priorityFilter.length > 0 || assigneeFilter !== null || search.trim() !== '';

  const visibleTop = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
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
  }, [tasks, showClosed, priorityFilter, assigneeFilter, search]);

  const groups = useMemo<Group[]>(() => {
    const by = (key: string, label: string, color: string): Group => ({
      key, label, color, tasks: visibleTop.filter((t) => groupKeyOf(groupBy, t) === key),
    });
    if (groupBy === 'status') {
      // Empty statuses are hidden, except while dragging (as drop targets) or adding a task to one
      return STATUSES.filter((s) => showClosed || s.value !== 'DONE')
        .map((s) => by(s.value, s.label, s.color))
        .filter((g) => g.tasks.length > 0 || dragging || addingIn === g.key);
    }
    if (groupBy === 'priority') {
      return PRIORITY_OPTIONS.map((p) => by(p.value, p.label.toUpperCase(), p.color)).filter((g) => g.tasks.length > 0 || addingIn === g.key);
    }
    if (groupBy === 'assignee') {
      const seen = new Map<string, string>();
      visibleTop.forEach((t) => t.assignee && seen.set(t.assignee.id, t.assignee.name));
      const out = [...seen].map(([id, name]) => by(id, name.toUpperCase(), '#6366f1'));
      const none = by(UNASSIGNED, 'UNASSIGNED', '#8a8c91');
      return none.tasks.length || addingIn === UNASSIGNED ? [...out, none] : out;
    }
    return [by('all', 'ALL TASKS', '#6366f1')];
  }, [visibleTop, groupBy, showClosed, dragging, addingIn]);

  const template = gridTemplate(columns);
  const allVisibleSelected = visibleTop.length > 0 && visibleTop.every((t) => selected.has(t.id));
  const selectedTasks = tasks.filter((t) => selected.has(t.id));

  // ── Creating ──
  /** Where "Add Task" goes when nothing is visible yet. */
  const firstGroupKey = () => groups[0]?.key ?? defaultGroupKey(groupBy);

  const startAdd = (key: string) => {
    setAddingIn(key);
    setTitle('');
    setCollapsed((c) => ({ ...c, [key]: false }));
  };

  const handleAdd = async () => {
    const name = title.trim();
    if (!name || !addingIn) return;
    try {
      await createTask(listId, { title: name, ...defaultsForGroup(groupBy, addingIn) });
      setTitle(''); // stay open so several tasks can be added in a row
    } catch { /* the store already toasts */ }
  };

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
    const target = overId.startsWith('group-') ? overId.slice(6) : tasks.find((t) => t.id === over.id) && groupKeyOf(groupBy, tasks.find((t) => t.id === over.id)!);
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

  // ── Selection / bulk ──
  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (!n.delete(id)) n.add(id);
      return n;
    });

  const bulkUpdate = async (patch: Partial<Task>) => {
    const results = await Promise.allSettled(selectedTasks.map((t) => updateTask(t.id, listId, patch)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed) fetchTasks(listId);
    else toast.success(`Updated ${results.length} task${results.length === 1 ? '' : 's'}`);
    setSelected(new Set());
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedTasks.length} task${selectedTasks.length === 1 ? '' : 's'}? This can't be undone.`)) return;
    await Promise.allSettled(selectedTasks.map((t) => deleteTask(t.id, listId)));
    setSelected(new Set());
  };

  const resetView = () => {
    patchView(DEFAULT_VIEW);
    setPriorityFilter([]);
    setAssigneeFilter(null);
    setSearch('');
  };

  const columnsMenu = () => (
    <>
      <MenuLabel>Show columns</MenuLabel>
      {TASK_COLUMNS.map((c) => (
        <MenuRow key={c.key} active={columns[c.key]} onClick={() => patchView({ columns: { ...columns, [c.key]: !columns[c.key] } })}>
          {c.label}
        </MenuRow>
      ))}
    </>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full">
        {/* ── Toolbar ── */}
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
          onAddTask={isAdmin ? () => startAdd(firstGroupKey()) : undefined}
          extraRight={
            <ToolbarMenu
              align="right"
              button={(open, toggle) => (
                <button onClick={toggle} aria-expanded={open} className={`${tbBtn} ${tbIdle}`}>
                  <Columns3 className="h-3.5 w-3.5" /> Columns
                </button>
              )}
            >
              {() => columnsMenu()}
            </ToolbarMenu>
          }
        />

        {/* ── Table ── */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[760px]">
            <div style={{ gridTemplateColumns: template }} className="group/thead grid gap-2 px-3 py-2 text-[12px] font-medium text-[color:var(--c-8a8c91)] border-b border-[color:var(--c-333438)] items-center">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={() => setSelected(allVisibleSelected ? new Set() : new Set(visibleTop.map((t) => t.id)))}
                aria-label="Select all tasks"
                className={`h-3.5 w-3.5 rounded accent-indigo-500 cursor-pointer transition-opacity ${selected.size > 0 ? 'opacity-100' : 'opacity-0 group-hover/thead:opacity-100 focus-visible:opacity-100'}`}
              />
              <div>Name</div>
              {TASK_COLUMNS.filter((c) => columns[c.key]).map((c) => <div key={c.key}>{c.label}</div>)}
              <ToolbarMenu
                align="right"
                button={(open, toggle) => (
                  <button onClick={toggle} aria-expanded={open} aria-label="Add or hide columns" title="Columns" className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--c-white)] text-[color:var(--c-1e1f21)] hover:opacity-85">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              >
                {() => columnsMenu()}
              </ToolbarMenu>
            </div>

            {tasks.length === 0 && !loadingTasks && (
              <div className="flex flex-col items-center gap-2 py-14 text-center">
                <ListPlus className="h-8 w-8 text-[color:var(--c-8a8c91)]" />
                <p className="text-sm font-semibold text-[color:var(--c-white)]">No tasks in this list yet</p>
                {isAdmin && (
                  <button onClick={() => startAdd(firstGroupKey())} className="rounded-md bg-[color:var(--c-white)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--c-1e1f21)] hover:opacity-85 transition">
                    Add the first task
                  </button>
                )}
              </div>
            )}

            {tasks.length > 0 && visibleTop.length === 0 && filtersActive && (
              <div className="py-10 text-center text-sm text-[color:var(--c-8a8c91)]">
                No tasks match your filters.{' '}
                <button onClick={() => { setPriorityFilter([]); setAssigneeFilter(null); setSearch(''); }} className="text-indigo-400 hover:underline">Clear filters</button>
              </div>
            )}

            {groups.map((group) => {
              const isCollapsed = !!collapsed[group.key];
              const showEmptyHint = groupBy === 'status' && group.tasks.length === 0 && !filtersActive && tasks.length > 0;
              return (
                <GroupDroppable key={group.key} id={group.key} isOver={overGroup === group.key}>
                  <div className="group/header flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))}
                      aria-expanded={!isCollapsed}
                      className="flex items-center gap-2 select-none"
                    >
                      <ChevronDown className={`h-3.5 w-3.5 text-[color:var(--c-8a8c91)] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                      <span className="flex items-center gap-1.5 rounded-md bg-[color:var(--c-2a2b2e)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--c-white)]">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} /> {group.label}
                      </span>
                      <span className="text-[12px] text-[color:var(--c-8a8c91)]">{group.tasks.length}</span>
                    </button>

                    <div className="relative flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button onClick={() => setGroupMenu(groupMenu === group.key ? null : group.key)} aria-label="Group actions" className="p-1 rounded text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)]">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => startAdd(group.key)} aria-label={`Add task to ${group.label}`} className="p-1 rounded text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)]">
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                      {groupMenu === group.key && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setGroupMenu(null)} />
                          <div className="absolute left-0 top-full z-30 mt-1 w-48 rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] p-1 shadow-2xl">
                            {isAdmin && <MenuRow onClick={() => { startAdd(group.key); setGroupMenu(null); }}>Add task</MenuRow>}
                            <MenuRow onClick={() => { setCollapsed(Object.fromEntries(groups.map((g) => [g.key, true]))); setGroupMenu(null); }}>Collapse all groups</MenuRow>
                            <MenuRow onClick={() => { setCollapsed({}); setGroupMenu(null); }}>Expand all groups</MenuRow>
                            {group.tasks.length > 0 && (
                              <MenuRow onClick={() => { setSelected((s) => new Set([...s, ...group.tasks.map((t) => t.id)])); setGroupMenu(null); }}>Select all in group</MenuRow>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {!isCollapsed && (
                    <>
                      <SortableContext items={group.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                        {group.tasks.map((t) => (
                          <TaskRow
                            key={t.id}
                            task={t}
                            allTasks={tasks}
                            onOpen={onTaskClick}
                            columns={columns}
                            selected={selected.has(t.id)}
                            onToggleSelect={() => toggleSelect(t.id)}
                            showSubtasks={showSubtasks}
                            isAdmin={isAdmin}
                          />
                        ))}
                      </SortableContext>

                      {showEmptyHint && <div className="px-3 py-3 text-center text-xs text-[color:var(--c-8a8c91)]">Drop tasks here</div>}

                      {isAdmin && addingIn === group.key ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 pl-12 border-b border-[color:var(--c-2a2b2e)] bg-[color:var(--c-232426)]">
                          <input
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAdd();
                              if (e.key === 'Escape') setAddingIn(null);
                            }}
                            placeholder="Task name (Enter to add, Esc to close)"
                            className="flex-1 bg-transparent text-sm text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
                          />
                          <button onClick={handleAdd} disabled={!title.trim()} className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                            Add
                          </button>
                          <button onClick={() => setAddingIn(null)} aria-label="Cancel" className="p-1 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        isAdmin && (
                          <button onClick={() => startAdd(group.key)} className="flex w-full items-center gap-2 px-3 py-2 pl-12 text-[12.5px] text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)] transition">
                            <Plus className="h-3.5 w-3.5" /> Add Task
                          </button>
                        )
                      )}
                    </>
                  )}
                </GroupDroppable>
              );
            })}
          </div>
        </div>

        {/* ── Bulk action bar ── */}
        {selectedTasks.length > 0 && (
          <div className="sticky bottom-4 z-20 mt-4 flex justify-center">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] px-3 py-2 shadow-2xl">
              <span className="flex items-center gap-1.5 rounded-md bg-indigo-500/20 px-2 py-1 text-[12px] font-semibold text-indigo-300">
                {selectedTasks.length} selected
              </span>
              <select
                value=""
                onChange={(e) => e.target.value && bulkUpdate({ status: e.target.value as Task['status'] })}
                className="rounded-md border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] px-2 py-1 text-[12px] text-[color:var(--c-white)] outline-none"
              >
                <option value="">Set status…</option>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {isAdmin && (
                <select
                  value=""
                  onChange={(e) => e.target.value && bulkUpdate({ priority: e.target.value as Task['priority'] })}
                  className="rounded-md border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] px-2 py-1 text-[12px] text-[color:var(--c-white)] outline-none"
                >
                  <option value="">Set priority…</option>
                  {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              )}
              {isAdmin && (
                <button onClick={bulkDelete} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-red-400 hover:bg-red-500/10 transition">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              )}
              <button onClick={() => setSelected(new Set())} aria-label="Clear selection" className="rounded-md p-1 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="bg-[color:var(--c-2a2b2e)] border border-indigo-500 rounded px-3 py-2 text-sm text-[color:var(--c-white)] shadow-xl opacity-90">
            {activeTask.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

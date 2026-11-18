'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/task';
import Image from 'next/image';
import {
  Circle,
  CheckCircle2,
  CircleDashed,
  MessageSquare,
  UserCircle,
  Flag,
  Calendar as CalendarIcon,
  Plus,
  Pencil,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Loader2,
  Check,
  Ban,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Link2,
  ExternalLink,
  GitFork,
} from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import UserAvatar from './UserAvatar';
import { toast } from 'sonner';
import { STATUSES, gridTemplate, statusMeta, type ColumnKey } from '@/lib/taskColumns';

const STATUS_ICONS: Record<string, any> = {
  TODO: Circle,
  IN_PROGRESS: CircleDashed,
  DONE: CheckCircle2,
};

const PRIORITIES = [
  { value: 'URGENT', label: 'Urgent', color: '#ef4444', shortcut: 'Ctrl 1' },
  { value: 'HIGH', label: 'High', color: '#f59e0b', shortcut: 'Ctrl 2' },
  { value: 'NORMAL', label: 'Normal', color: '#3b82f6', shortcut: 'Ctrl 3' },
  { value: 'LOW', label: 'Low', color: '#8a8c91', shortcut: 'Ctrl 4' },
];

function getQuickDates() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thisWeekend = new Date(today);
  const dow = today.getDay();
  thisWeekend.setDate(thisWeekend.getDate() + (dow === 6 ? 7 : 6 - dow));

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + (dow === 1 ? 7 : (8 - dow) % 7));

  const nextWeekend = new Date(thisWeekend);
  nextWeekend.setDate(nextWeekend.getDate() + 7);

  const twoWeeks = new Date(today);
  twoWeeks.setDate(twoWeeks.getDate() + 14);

  const fourWeeks = new Date(today);
  fourWeeks.setDate(fourWeeks.getDate() + 28);

  const dayName = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateFmt = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  return [
    { label: 'Today', hint: dayName(today), date: today },
    { label: 'Tomorrow', hint: dayName(tomorrow), date: tomorrow },
    { label: 'This weekend', hint: dayName(thisWeekend), date: thisWeekend },
    { label: 'Next week', hint: dateFmt(nextWeek), date: nextWeek },
    { label: 'Next weekend', hint: dateFmt(nextWeekend), date: nextWeekend },
    { label: '2 weeks', hint: dateFmt(twoWeeks), date: twoWeeks },
    { label: '4 weeks', hint: dateFmt(fourWeeks), date: fourWeeks },
  ];
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const days: { day: number; currentMonth: boolean }[] = [];

  const prevLast = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    days.push({ day: prevLast - i, currentMonth: false });
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push({ day: d, currentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ day: d, currentMonth: false });
  }
  return days;
}

interface TaskRowProps {
  task: Task;
  /** opens the detail modal for a task (or one of its subtasks) */
  onOpen: (task: Task) => void;
  allTasks?: Task[];
  columns: Record<ColumnKey, boolean>;
  selected: boolean;
  onToggleSelect: () => void;
  showSubtasks: boolean;
  isAdmin: boolean;
}

export default function TaskRow({ task, onOpen, allTasks = [], columns, selected, onToggleSelect, showSubtasks, isAdmin }: TaskRowProps) {
  const onClick = () => onOpen(task);
  const template = gridTemplate(columns);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const [showStatus, setShowStatus] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const updateTask = useTaskStore((s) => s.updateTask);
  const createTask = useTaskStore((s) => s.createTask);
  const users = useUserStore((s) => s.users);
  const currentUser = useAuthStore((s) => s.user);

  const [isEditing, setIsEditing] = useState(false);
  const [taskTitle, setTaskTitle] = useState(task.title);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [submittingSubtask, setSubmittingSubtask] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(true);

  const [showAssignee, setShowAssignee] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  // Where the open popup sits: attached to the edge of the icon that opened it
  const [popPos, setPopPos] = useState<{ top?: number; bottom?: number; left: number; maxHeight: number }>({ left: 0, maxHeight: 300 });
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [prioritySearch, setPrioritySearch] = useState('');

  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const inputRef = useRef<HTMLInputElement>(null);

  const StatusIcon = STATUS_ICONS[task.status] || Circle;
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const childSubtasks = allTasks.filter((t) => t.parentId === task.id);
  const priorityColor = PRIORITIES.find(p => p.value === task.priority)?.color || '#8a8c91';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
    }
  }, [isEditing]);

  const closeAll = () => {
    setShowAssignee(false);
    setShowDatePicker(false);
    setShowPriority(false);
    setShowStatus(false);
    setShowMenu(false);
    setAssigneeSearch('');
    setPrioritySearch('');
  };

  const openDropdown = (e: React.MouseEvent, which: 'assignee' | 'date' | 'priority' | 'status' | 'menu') => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAdmin && (which === 'assignee' || which === 'date' || which === 'priority')) {
      toast.error('Only admins can edit task details');
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const widths = { assignee: 280, date: 480, priority: 240, status: 200, menu: 200 };
    const heights = { assignee: 300, date: 360, priority: 280, status: 140, menu: 220 };
    const w = widths[which];
    const h = heights[which];
    // Open under the icon; flip above it only when there's clearly more room there. Either way the popup is
    // anchored to the icon's edge (not to a guessed height) and scrolls if the window is too short.
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const below = spaceBelow >= h || spaceBelow >= spaceAbove;
    // the row menu hangs from the button's right edge, everything else from the left
    const left = which === 'menu' ? rect.right - w : rect.left;
    setPopPos({
      ...(below ? { top: rect.bottom + 4 } : { bottom: window.innerHeight - rect.top + 4 }),
      left: Math.max(8, Math.min(left, window.innerWidth - w - 8)),
      maxHeight: Math.max(160, below ? spaceBelow : spaceAbove),
    });
    closeAll();
    if (which === 'assignee') setShowAssignee(true);
    if (which === 'date') {
      const d = task.dueDate ? new Date(task.dueDate) : new Date();
      setCalMonth(d.getMonth());
      setCalYear(d.getFullYear());
      setShowDatePicker(true);
    }
    if (which === 'priority') setShowPriority(true);
    if (which === 'status') setShowStatus(true);
    if (which === 'menu') setShowMenu(true);
  };

  const handleSaveTitle = async () => {
    if (taskTitle.trim() && taskTitle !== task.title) {
      await updateTask(task.id, task.listId, { title: taskTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleAddSubtask = async () => {
    if (!subtaskTitle.trim() || submittingSubtask) return;
    setSubmittingSubtask(true);
    try {
      await createTask(task.listId, { title: subtaskTitle.trim(), parentId: task.id } as any);
      setSubtaskTitle('');
    } finally {
      setSubmittingSubtask(false);
    }
  };

  const handleAssigneeChange = async (userId: string) => {
    closeAll();
    await updateTask(task.id, task.listId, { assigneeId: userId || null } as any);
  };

  const handleDateChange = async (date: Date | null) => {
    closeAll();
    await updateTask(task.id, task.listId, { dueDate: date ? date.toISOString() : null } as any);
  };

  const handleStatusChange = async (status: Task['status']) => {
    closeAll();
    if (status === task.status) return;
    try {
      await updateTask(task.id, task.listId, { status });
    } catch { /* the store already toasts */ }
  };

  const toggleDone = () => handleStatusChange(task.status === 'DONE' ? 'TODO' : 'DONE');

  const copyLink = async () => {
    closeAll();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/tasks/${task.id}`);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const handleDelete = async () => {
    closeAll();
    if (!confirm(`Delete "${task.title}"? Its subtasks will be removed too.`)) return;
    try { await deleteTask(task.id, task.listId); } catch { /* the store already toasts */ }
  };

  const handlePriorityChange = async (priority: string) => {
    closeAll();
    await updateTask(task.id, task.listId, { priority } as any);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const filteredPriorities = PRIORITIES.filter(p =>
    p.label.toLowerCase().includes(prioritySearch.toLowerCase())
  );

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const calendarDays = getCalendarDays(calYear, calMonth);
  const quickDates = getQuickDates();
  const selectedDate = task.dueDate ? new Date(task.dueDate) : null;
  if (selectedDate) selectedDate.setHours(0, 0, 0, 0);

  const isTodayDay = (day: number, cm: boolean) =>
    cm && day === todayDate.getDate() && calMonth === todayDate.getMonth() && calYear === todayDate.getFullYear();

  const isSelectedDay = (day: number, cm: boolean) =>
    cm && selectedDate && day === selectedDate.getDate() && calMonth === selectedDate.getMonth() && calYear === selectedDate.getFullYear();

  const showCol = (k: ColumnKey) => columns[k];
  const subtasksVisible = showSubtasks && subtasksOpen;
  const commentCount = task._count?.comments ?? task.comments?.length ?? 0;
  const status = statusMeta(task.status);

  return (
    <>
      <div className="group/row">
        <div
          ref={setNodeRef}
          style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, gridTemplateColumns: template }}
          {...attributes}
          {...listeners}
          onClick={onClick}
          className={`relative grid gap-2 px-3 py-2 border-b border-[color:var(--c-2a2b2e)] transition-colors cursor-pointer items-center text-[13px] text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)] ${selected ? 'bg-indigo-500/10' : ''}`}
        >
          <GripVertical className="absolute -left-0.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--c-8a8c91)] opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab" />

          {/* Select */}
          <div onClick={(e) => e.stopPropagation()} className="flex items-center">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              aria-label={`Select ${task.title}`}
              className="h-3.5 w-3.5 rounded border-[color:var(--c-444548)] bg-transparent accent-indigo-500 cursor-pointer opacity-0 group-hover/row:opacity-100 checked:opacity-100 focus-visible:opacity-100 transition-opacity"
            />
          </div>

          {/* Name & quick hover actions */}
          <div className="flex items-center gap-2 min-w-0 relative">
            {childSubtasks.length > 0 ? (
              <button onClick={(e) => { e.stopPropagation(); setSubtasksOpen(!subtasksOpen); }} aria-label="Toggle subtasks" className="text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">
                {subtasksVisible ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-3.5 shrink-0" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); toggleDone(); }}
              title={task.status === 'DONE' ? 'Mark as to do' : 'Mark as complete'}
              className="shrink-0 hover:scale-110 transition-transform"
            >
              <StatusIcon className="h-4 w-4" style={{ color: status.color }} />
            </button>

            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') { setTaskTitle(task.title); setIsEditing(false); }
                }}
                className="bg-[color:var(--c-1e1f21)] border border-indigo-500 rounded px-1.5 py-0.5 text-[color:var(--c-white)] text-[13px] outline-none w-full"
              />
            ) : (
              <span
                className={`truncate ${task.status === 'DONE' ? 'text-[color:var(--c-8a8c91)] line-through' : ''}`}
              >
                {task.title}
              </span>
            )}

            {childSubtasks.length > 0 && (
              <span title={`${childSubtasks.length} subtask${childSubtasks.length === 1 ? '' : 's'}`} className="flex shrink-0 items-center gap-0.5 text-[11px] text-[color:var(--c-8a8c91)]">
                <GitFork className="h-3 w-3" /> {childSubtasks.length}
              </span>
            )}

            {isAdmin && (
              <div className="opacity-0 group-hover/row:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                <button
                  title="Add subtask"
                  onClick={(e) => { e.stopPropagation(); setShowSubtaskInput(!showSubtaskInput); setSubtasksOpen(true); }}
                  className="p-1 border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] hover:bg-[color:var(--c-333438)] rounded text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  title="Rename task"
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  className="p-1 border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] hover:bg-[color:var(--c-333438)] rounded text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Assignee */}
          {showCol('assignee') && (
            <div className="flex items-center cursor-pointer" onClick={(e) => openDropdown(e, 'assignee')}>
              {task.assignee ? (
                <span title={task.assignee.name}><UserAvatar name={task.assignee.name} src={task.assignee.avatar} size={24} /></span>
              ) : (
                <div className="h-6 w-6 rounded-full border border-dashed border-[color:var(--c-444548)] flex items-center justify-center hover:border-indigo-500 transition">
                  <UserCircle className="h-4 w-4 text-[color:var(--c-8a8c91)]" />
                </div>
              )}
            </div>
          )}

          {/* Due date */}
          {showCol('dueDate') && (
            <div
              className="text-[12px] text-[color:var(--c-8a8c91)] cursor-pointer hover:text-[color:var(--c-white)] transition"
              onClick={(e) => openDropdown(e, 'date')}
            >
              {due ? (
                <span className={`transition ${task.status !== 'DONE' && due.getTime() < todayStart() ? 'text-red-400' : 'hover:text-indigo-400'}`}>
                  {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              ) : (
                <CalendarIcon className="h-4 w-4" />
              )}
            </div>
          )}

          {/* Priority */}
          {showCol('priority') && (
            <div onClick={(e) => openDropdown(e, 'priority')} className="cursor-pointer">
              <span className="flex items-center gap-1.5 text-[12px] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition capitalize">
                <Flag className="h-3.5 w-3.5" style={{ color: priorityColor }} fill={task.priority && task.priority !== 'NORMAL' ? priorityColor : 'none'} />
                {task.priority && task.priority !== 'NORMAL' ? task.priority.toLowerCase() : ''}
              </span>
            </div>
          )}

          {/* Status pill */}
          {showCol('status') && (
            <div onClick={(e) => openDropdown(e, 'status')} className="cursor-pointer">
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] rounded text-[11px] font-bold text-[color:var(--c-e5e5e5)] w-max hover:border-[color:var(--c-444548)] transition">
                <StatusIcon className="h-3.5 w-3.5" style={{ color: status.color }} /> {status.label}
              </span>
            </div>
          )}

          {/* Comments */}
          {showCol('comments') && (
            <div className="flex items-center gap-1 text-[12px] text-[color:var(--c-8a8c91)]">
              <MessageSquare className={`h-3.5 w-3.5 ${commentCount ? '' : 'opacity-60'}`} />
              {commentCount > 0 && <span>{commentCount}</span>}
            </div>
          )}

          {/* Row menu */}
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => openDropdown(e, 'menu')}
              aria-label="Task actions"
              className="p-1 rounded text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)] opacity-0 group-hover/row:opacity-100 transition"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showSubtaskInput && (
          <div className="pl-12 pr-3 py-2 bg-[color:var(--c-232426)]/80 border-b border-[color:var(--c-2a2b2e)] flex items-center gap-2">
            <span className="text-[11px] text-indigo-400 font-semibold">+ Subtask:</span>
            <input
              autoFocus
              type="text"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubtask();
                if (e.key === 'Escape') setShowSubtaskInput(false);
              }}
              placeholder="Subtask name... (Press Enter to add multiple)"
              disabled={submittingSubtask}
              className="flex-1 bg-transparent text-xs text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
            />
            <button
              onClick={handleAddSubtask}
              disabled={submittingSubtask || !subtaskTitle.trim()}
              className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1"
            >
              {submittingSubtask && <Loader2 className="h-3 w-3 animate-spin" />}
              {submittingSubtask ? 'Adding...' : 'Add'}
            </button>
            <button onClick={() => setShowSubtaskInput(false)} className="px-2 py-1 text-xs text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">Done</button>
          </div>
        )}
      </div>

      {subtasksVisible && childSubtasks.map((sub) => (
        <SubtaskRow key={sub.id} sub={sub} template={template} columns={columns} onOpen={() => onOpen(sub)} />
      ))}

      {/* Status Dropdown */}
      {showStatus && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999]" onClick={closeAll}>
          <div
            className="fixed w-[200px] bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] rounded-lg shadow-2xl overflow-y-auto py-1"
            style={popPos}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#555]">Status</div>
            {STATUSES.map((st) => {
              const Icon = STATUS_ICONS[st.value];
              return (
                <button
                  key={st.value}
                  onClick={() => handleStatusChange(st.value)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)] transition"
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: st.color }} />
                  <span className="flex-1 text-left font-semibold">{st.label}</span>
                  {task.status === st.value && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {/* Row menu */}
      {showMenu && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999]" onClick={closeAll}>
          <div
            className="fixed w-[200px] bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] rounded-lg shadow-2xl overflow-y-auto py-1"
            style={popPos}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem icon={ExternalLink} label="Open task" onClick={() => { closeAll(); onClick(); }} />
            {isAdmin && <MenuItem icon={Pencil} label="Rename" onClick={() => { closeAll(); setIsEditing(true); }} />}
            {isAdmin && <MenuItem icon={Plus} label="Add subtask" onClick={() => { closeAll(); setShowSubtaskInput(true); setSubtasksOpen(true); }} />}
            <MenuItem icon={Link2} label="Copy link" onClick={copyLink} />
            {isAdmin && (
              <div className="mt-1 border-t border-[color:var(--c-333438)] pt-1">
                <MenuItem icon={Trash2} label="Delete" danger onClick={handleDelete} />
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── Portal Dropdowns ── */}

      {/* Assignee Dropdown */}
      {showAssignee && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999]" onClick={closeAll}>
          <div
            className="fixed w-[280px] bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] rounded-lg shadow-2xl overflow-y-auto"
            style={popPos}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[color:var(--c-333438)]">
              <UserCircle className="h-4 w-4 text-[color:var(--c-8a8c91)] shrink-0" />
              <input
                autoFocus
                value={assigneeSearch}
                onChange={e => setAssigneeSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-xs text-[color:var(--c-white)] outline-none placeholder:text-[#555]"
              />
            </div>

            <div className="flex border-b border-[color:var(--c-333438)] text-[11px]">
              <button className="px-3 py-1.5 text-[color:var(--c-white)] font-semibold border-b-2 border-indigo-500">All</button>
              <button className="px-3 py-1.5 text-[color:var(--c-8a8c91)]">People</button>
            </div>

            <div className="max-h-[220px] overflow-y-auto py-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#555]">People</div>

              {currentUser && (
                <button
                  onClick={() => handleAssigneeChange(currentUser.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)] transition"
                >
                  {currentUser.avatar ? (
                    <Image src={currentUser.avatar} alt="" width={22} height={22} className="rounded-full" />
                  ) : (
                    <div className="h-[22px] w-[22px] rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                      {currentUser.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="flex-1 text-left">Me</span>
                  {task.assigneeId === currentUser.id && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  <span className="text-[10px] text-[#555]">↵</span>
                </button>
              )}

              <p className="px-3 py-1 text-[10px] text-[#555] italic">Keep typing a full email to invite</p>

              {filteredUsers.filter(u => u.id !== currentUser?.id).map(u => (
                <button
                  key={u.id}
                  onClick={() => handleAssigneeChange(u.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)] transition"
                >
                  {u.avatar ? (
                    <Image src={u.avatar} alt="" width={22} height={22} className="rounded-full" />
                  ) : (
                    <div className="h-[22px] w-[22px] rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="flex-1 text-left">{u.name}</span>
                  {task.assigneeId === u.id && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                </button>
              ))}

              {task.assigneeId && (
                <button
                  onClick={() => handleAssigneeChange('')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-[color:var(--c-333438)] transition border-t border-[color:var(--c-333438)] mt-1"
                >
                  <Ban className="h-3.5 w-3.5" /> Unassign
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Date Picker Dropdown */}
      {showDatePicker && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999]" onClick={closeAll}>
          <div
            className="fixed w-[480px] bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] rounded-lg shadow-2xl overflow-y-auto"
            style={popPos}
            onClick={e => e.stopPropagation()}
          >
            {/* Start / Due tabs */}
            <div className="flex border-b border-[color:var(--c-333438)]">
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs text-[color:var(--c-8a8c91)] border-b-2 border-transparent">
                <CalendarIcon className="h-3.5 w-3.5" /> Start date
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs text-[color:var(--c-white)] font-semibold border-b-2 border-indigo-500">
                <CalendarIcon className="h-3.5 w-3.5" /> Due date
              </button>
            </div>

            <div className="flex">
              {/* Quick options */}
              <div className="w-[200px] border-r border-[color:var(--c-333438)] py-1">
                {quickDates.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => handleDateChange(opt.date)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)] transition"
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] text-[color:var(--c-8a8c91)]">{opt.hint}</span>
                  </button>
                ))}
                {selectedDate && (
                  <button
                    onClick={() => handleDateChange(null)}
                    className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:bg-[color:var(--c-333438)] transition mt-1 border-t border-[color:var(--c-333438)]"
                  >
                    <Ban className="h-3 w-3" /> Clear date
                  </button>
                )}
              </div>

              {/* Calendar */}
              <div className="flex-1 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[color:var(--c-white)]">
                    {new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-[color:var(--c-333438)] rounded text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { const n = new Date(); setCalMonth(n.getMonth()); setCalYear(n.getFullYear()); }}
                      className="px-1.5 py-0.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Today
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-[color:var(--c-333438)] rounded text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-[#555] py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((d, i) => {
                    const isToday = isTodayDay(d.day, d.currentMonth);
                    const isSel = isSelectedDay(d.day, d.currentMonth);
                    return (
                      <button
                        key={i}
                        onClick={() => d.currentMonth && handleDateChange(new Date(calYear, calMonth, d.day))}
                        disabled={!d.currentMonth}
                        className={[
                          'h-7 w-7 mx-auto flex items-center justify-center text-[11px] rounded-full transition',
                          !d.currentMonth ? 'text-[color:var(--c-333438)]' : 'text-[color:var(--c-e5e5e5)] hover:bg-[#444]',
                          isToday ? 'bg-indigo-600 text-white font-bold' : '',
                          isSel && !isToday ? 'bg-indigo-500/30 text-indigo-300 font-bold ring-1 ring-indigo-500' : '',
                        ].join(' ')}
                      >
                        {d.day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Priority Dropdown */}
      {showPriority && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999]" onClick={closeAll}>
          <div
            className="fixed w-[240px] bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] rounded-lg shadow-2xl overflow-y-auto"
            style={popPos}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 py-2.5 border-b border-[color:var(--c-333438)]">
              <input
                autoFocus
                value={prioritySearch}
                onChange={e => setPrioritySearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[color:var(--c-1e1f21)] border border-[color:var(--c-333438)] rounded px-2 py-1.5 text-xs text-[color:var(--c-white)] outline-none placeholder:text-[#555] focus:border-[#555] transition"
              />
            </div>

            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#555]">Priority</div>
              {filteredPriorities.map(p => (
                <button
                  key={p.value}
                  onClick={() => handlePriorityChange(p.value)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)] transition"
                >
                  <span className="h-3.5 w-3.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="flex-1 text-left">{p.label}</span>
                  <span className="text-[10px] text-[#555]">{p.shortcut}</span>
                  {task.priority === p.value && <Check className="h-3.5 w-3.5 text-indigo-400 ml-1" />}
                </button>
              ))}
              <button
                onClick={() => handlePriorityChange('NORMAL')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-333438)] hover:text-[color:var(--c-white)] transition"
              >
                <Ban className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left">Clear</span>
                <span className="text-[10px] text-[#555]">Ctrl 0</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}


const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-[color:var(--c-333438)] transition ${danger ? 'text-red-400' : 'text-[color:var(--c-white)]'}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/** A subtask: read-only cells in the same columns as its parent. */
function SubtaskRow({ sub, template, columns, onOpen }: { sub: Task; template: string; columns: Record<ColumnKey, boolean>; onOpen: () => void }) {
  const Icon = STATUS_ICONS[sub.status] || Circle;
  const st = statusMeta(sub.status);
  const prio = PRIORITIES.find((p) => p.value === sub.priority);
  const due = sub.dueDate ? new Date(sub.dueDate) : null;
  const count = sub._count?.comments ?? 0;
  return (
    <div
      onClick={onOpen}
      style={{ gridTemplateColumns: template }}
      className="grid gap-2 px-3 py-2 border-b border-[color:var(--c-2a2b2e)] bg-[color:var(--c-232426)]/60 hover:bg-[color:var(--c-2a2b2e)] transition-colors cursor-pointer items-center text-[13px] text-[color:var(--c-e5e5e5)]"
    >
      <span />
      <div className="flex items-center gap-2 min-w-0 pl-9">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: st.color }} />
        <span className={`truncate ${sub.status === 'DONE' ? 'text-[color:var(--c-8a8c91)] line-through' : ''}`}>{sub.title}</span>
      </div>
      {columns.assignee && (
        <div>{sub.assignee ? <UserAvatar name={sub.assignee.name} src={sub.assignee.avatar} size={22} /> : <span className="text-[color:var(--c-8a8c91)]">–</span>}</div>
      )}
      {columns.dueDate && (
        <div className="text-[12px] text-[color:var(--c-8a8c91)]">{due ? due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '–'}</div>
      )}
      {columns.priority && (
        <div className="flex items-center gap-1.5 text-[12px] text-[color:var(--c-8a8c91)] capitalize">
          <Flag className="h-3.5 w-3.5" style={{ color: prio?.color }} />
          {sub.priority && sub.priority !== 'NORMAL' ? sub.priority.toLowerCase() : ''}
        </div>
      )}
      {columns.status && (
        <div>
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] rounded text-[11px] font-bold w-max">
            <Icon className="h-3 w-3" style={{ color: st.color }} /> {st.label}
          </span>
        </div>
      )}
      {columns.comments && (
        <div className="flex items-center gap-1 text-[12px] text-[color:var(--c-8a8c91)]">
          <MessageSquare className="h-3.5 w-3.5 opacity-60" />{count > 0 && count}
        </div>
      )}
      <span />
    </div>
  );
}

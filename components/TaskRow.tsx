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
} from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';

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

export default function TaskRow({ task, onClick, allTasks = [] }: { task: Task; onClick: () => void; allTasks?: Task[] }) {
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
  const dropdownPosRef = useRef({ top: 0, left: 0 });
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
    setAssigneeSearch('');
    setPrioritySearch('');
  };

  const openDropdown = (e: React.MouseEvent, which: 'assignee' | 'date' | 'priority') => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const widths = { assignee: 280, date: 480, priority: 240 };
    const heights = { assignee: 300, date: 360, priority: 280 };
    const w = widths[which];
    const h = heights[which];
    const spaceBelow = window.innerHeight - rect.bottom;
    dropdownPosRef.current = {
      top: spaceBelow > h + 8 ? rect.bottom + 4 : Math.max(8, rect.top - h - 4),
      left: Math.min(rect.left, window.innerWidth - w - 16),
    };
    closeAll();
    if (which === 'assignee') setShowAssignee(true);
    if (which === 'date') {
      const d = task.dueDate ? new Date(task.dueDate) : new Date();
      setCalMonth(d.getMonth());
      setCalYear(d.getFullYear());
      setShowDatePicker(true);
    }
    if (which === 'priority') setShowPriority(true);
  };

  const handleSaveTitle = async () => {
    if (taskTitle.trim() && taskTitle !== task.title) {
      await updateTask(task.listId, task.id, { title: taskTitle.trim() });
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

  return (
    <>
      <div className="group/row">
        <div
          ref={setNodeRef}
          style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
          {...attributes}
          {...listeners}
          onClick={onClick}
          className="grid grid-cols-[1fr_120px_120px_150px_100px_40px] gap-2 px-3 py-2.5 border-b border-[#333438] hover:bg-[#2a2b2e] transition-colors cursor-pointer items-center text-[13px] text-[#e5e5e5]"
        >
          {/* Name & Quick Hover Actions */}
          <div className="flex items-center gap-2 truncate relative" onClick={(e) => e.stopPropagation()}>
            {childSubtasks.length > 0 && (
              <button onClick={() => setSubtasksOpen(!subtasksOpen)} className="text-[#8a8c91] hover:text-white">
                {subtasksOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            )}
            <Circle className="h-4 w-4 text-[#8a8c91] shrink-0" />

            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') { setTaskTitle(task.title); setIsEditing(false); }
                }}
                className="bg-[#1e1f21] border border-indigo-500 rounded px-1.5 py-0.5 text-white text-[13px] outline-none w-full"
              />
            ) : (
              <span className="truncate flex-1" onDoubleClick={() => setIsEditing(true)}>{task.title}</span>
            )}

            {childSubtasks.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#8a8c91] bg-[#232426] px-1.5 py-0.5 rounded border border-[#333438]">
                ↳ {childSubtasks.length}
              </span>
            )}

            <div className="opacity-0 group-hover/row:opacity-100 flex items-center gap-1 bg-[#2a2b2e] px-1 rounded transition-opacity shrink-0 ml-auto">
              <button
                title="Add Subtask"
                onClick={(e) => { e.stopPropagation(); setShowSubtaskInput(!showSubtaskInput); setSubtasksOpen(true); }}
                className="p-1 hover:bg-[#333438] rounded text-[#8a8c91] hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                title="Rename task"
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="p-1 hover:bg-[#333438] rounded text-[#8a8c91] hover:text-white"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Assignee */}
          <div
            className="flex items-center cursor-pointer"
            onClick={(e) => openDropdown(e, 'assignee')}
          >
            {task.assignee ? (
              <Image src={task.assignee.avatar || ''} alt="A" width={24} height={24} className="rounded-full border border-[#333438] hover:border-indigo-500 transition" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-[#2a2b2e] border border-[#333438] flex items-center justify-center hover:border-indigo-500 transition">
                <UserCircle className="h-4 w-4 text-[#8a8c91]" />
              </div>
            )}
          </div>

          {/* Due Date */}
          <div
            className="text-[12px] text-[#8a8c91] cursor-pointer hover:text-white transition"
            onClick={(e) => openDropdown(e, 'date')}
          >
            {due ? (
              <span className="hover:text-indigo-400 transition">{due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            ) : (
              <CalendarIcon className="h-4 w-4 text-[#8a8c91] hover:text-white transition" />
            )}
          </div>

          {/* Priority */}
          <div onClick={(e) => openDropdown(e, 'priority')} className="cursor-pointer">
            <span className="flex items-center gap-1 text-[12px] text-[#8a8c91] hover:text-white transition">
              <Flag className="h-3.5 w-3.5" style={{ color: priorityColor }} /> {task.priority || 'Normal'}
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
            <MessageSquare className="h-3.5 w-3.5 text-[#8a8c91] group-hover/row:opacity-100 opacity-60" />
          </div>
        </div>

        {showSubtaskInput && (
          <div className="pl-10 pr-3 py-2 bg-[#232426]/80 border-b border-[#333438] flex items-center gap-2">
            <span className="text-[11px] text-indigo-400 font-semibold">+ Subtask:</span>
            <input
              ref={inputRef}
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
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#8a8c91]"
            />
            <button
              onClick={handleAddSubtask}
              disabled={submittingSubtask || !subtaskTitle.trim()}
              className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1"
            >
              {submittingSubtask && <Loader2 className="h-3 w-3 animate-spin" />}
              {submittingSubtask ? 'Adding...' : 'Add'}
            </button>
            <button onClick={() => setShowSubtaskInput(false)} className="px-2 py-1 text-xs text-[#8a8c91] hover:text-white">Done</button>
          </div>
        )}
      </div>

      {subtasksOpen && childSubtasks.map((sub) => (
        <div key={sub.id} onClick={() => onClick()} className="grid grid-cols-[1fr_120px_120px_150px_100px_40px] gap-2 px-3 py-2 pl-8 border-b border-[#333438]/50 bg-[#191a1c] hover:bg-[#222326] transition-colors cursor-pointer items-center text-[12px] text-[#cccccc]">
          <div className="flex items-center gap-2 truncate">
            <span className="text-indigo-400 font-mono text-[10px]">└─</span>
            <Circle className="h-3.5 w-3.5 text-[#8a8c91] shrink-0" />
            <span className="truncate">{sub.title}</span>
          </div>
          <div className="text-xs text-[#8a8c91]">-</div>
          <div className="text-xs text-[#8a8c91]">-</div>
          <div className="text-xs text-[#8a8c91]">{sub.priority}</div>
          <div>
            <span className="px-1.5 py-0.5 bg-[#2a2b2e] rounded text-[10px] text-white">{sub.status}</span>
          </div>
          <div></div>
        </div>
      ))}

      {/* ── Portal Dropdowns ── */}

      {/* Assignee Dropdown */}
      {showAssignee && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999]" onClick={closeAll}>
          <div
            className="fixed w-[280px] bg-[#2a2b2e] border border-[#333438] rounded-lg shadow-2xl overflow-hidden"
            style={{ top: dropdownPosRef.current.top, left: dropdownPosRef.current.left }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#333438]">
              <UserCircle className="h-4 w-4 text-[#8a8c91] shrink-0" />
              <input
                autoFocus
                value={assigneeSearch}
                onChange={e => setAssigneeSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#555]"
              />
            </div>

            <div className="flex border-b border-[#333438] text-[11px]">
              <button className="px-3 py-1.5 text-white font-semibold border-b-2 border-indigo-500">All</button>
              <button className="px-3 py-1.5 text-[#8a8c91]">People</button>
            </div>

            <div className="max-h-[220px] overflow-y-auto py-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#555]">People</div>

              {currentUser && (
                <button
                  onClick={() => handleAssigneeChange(currentUser.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white hover:bg-[#333438] transition"
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white hover:bg-[#333438] transition"
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-[#333438] transition border-t border-[#333438] mt-1"
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
            className="fixed w-[480px] bg-[#2a2b2e] border border-[#333438] rounded-lg shadow-2xl overflow-hidden"
            style={{ top: dropdownPosRef.current.top, left: dropdownPosRef.current.left }}
            onClick={e => e.stopPropagation()}
          >
            {/* Start / Due tabs */}
            <div className="flex border-b border-[#333438]">
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs text-[#8a8c91] border-b-2 border-transparent">
                <CalendarIcon className="h-3.5 w-3.5" /> Start date
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs text-white font-semibold border-b-2 border-indigo-500">
                <CalendarIcon className="h-3.5 w-3.5" /> Due date
              </button>
            </div>

            <div className="flex">
              {/* Quick options */}
              <div className="w-[200px] border-r border-[#333438] py-1">
                {quickDates.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => handleDateChange(opt.date)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-white hover:bg-[#333438] transition"
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] text-[#8a8c91]">{opt.hint}</span>
                  </button>
                ))}
                {selectedDate && (
                  <button
                    onClick={() => handleDateChange(null)}
                    className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:bg-[#333438] transition mt-1 border-t border-[#333438]"
                  >
                    <Ban className="h-3 w-3" /> Clear date
                  </button>
                )}
              </div>

              {/* Calendar */}
              <div className="flex-1 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white">
                    {new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-[#333438] rounded text-[#8a8c91] hover:text-white transition">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { const n = new Date(); setCalMonth(n.getMonth()); setCalYear(n.getFullYear()); }}
                      className="px-1.5 py-0.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Today
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-[#333438] rounded text-[#8a8c91] hover:text-white transition">
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
                          !d.currentMonth ? 'text-[#333438]' : 'text-[#e5e5e5] hover:bg-[#444]',
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
            className="fixed w-[240px] bg-[#2a2b2e] border border-[#333438] rounded-lg shadow-2xl overflow-hidden"
            style={{ top: dropdownPosRef.current.top, left: dropdownPosRef.current.left }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 py-2.5 border-b border-[#333438]">
              <input
                autoFocus
                value={prioritySearch}
                onChange={e => setPrioritySearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#1e1f21] border border-[#333438] rounded px-2 py-1.5 text-xs text-white outline-none placeholder:text-[#555] focus:border-[#555] transition"
              />
            </div>

            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#555]">Priority</div>
              {filteredPriorities.map(p => (
                <button
                  key={p.value}
                  onClick={() => handlePriorityChange(p.value)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white hover:bg-[#333438] transition"
                >
                  <span className="h-3.5 w-3.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="flex-1 text-left">{p.label}</span>
                  <span className="text-[10px] text-[#555]">{p.shortcut}</span>
                  {task.priority === p.value && <Check className="h-3.5 w-3.5 text-indigo-400 ml-1" />}
                </button>
              ))}
              <button
                onClick={() => handlePriorityChange('NORMAL')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#8a8c91] hover:bg-[#333438] hover:text-white transition"
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

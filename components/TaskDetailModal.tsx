'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Ban, Calendar, Check, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Circle, CircleDashed, Clock,
  Flag, GitFork, Hourglass, Link2, ListTodo, Loader2, MessageSquare, MoreHorizontal, Paperclip, Plus, Share2, Tag,
  Trash2, User as UserIcon, X, FileText, CornerLeftUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { apiError } from '@/lib/apiError';
import { UploadDropzone } from '@/lib/uploadthing';
import { formatMinutes, parseDuration } from '@/lib/duration';
import { pushRecent } from '@/lib/recents';
import { startOfDay } from '@/lib/dateUtils';
import { PRIORITY_OPTIONS, STATUSES } from '@/lib/taskColumns';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useTeamStore } from '@/store/teamStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Comment, Task, TimeEntry } from '@/types/task';
import SpaceIcon from './SpaceIcon';
import UserAvatar from './UserAvatar';
import { FieldRow, popoverCls, useDismiss, valueBtn } from './task/FieldRow';
import DatePopover, { type DateField } from './task/DatePopover';
import TagsField from './task/TagsField';
import AssigneePopover from './task/AssigneePopover';
import TimeEntryPopover, { type ManualTimeInput } from './task/TimeEntryPopover';
import CommentsPanel from './task/CommentsPanel';
import { TimeLogPanel, TrackTimeField } from './task/TimePanel';

const STATUS_ICON = { TODO: Circle, IN_PROGRESS: CircleDashed, DONE: CheckCircle2 } as const;
const STATUS_COLOR = { TODO: '#8a8c91', IN_PROGRESS: '#3b82f6', DONE: '#22c55e' } as const;
const NEXT_STATUS = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'DONE' } as const;

type Popup = 'status' | 'assignee' | 'priority' | 'dates' | 'estimate' | 'time' | 'menu' | null;
type Side = 'comments' | 'time';

interface Props {
  taskId: string;
  listId: string;
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

// The inner component only exists while the modal is open, so every open starts from a clean slate
export default function TaskDetailModal(props: Props) {
  if (!props.open || !props.taskId) return null;
  return <TaskDetail key={props.taskId} {...props} />;
}

const byStartDesc = (a: TimeEntry, b: TimeEntry) => Date.parse(b.startedAt) - Date.parse(a.startedAt);

function TaskDetail({ taskId, listId, onClose, isAdmin }: Props) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const createTask = useTaskStore((s) => s.createTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const listTasks = useTaskStore((s) => s.tasksByList[listId]);
  const users = useUserStore((s) => s.users);
  const me = useAuthStore((s) => s.user);
  const projects = useProjectStore((s) => s.projects);
  const teams = useTeamStore((s) => s.teams);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);

  const [viewId, setViewId] = useState(taskId); // the task shown; changes when you open a subtask / next task
  const [task, setTask] = useState<Task | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [popup, setPopup] = useState<Popup>(null);
  const [dateTab, setDateTab] = useState<'start' | 'due'>('due');
  const [side, setSide] = useState<Side>('comments');
  const [estimateDraft, setEstimateDraft] = useState('');
  const [subtasksOpen, setSubtasksOpen] = useState(true);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [timerBusy, setTimerBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // ── Load ──
  useEffect(() => {
    let cancelled = false;
    api.get<{ task: Task }>(`/tasks/${viewId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setTask(data.task);
        pushRecent({ kind: 'task', id: data.task.id, title: data.task.title, context: data.task.list?.project.name, listId: data.task.listId });
        setTitleDraft(data.task.title);
        setDescDraft(data.task.description ?? '');
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Failed to load task');
        onCloseRef.current();
      });
    return () => { cancelled = true; };
  }, [viewId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const loading = !task || task.id !== viewId;
  const isAssignee = !!me && task?.assigneeId === me.id;
  const runningMine = !!task?.timeEntries?.some((e) => !e.endedAt && e.userId === me?.id);
  const patchTask = (fn: (t: Task) => Task) => setTask((t) => (t ? fn(t) : t));

  // ── Saving ──
  /** Optimistic update; the server's copy replaces ours when it answers. */
  const save = async (patch: Partial<Task>) => {
    if (!task) return;
    const before = task;
    setTask({ ...task, ...patch });
    try {
      setTask(await updateTask(task.id, task.listId, patch));
    } catch {
      setTask(before); // the store already toasted
    }
  };

  const setStatus = (status: Task['status']) => { setPopup(null); if (task && status !== task.status) save({ status }); };
  const pickDate = (field: DateField, d: Date | null) => {
    if (!task) return;
    const other = field === 'startDate' ? task.dueDate : task.startDate;
    if (d && other) {
      const [a, b] = field === 'startDate' ? [startOfDay(d), startOfDay(new Date(other))] : [startOfDay(new Date(other)), startOfDay(d)];
      if (a > b) return toast.error('The start date cannot be after the due date');
    }
    save({ [field]: d ? d.toISOString() : null } as Partial<Task>);
  };
  const saveEstimate = () => {
    const raw = estimateDraft.trim();
    setPopup(null);
    if (!raw) return save({ estimateMinutes: null });
    const m = parseDuration(raw);
    if (!m) return toast.error('Use a format like 2h, 1h 30m or 45m');
    save({ estimateMinutes: m });
  };

  // ── Navigation ──
  const topLevel = useMemo(() => (listTasks ?? []).filter((t) => !t.parentId), [listTasks]);
  const rootId = task?.parentId ?? task?.id;
  const rootIndex = topLevel.findIndex((t) => t.id === rootId);
  const go = (delta: number) => { const t = topLevel[rootIndex + delta]; if (t) { setPopup(null); setViewId(t.id); } };
  const parentTitle = task?.parentId ? listTasks?.find((t) => t.id === task.parentId)?.title ?? 'Parent task' : null;

  const project = task?.list ? projects.find((p) => p.id === task.list!.projectId) : undefined;
  const space = project?.space;

  const assignTo = (u: { id: string; name: string; avatar: string | null } | null) => {
    setPopup(null);
    save(u ? { assigneeId: u.id, assignee: { id: u.id, name: u.name, avatar: u.avatar } } : { assigneeId: null, assignee: null });
  };

  /** Adds the person with this email to the workspace (like Invite), then assigns the task to them. */
  const inviteAndAssign = async (email: string) => {
    if (!workspaceId) return;
    try {
      const { data } = await api.post<{ user: { id: string; name: string; avatar: string | null } }>(`/workspaces/${workspaceId}/members`, { email });
      await useUserStore.getState().fetchUsers(workspaceId);
      toast.success(`${data.user.name} was added to the workspace`);
      assignTo(data.user);
    } catch (err) {
      toast.error(apiError(err, 'Could not add that person'));
    }
  };

  const copyLink = async () => {
    setPopup(null);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/tasks/${viewId}`);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  // ── Subtasks ──
  const subtasks = task?.subtasks ?? [];
  const doneSubtasks = subtasks.filter((s) => s.status === 'DONE').length;

  const toggleSubtask = async (st: Task) => {
    const status = st.status === 'DONE' ? 'TODO' : 'DONE';
    patchTask((t) => ({ ...t, subtasks: t.subtasks?.map((s) => (s.id === st.id ? { ...s, status } : s)) }));
    try {
      await updateTask(st.id, listId, { status });
    } catch {
      patchTask((t) => ({ ...t, subtasks: t.subtasks?.map((s) => (s.id === st.id ? { ...s, status: st.status } : s)) }));
    }
  };

  const addSubtask = async () => {
    const name = newSubtask.trim();
    if (!name || addingSubtask || !task) return;
    setAddingSubtask(true);
    try {
      const created = await createTask(listId, { title: name, parentId: task.id });
      patchTask((t) => ({ ...t, subtasks: [...(t.subtasks ?? []), created] }));
      setNewSubtask('');
    } catch { /* the store already toasted */ } finally {
      setAddingSubtask(false);
    }
  };

  const askDeleteSubtask = (st: Task) =>
    setConfirm({
      title: 'Delete subtask',
      message: `Delete "${st.title}"? This can't be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        patchTask((t) => ({ ...t, subtasks: t.subtasks?.filter((s) => s.id !== st.id) }));
        try { await deleteTask(st.id, listId); } catch { patchTask((t) => ({ ...t, subtasks: [...(t.subtasks ?? []), st] })); }
      },
    });

  const askDeleteTask = () => {
    setPopup(null);
    if (!task) return;
    setConfirm({
      title: 'Delete task',
      message: 'Delete this task along with its subtasks, comments and tracked time? This can\'t be undone.',
      onConfirm: async () => {
        setConfirm(null);
        try { await deleteTask(task.id, listId); onClose(); } catch { /* toasted */ }
      },
    });
  };

  // ── Comments ──
  const refreshComments = async () => {
    if (!task) return;
    const { data } = await api.get<{ task: Task }>(`/tasks/${task.id}`);
    patchTask((t) => ({ ...t, comments: data.task.comments }));
    useTaskStore.getState().fetchTasks(listId); // keep the comment counts in the list/board fresh
  };

  const addComment = async (text: string) => {
    if (!task) return;
    try {
      await api.post(`/tasks/${task.id}/comments`, { text });
      await refreshComments();
    } catch (err) {
      toast.error(apiError(err, 'Failed to add comment'));
      throw err;
    }
  };
  const editComment = async (id: string, text: string) => {
    try {
      await api.patch(`/tasks/comments/${id}`, { text });
      patchTask((t) => ({ ...t, comments: t.comments?.map((c: Comment) => (c.id === id ? { ...c, text } : c)) }));
    } catch (err) {
      toast.error(apiError(err, 'Failed to update comment'));
      throw err;
    }
  };
  const askDeleteComment = (id: string) =>
    setConfirm({
      title: 'Delete comment',
      message: 'Delete this comment? This can\'t be undone.',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.delete(`/tasks/comments/${id}`);
          patchTask((t) => ({ ...t, comments: t.comments?.filter((c) => c.id !== id) }));
          useTaskStore.getState().fetchTasks(listId);
        } catch (err) {
          toast.error(apiError(err, 'Failed to delete comment'));
        }
      },
    });

  // ── Time tracking ──
  const entries = useMemo(() => [...(task?.timeEntries ?? [])].sort(byStartDesc), [task?.timeEntries]);

  const withTimer = async (fn: () => Promise<void>, fallback: string) => {
    setTimerBusy(true);
    try { await fn(); } catch (err) { toast.error(apiError(err, fallback)); } finally { setTimerBusy(false); }
  };

  const startTimer = () =>
    task && withTimer(async () => {
      const { data } = await api.post<{ entry: TimeEntry }>(`/tasks/${task.id}/time/start`);
      // starting a timer stops this user's other running one — mirror that for this task's entries
      patchTask((t) => ({
        ...t,
        timeEntries: [data.entry, ...(t.timeEntries ?? []).map((e) => (!e.endedAt && e.userId === me?.id ? { ...e, endedAt: data.entry.startedAt } : e))],
      }));
    }, 'Failed to start the timer');

  const stopTimer = () =>
    task && withTimer(async () => {
      const { data } = await api.post<{ entry: TimeEntry }>(`/tasks/${task.id}/time/stop`);
      patchTask((t) => ({ ...t, timeEntries: t.timeEntries?.map((e) => (e.id === data.entry.id ? data.entry : e)) }));
    }, 'Failed to stop the timer');

  const addTime = async (input: ManualTimeInput) => {
    if (!task) return;
    // Work out the exact start/end HERE, in the user's own timezone. Sending only a "YYYY-MM-DD" made the
    // server read it as UTC midnight, which for anyone ahead of UTC looked like the future and was rejected.
    let payload: ManualTimeInput = input;
    if (input.minutes && !input.startedAt) {
      const day = input.date ? new Date(`${input.date}T12:00:00`) : new Date(); // local midday of the chosen day
      const end = day.toDateString() === new Date().toDateString() ? new Date() : day;
      payload = {
        startedAt: new Date(end.getTime() - input.minutes * 60_000).toISOString(),
        endedAt: end.toISOString(),
        note: input.note,
      };
    }
    try {
      const { data } = await api.post<{ entry: TimeEntry }>(`/tasks/${task.id}/time`, payload);
      patchTask((t) => ({ ...t, timeEntries: [data.entry, ...(t.timeEntries ?? [])] }));
      toast.success('Time added');
    } catch (err) {
      toast.error(apiError(err, 'Failed to add time'));
      throw err;
    }
  };

  const deleteTime = async (entry: TimeEntry) => {
    patchTask((t) => ({ ...t, timeEntries: t.timeEntries?.filter((e) => e.id !== entry.id) }));
    try {
      await api.delete(`/tasks/time/${entry.id}`);
    } catch (err) {
      patchTask((t) => ({ ...t, timeEntries: [entry, ...(t.timeEntries ?? [])] }));
      toast.error(apiError(err, 'Failed to delete time entry'));
    }
  };

  // ── Attachments ──
  const attachments = task?.attachments ?? [];
  const saveAttachments = (urls: string[]) => save({ attachments: urls });

  // ── Popover wiring ──
  const statusRef = useDismiss<HTMLDivElement>(popup === 'status', () => setPopup(null));
  const priorityRef = useDismiss<HTMLDivElement>(popup === 'priority', () => setPopup(null));
  const estimateRef = useDismiss<HTMLDivElement>(popup === 'estimate', () => setPopup(null));
  const menuRef = useDismiss<HTMLDivElement>(popup === 'menu', () => setPopup(null));
  // Start and Due share one picker: the other button switches tabs, the same button closes it
  const openDates = (tab: 'start' | 'due') => {
    if (popup === 'dates' && dateTab !== tab) return setDateTab(tab);
    setDateTab(tab);
    setPopup(popup === 'dates' ? null : 'dates');
  };
  const toggle = (p: Exclude<Popup, null>) => setPopup((cur) => (cur === p ? null : p));

  const status = task?.status ?? 'TODO';
  const StatusIcon = STATUS_ICON[status];
  const priority = PRIORITY_OPTIONS.find((p) => p.value === task?.priority);
  const assignee = users.find((u) => u.id === task?.assigneeId) ?? (task?.assignee ? { ...task.assignee, email: '' } : undefined);
  const start = task?.startDate ?? null;
  const due = task?.dueDate ?? null;
  const overdue = !!due && status !== 'DONE' && startOfDay(new Date(due)) < startOfDay(new Date());
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const createdLabel = task ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[4vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex h-[90vh] w-[96vw] max-w-[1240px] flex-col overflow-hidden rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* ── Top bar ── */}
        <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[color:var(--c-333438)] px-3">
          <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-[color:var(--c-8a8c91)]">
            <button onClick={() => go(-1)} disabled={rootIndex <= 0} aria-label="Previous task" title="Previous task" className="rounded p-1 hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)] disabled:opacity-30">
              <ChevronUp className="h-4 w-4" />
            </button>
            <button onClick={() => go(1)} disabled={rootIndex < 0 || rootIndex >= topLevel.length - 1} aria-label="Next task" title="Next task" className="rounded p-1 hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)] disabled:opacity-30">
              <ChevronDown className="h-4 w-4" />
            </button>
            <span className="mx-1 h-4 w-px bg-[color:var(--c-333438)]" />
            {space && (
              <>
                <span className="flex shrink-0 items-center gap-1.5">
                  <SpaceIcon name={space.name} icon={space.icon} color={space.color} size={16} className="rounded-md" /> {space.name}
                </span>
                <span>/</span>
              </>
            )}
            <span className="flex min-w-0 items-center gap-1.5 font-semibold text-[color:var(--c-white)]">
              <ListTodo className="h-4 w-4 shrink-0" /> <span className="truncate">{task?.list?.project.name ?? ''}</span>
            </span>
            {task?.list && <span className="hidden truncate sm:inline">/ {task.list.name}</span>}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button onClick={copyLink} className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]">
              <Share2 className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" /> Share
            </button>
            <div className="relative" ref={menuRef}>
              <button data-popover-trigger onClick={() => toggle('menu')} aria-label="More actions" className="rounded-md p-1.5 text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)]">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {popup === 'menu' && (
                <div className={`${popoverCls} left-auto right-0 w-48 p-1`}>
                  <button onClick={copyLink} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)]">
                    <Link2 className="h-3.5 w-3.5" /> Copy link
                  </button>
                  {isAdmin && (
                    <button onClick={askDeleteTask} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-red-400 hover:bg-[color:var(--c-333438)]">
                      <Trash2 className="h-3.5 w-3.5" /> Delete task
                    </button>
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading || !task ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            {/* ───────── Left: the task ───────── */}
            <div className="min-w-0 flex-1 overflow-y-auto">
              <div className="mx-auto max-w-[780px] space-y-6 px-8 py-6">
                <div>
                  {parentTitle && (
                    <button onClick={() => setViewId(task.parentId!)} className="mb-2 flex items-center gap-1.5 text-[12.5px] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">
                      <CornerLeftUp className="h-3.5 w-3.5" /> {parentTitle}
                    </button>
                  )}
                  <div className="mb-3 flex items-center gap-2 text-[12.5px]">
                    <span className="flex items-center gap-1.5 rounded-md border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] px-2 py-1 font-medium text-[color:var(--c-white)]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> {task.parentId ? 'Subtask' : 'Task'}
                    </span>
                    {subtasks.length > 0 && (
                      <span className="flex items-center gap-1 rounded-md border border-[color:var(--c-333438)] px-2 py-1 text-[color:var(--c-8a8c91)]" title={`${subtasks.length} subtask${subtasks.length === 1 ? '' : 's'}`}>
                        <GitFork className="h-3.5 w-3.5" /> {subtasks.length}
                      </span>
                    )}
                  </div>

                  {isAdmin ? (
                    <input
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => {
                        const t = titleDraft.trim();
                        if (!t) return setTitleDraft(task.title);
                        if (t !== task.title) save({ title: t });
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      placeholder="Task name"
                      className="w-full rounded-md bg-transparent px-1 py-0.5 -mx-1 text-[30px] font-bold leading-tight text-[color:var(--c-white)] outline-none hover:bg-[color:var(--c-232426)] focus:bg-[color:var(--c-232426)]"
                    />
                  ) : (
                    <h2 className="text-[30px] font-bold leading-tight text-[color:var(--c-white)]">{task.title}</h2>
                  )}
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 gap-x-10 gap-y-1 md:grid-cols-2">
                  <div className="space-y-1">
                    <FieldRow icon={CircleDashed} label="Status">
                      <div className="flex items-center gap-1" ref={statusRef}>
                        <div className="relative">
                          <button
                            data-popover-trigger
                            onClick={() => toggle('status')}
                            className="flex items-center gap-1.5 rounded-l-md border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] px-2.5 py-1 text-[12px] font-bold text-[color:var(--c-white)] transition hover:border-[color:var(--c-555660)]"
                          >
                            <StatusIcon className="h-3.5 w-3.5" style={{ color: STATUS_COLOR[status] }} />
                            {STATUSES.find((s) => s.value === status)?.label}
                          </button>
                          {popup === 'status' && (
                            <div className={`${popoverCls} w-48 py-1`}>
                              {STATUSES.map((s) => {
                                const Icon = STATUS_ICON[s.value];
                                return (
                                  <button key={s.value} onClick={() => setStatus(s.value)} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)]">
                                    <Icon className="h-3.5 w-3.5" style={{ color: s.color }} /> {s.label}
                                    {s.value === status && <Check className="ml-auto h-3 w-3 text-indigo-400" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {status !== 'DONE' && (
                          <button onClick={() => setStatus(NEXT_STATUS[status])} aria-label="Move to the next status" title="Next status" className="-ml-1 rounded-r-md border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] px-1.5 py-1 text-[color:var(--c-8a8c91)] transition hover:text-[color:var(--c-white)]">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setStatus(status === 'DONE' ? 'TODO' : 'DONE')}
                          aria-label={status === 'DONE' ? 'Reopen' : 'Mark complete'}
                          title={status === 'DONE' ? 'Reopen' : 'Mark complete'}
                          className={`ml-1 rounded-md border px-1.5 py-1 transition ${status === 'DONE' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] text-[color:var(--c-8a8c91)] hover:text-emerald-400'}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </FieldRow>

                    <FieldRow icon={Calendar} label="Dates">
                      <div className="relative flex items-center gap-1">
                        <button
                          data-popover-trigger
                          disabled={!isAdmin}
                          onClick={() => openDates('start')}
                          className={`${valueBtn} ${start ? '!text-[color:var(--c-white)]' : ''} disabled:cursor-default`}
                        >
                          <Calendar className="h-3.5 w-3.5" /> {start ? fmtDate(start) : 'Start'}
                        </button>
                        <span className="text-[color:var(--c-8a8c91)]">→</span>
                        <button
                          data-popover-trigger
                          disabled={!isAdmin}
                          onClick={() => openDates('due')}
                          className={`${valueBtn} ${due ? (overdue ? '!text-red-400' : '!text-[color:var(--c-white)]') : ''} disabled:cursor-default`}
                        >
                          <Calendar className="h-3.5 w-3.5" /> {due ? fmtDate(due) : 'Due'}
                        </button>
                        {popup === 'dates' && isAdmin && (
                          <DatePopover key={dateTab} start={start} due={due} initialTab={dateTab} onPick={pickDate} onClose={() => setPopup(null)} />
                        )}
                      </div>
                    </FieldRow>

                    <FieldRow icon={Clock} label="Track time">
                      <div className="relative">
                        <TrackTimeField entries={entries} myId={me?.id} estimateMinutes={task.estimateMinutes} busy={timerBusy} canTimer={isAssignee} canLog={isAdmin} popupOpen={popup === 'time'} onStartTimer={() => { void startTimer(); }} onOpen={() => toggle('time')} onStop={() => { void stopTimer(); }} />
                        {popup === 'time' && me && isAdmin && (
                          <TimeEntryPopover
                            entries={entries}
                            me={me}
                            estimateMinutes={task.estimateMinutes}
                            busy={timerBusy}
                            canTimer={isAssignee && !runningMine}
                            onStart={async () => { await startTimer(); }}
                            onAdd={addTime}
                            onClose={() => setPopup(null)}
                          />
                        )}
                      </div>
                    </FieldRow>

                    <FieldRow icon={Hourglass} label="Time estimate">
                      <div className="relative" ref={estimateRef}>
                        <button
                          data-popover-trigger
                          disabled={!isAdmin}
                          onClick={() => { setEstimateDraft(task.estimateMinutes ? formatMinutes(task.estimateMinutes) : ''); toggle('estimate'); }}
                          className={`${valueBtn} ${task.estimateMinutes ? '!text-[color:var(--c-white)]' : ''} disabled:cursor-default`}
                        >
                          {task.estimateMinutes ? formatMinutes(task.estimateMinutes) : 'Empty'}
                        </button>
                        {popup === 'estimate' && (
                          <div className={`${popoverCls} w-56 p-2`}>
                            <input
                              autoFocus
                              value={estimateDraft}
                              onChange={(e) => setEstimateDraft(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEstimate()}
                              placeholder="e.g. 2h, 1h 30m, 45m"
                              className="w-full rounded-md border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] px-2 py-1.5 text-[13px] text-[color:var(--c-white)] outline-none focus:border-indigo-500"
                            />
                            <div className="mt-2 flex justify-end gap-1.5">
                              {task.estimateMinutes ? (
                                <button onClick={() => { setPopup(null); save({ estimateMinutes: null }); }} className="px-2 py-1 text-[12px] text-red-400 hover:text-red-300">Clear</button>
                              ) : null}
                              <button onClick={saveEstimate} className="rounded bg-indigo-600 px-3 py-1 text-[12px] font-semibold text-white hover:bg-indigo-500">Save</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </FieldRow>
                  </div>

                  <div className="space-y-1">
                    <FieldRow icon={UserIcon} label="Assignees">
                      <div className="relative">
                        <button data-popover-trigger disabled={!isAdmin} onClick={() => toggle('assignee')} className={`${valueBtn} disabled:cursor-default`}>
                          {assignee ? (
                            <span className="flex items-center gap-2 text-[color:var(--c-white)]">
                              <UserAvatar name={assignee.name} src={assignee.avatar} size={20} /> {assignee.name}
                            </span>
                          ) : (
                            'Empty'
                          )}
                        </button>
                        {popup === 'assignee' && isAdmin && (
                          <AssigneePopover
                            users={users}
                            teams={teams}
                            me={me}
                            assigneeId={task.assigneeId}
                            onPick={assignTo}
                            onInviteEmail={inviteAndAssign}
                            onClose={() => setPopup(null)}
                          />
                        )}
                      </div>
                    </FieldRow>

                    <FieldRow icon={Flag} label="Priority">
                      <div className="relative" ref={priorityRef}>
                        <button data-popover-trigger disabled={!isAdmin} onClick={() => toggle('priority')} className={`${valueBtn} disabled:cursor-default`} style={priority && task.priority !== 'NORMAL' ? { color: priority.color } : undefined}>
                          <Flag className="h-3.5 w-3.5" fill={priority && task.priority !== 'NORMAL' ? priority.color : 'none'} />
                          {task.priority === 'NORMAL' ? 'Empty' : priority?.label}
                        </button>
                        {popup === 'priority' && (
                          <div className={`${popoverCls} w-44 py-1`}>
                            {PRIORITY_OPTIONS.map((p) => (
                              <button key={p.value} onClick={() => { setPopup(null); save({ priority: p.value }); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-[color:var(--c-333438)]" style={{ color: p.color }}>
                                <Flag className="h-3.5 w-3.5" fill={p.color} /> {p.label}
                                {p.value === task.priority && <Check className="ml-auto h-3 w-3 text-indigo-400" />}
                              </button>
                            ))}
                            <button onClick={() => { setPopup(null); save({ priority: 'NORMAL' }); }} className="flex w-full items-center gap-2 border-t border-[color:var(--c-333438)] px-3 py-1.5 text-xs text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-333438)] hover:text-[color:var(--c-white)]">
                              <Ban className="h-3.5 w-3.5" /> Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </FieldRow>

                    <FieldRow icon={Tag} label="Tags">
                      <TagsField tags={task.tags ?? []} editable={isAdmin} onChange={(tags) => save({ tags })} />
                    </FieldRow>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t border-[color:var(--c-333438)] pt-5">
                  {isAdmin ? (
                    <textarea
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      onBlur={() => {
                        const d = descDraft.trim();
                        if (d !== (task.description ?? '')) save({ description: d || null });
                      }}
                      placeholder="Add description"
                      rows={4}
                      className="w-full resize-y rounded-lg border border-transparent bg-transparent p-2 -m-2 text-[14px] leading-relaxed text-[color:var(--c-e5e5e5)] outline-none transition placeholder:text-[color:var(--c-8a8c91)] hover:border-[color:var(--c-333438)] focus:border-indigo-500"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[color:var(--c-e5e5e5)]">
                      {task.description || <span className="italic text-[color:var(--c-8a8c91)]">No description</span>}
                    </p>
                  )}
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <button onClick={() => setShowAttachments((v) => !v)} className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--c-8a8c91)] transition hover:text-[color:var(--c-white)]">
                    {showAttachments ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <Paperclip className="h-3.5 w-3.5" /> Attachments{attachments.length > 0 && ` (${attachments.length})`}
                  </button>
                  {showAttachments && (
                    <div className="space-y-2 pl-5">
                      {attachments.map((url) => (
                        <div key={url} className="group flex items-center justify-between rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] p-2">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-2 text-xs text-[color:var(--c-e5e5e5)] hover:text-indigo-400">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-[color:var(--c-8a8c91)]" />
                            <span className="truncate">{url.split('/').pop()?.split('-').pop() || 'File'}</span>
                          </a>
                          {isAdmin && (
                            <button onClick={() => saveAttachments(attachments.filter((u) => u !== url))} aria-label="Remove file" className="p-1 text-[color:var(--c-8a8c91)] opacity-0 transition hover:text-red-400 group-hover:opacity-100">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {isAdmin && (
                        <div className="rounded-lg border border-dashed border-[color:var(--c-333438)] bg-[color:var(--c-232426)]/50">
                          <UploadDropzone
                            endpoint="taskAttachment"
                            onClientUploadComplete={(res) => {
                              if (res) {
                                saveAttachments([...attachments, ...res.map((r) => r.ufsUrl)]);
                                toast.success(`${res.length} file(s) attached`);
                              }
                            }}
                            onUploadError={(error) => { toast.error(`Upload failed: ${error.message}`); }}
                            appearance={{
                              container: 'border-0 bg-transparent p-2',
                              button: 'bg-indigo-600 text-white text-xs h-7 px-3 rounded after:bg-indigo-700 ut-uploading:bg-indigo-700/50',
                              label: 'text-xs text-[color:var(--c-8a8c91)] hover:text-indigo-400',
                              allowedContent: 'text-[10px] text-[#666] mt-1',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subtasks (a subtask doesn't have its own subtasks) */}
                {!task.parentId && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSubtasksOpen((v) => !v)} className="flex items-center gap-2 text-[14px] font-bold text-[color:var(--c-white)]">
                        {subtasksOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Subtasks
                        {subtasks.length > 0 && (
                          <span className="text-[12.5px] font-normal text-[color:var(--c-8a8c91)]">{subtasks.length - doneSubtasks} open</span>
                        )}
                      </button>
                      {subtasks.length > 0 && (
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[color:var(--c-333438)]" title={`${doneSubtasks} of ${subtasks.length} complete`}>
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(doneSubtasks / subtasks.length) * 100}%` }} />
                        </div>
                      )}
                    </div>

                    {subtasksOpen && (
                      <div>
                        {subtasks.length > 0 && (
                          <div className="grid grid-cols-[1fr_90px_90px_28px] gap-2 border-b border-[color:var(--c-333438)] px-2 py-1.5 text-[12px] text-[color:var(--c-8a8c91)]">
                            <span>Name</span><span>Assignee</span><span>Priority</span><span />
                          </div>
                        )}
                        {subtasks.map((st) => {
                          const SI = STATUS_ICON[st.status];
                          const sp = PRIORITY_OPTIONS.find((p) => p.value === st.priority);
                          return (
                            <div key={st.id} className="group grid grid-cols-[1fr_90px_90px_28px] items-center gap-2 border-b border-[color:var(--c-2a2b2e)] px-2 py-2 text-[13px] transition hover:bg-[color:var(--c-232426)]">
                              <span className="flex min-w-0 items-center gap-2">
                                <button onClick={() => toggleSubtask(st)} aria-label={st.status === 'DONE' ? 'Mark as to do' : 'Mark complete'} className="shrink-0 transition hover:scale-110">
                                  <SI className="h-4 w-4" style={{ color: STATUS_COLOR[st.status] }} />
                                </button>
                                <button onClick={() => setViewId(st.id)} className={`truncate text-left hover:underline ${st.status === 'DONE' ? 'text-[color:var(--c-8a8c91)] line-through' : 'text-[color:var(--c-e5e5e5)]'}`}>
                                  {st.title}
                                </button>
                              </span>
                              <span>{st.assignee ? <span title={st.assignee.name}><UserAvatar name={st.assignee.name} src={st.assignee.avatar} size={22} /></span> : <span className="text-[color:var(--c-8a8c91)]">–</span>}</span>
                              <span className="flex items-center gap-1.5 text-[12px] capitalize text-[color:var(--c-8a8c91)]">
                                {st.priority !== 'NORMAL' && sp ? (<><Flag className="h-3.5 w-3.5" style={{ color: sp.color }} fill={sp.color} />{st.priority.toLowerCase()}</>) : '–'}
                              </span>
                              {isAdmin ? (
                                <button onClick={() => askDeleteSubtask(st)} aria-label="Delete subtask" className="rounded p-1 text-[color:var(--c-8a8c91)] opacity-0 transition hover:text-red-400 group-hover:opacity-100">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              ) : <span />}
                            </div>
                          );
                        })}
                        {isAdmin && (
                          <div className="flex items-center gap-2 px-2 py-2">
                            <Plus className="h-4 w-4 text-[color:var(--c-8a8c91)]" />
                            <input
                              value={newSubtask}
                              disabled={addingSubtask}
                              onChange={(e) => setNewSubtask(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                              placeholder="Add Task"
                              className="flex-1 bg-transparent text-[13px] text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
                            />
                            {addingSubtask && <Loader2 className="h-3.5 w-3.5 animate-spin text-[color:var(--c-8a8c91)]" />}
                          </div>
                        )}
                        {subtasks.length === 0 && !isAdmin && <p className="px-2 py-2 text-[13px] text-[color:var(--c-8a8c91)]">No subtasks</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ───────── Rail ───────── */}
            <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-l border-[color:var(--c-333438)] py-3">
              <button onClick={() => setSide('comments')} aria-label="Comments" title="Comments" aria-pressed={side === 'comments'} className={`relative rounded-md p-2 transition ${side === 'comments' ? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)]' : 'text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'}`}>
                <MessageSquare className="h-4 w-4" />
                {(task.comments?.length ?? 0) > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-3.5 rounded-full bg-indigo-600 px-1 text-center text-[9px] font-semibold leading-3.5 text-white">{task.comments!.length}</span>
                )}
              </button>
              <button onClick={() => setSide('time')} aria-label="Time tracked" title="Time tracked" aria-pressed={side === 'time'} className={`rounded-md p-2 transition ${side === 'time' ? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)]' : 'text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'}`}>
                <Clock className="h-4 w-4" />
              </button>
            </div>

            {/* ───────── Right: comments / time ───────── */}
            <div className="flex w-[380px] shrink-0 flex-col border-l border-[color:var(--c-333438)] bg-[color:var(--c-232426)]">
              {side === 'comments' ? (
                <CommentsPanel
                  comments={task.comments ?? []}
                  createdLabel={createdLabel}
                  me={me}
                  users={users}
                  canAssign={isAdmin && !task.assigneeId && !!me}
                  onAssignMe={() => me && save({ assigneeId: me.id, assignee: { id: me.id, name: me.name, avatar: me.avatar ?? null } })}
                  onAdd={addComment}
                  onEdit={editComment}
                  onDelete={askDeleteComment}
                />
              ) : (
                <TimeLogPanel entries={entries} myId={me?.id} isAdmin={isAdmin} estimateMinutes={task.estimateMinutes} onAdd={addTime} onDelete={deleteTime} />
              )}
            </div>
          </div>
        )}

        {/* Confirmation */}
        {confirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center" onClick={() => setConfirm(null)}>
            <div className="absolute inset-0 bg-black/50" />
            <div onClick={(e) => e.stopPropagation()} className="relative z-10 w-[380px] space-y-4 rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] p-5 shadow-2xl">
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-[color:var(--c-white)]">{confirm.title}</h3>
                <p className="text-xs leading-relaxed text-[color:var(--c-8a8c91)]">{confirm.message}</p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setConfirm(null)} className="rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] px-3 py-1.5 text-xs font-medium text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">Cancel</button>
                <button onClick={confirm.onConfirm} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

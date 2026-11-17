'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Bell, Calendar, Check, ChevronDown, FileText, Loader2, Paperclip, Repeat, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCreateModal, type CreateTab } from '@/store/createModalStore';
import { useReminderStore } from '@/store/reminderStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUploadThing } from '@/lib/uploadthing';
import TaskFields, { emptyDraft, pushRecent, readRecents, type TaskDraft } from './create/TaskFields';
import DateTimePicker from './DateTimePicker';
import {
  NOTIFY_OPTIONS,
  dayLabel,
  formatTime,
  notifyLabel,
  recurrenceLabel,
  type Recurrence,
} from '@/lib/reminders';

const TABS: { id: CreateTab; label: string }[] = [
  { id: 'task', label: 'Task' },
  { id: 'doc', label: 'Doc' },
  { id: 'reminder', label: 'Reminder' },
];

const PLACEHOLDER: Record<CreateTab, string> = {
  task: "Task name or type '/' for commands",
  doc: "Doc name or type '/' for commands",
  reminder: "Reminder name or type '/' for commands",
};

const NOTES_KEY = 'notepad:notes';

const chipCls =
  'flex items-center gap-1.5 rounded-md border border-(--c-333438) px-2 py-1 text-[12px] font-medium text-(--c-e5e5e5) transition hover:bg-(--c-2a2b2e)';

function defaultDue() {
  const d = new Date(Date.now() + 20 * 60000);
  d.setSeconds(0, 0);
  return d;
}

/** Small dropdown used for chips (notify-before, list selection) */
function ChipMenu<T extends string | number>({
  trigger,
  options,
  selected,
  onSelect,
}: {
  trigger: React.ReactNode;
  options: { value: T; label: string; group?: string }[];
  selected?: T | null;
  onSelect: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={chipCls}>
        {trigger}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[300] mt-1 max-h-60 min-w-[190px] overflow-y-auto rounded-lg border border-(--c-333438) bg-(--c-1e1f21) p-1 shadow-2xl custom-scrollbar">
          {options.length === 0 && <p className="px-2.5 py-2 text-[12px] text-(--c-8a8c91)">Nothing to select</p>}
          {options.map((o, i) => {
            const header = o.group && o.group !== options[i - 1]?.group ? o.group : null;
            return (
              <div key={String(o.value)}>
                {header && (
                  <p className="px-2.5 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-(--c-8a8c91)">
                    {header}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onSelect(o.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-(--c-white) hover:bg-(--c-2a2b2e)"
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  {selected === o.value && <Check className="h-3.5 w-3.5 text-violet-400" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CreateModal() {
  const open = useCreateModal((s) => s.open);
  // Mount the form only while open so its state starts fresh each time
  return open ? <CreateModalForm /> : null;
}

function CreateModalForm() {
  const router = useRouter();
  const { tab, setTab, close } = useCreateModal();
  const user = useAuthStore((s) => s.user);
  const addReminder = useReminderStore((s) => s.addReminder);
  const projects = useProjectStore((s) => s.projects);
  const listsByProject = useProjectStore((s) => s.listsByProject);
  const fetchProjectLists = useProjectStore((s) => s.fetchProjectLists);
  const createTask = useTaskStore((s) => s.createTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const users = useUserStore((s) => s.users);
  const fetchUsers = useUserStore((s) => s.fetchUsers);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDesc, setShowDesc] = useState(false);
  const [due, setDue] = useState<Date>(defaultDue);
  const [dueTouched, setDueTouched] = useState(false);
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [notifyBefore, setNotifyBefore] = useState(10);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(() => emptyDraft(null));
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const reminderDateRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  const { startUpload, isUploading } = useUploadThing('taskAttachment', {
    onUploadError: (e) => {
      toast.error(`Upload failed: ${e.message}`);
    },
  });

  // Focus title when opening / switching tabs
  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [tab]);

  // Load project lists + workspace members for the Task tab
  useEffect(() => {
    if (tab !== 'task') return;
    projects.forEach((p) => {
      if (!listsByProject[p.id]) fetchProjectLists(p.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, projects]);

  useEffect(() => {
    if (activeWorkspaceId && users.length === 0) fetchUsers(activeWorkspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  // Escape closes (dropdowns/pickers handle their own Escape first)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => {
    if (!createMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) setCreateMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [createMenuOpen]);

  // Lists across all projects; default = most recently used, else first
  const allLists = useMemo(
    () => projects.flatMap((p) => (listsByProject[p.id] ?? []).map((l) => ({ id: l.id, projectId: p.id }))),
    [projects, listsByProject],
  );
  const effectiveListId =
    (draft.listId && allLists.some((l) => l.id === draft.listId) ? draft.listId : null) ??
    readRecents().find((id) => allLists.some((l) => l.id === id)) ??
    allLists[0]?.id ??
    null;
  const taskDraft: TaskDraft = { ...draft, listId: effectiveListId };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const res = await startUpload(Array.from(files));
    if (res?.length) {
      setDraft((d) => ({
        ...d,
        attachments: [...d.attachments, ...res.map((r) => ({ url: r.ufsUrl, name: r.name }))],
      }));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleCreate = async (mode: 'close' | 'another' | 'open' = 'close') => {
    const name = title.trim();
    if (!name) {
      toast.error(tab === 'reminder' ? 'Reminder name is required' : tab === 'doc' ? 'Doc name is required' : 'Task name is required');
      titleRef.current?.focus();
      return;
    }

    if (tab === 'reminder') {
      addReminder({
        title: name,
        description: description.trim(),
        dueAt: due.toISOString(),
        notifyBefore,
        recurrence,
      });
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      toast.success(`Reminder set for ${dayLabel(due)}, ${formatTime(due)}`);
      close();
      return;
    }

    if (tab === 'doc') {
      try {
        const raw = localStorage.getItem(NOTES_KEY);
        const notes = raw ? JSON.parse(raw) : [];
        const note = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: name,
          content: description,
          updatedAt: Date.now(),
        };
        localStorage.setItem(NOTES_KEY, JSON.stringify([note, ...(Array.isArray(notes) ? notes : [])]));
        toast.success('Doc saved to Notepad');
        close();
      } catch {
        toast.error('Could not save doc');
      }
      return;
    }

    // ── task: created inside the selected list ──
    if (!effectiveListId) {
      toast.error('Select a list first (create a project and a list if you have none)');
      return;
    }
    if (isUploading) {
      toast.info('Wait for uploads to finish');
      return;
    }
    setSaving(true);
    try {
      const task = await createTask(effectiveListId, {
        title: name,
        description: description.trim() || undefined,
        status: draft.status,
        priority: draft.priority ?? undefined,
        assigneeId: draft.assigneeId || undefined,
        dueDate: draft.dueDate ? draft.dueDate.toISOString() : undefined,
      });
      if (draft.attachments.length) {
        try {
          await updateTask(task.id, effectiveListId, { attachments: draft.attachments.map((a) => a.url) });
        } catch {
          toast.error('Task created, but attachments could not be saved');
        }
      }
      pushRecent(effectiveListId);

      if (mode === 'another') {
        setTitle('');
        setDescription('');
        setDraft(emptyDraft(effectiveListId));
        setSaving(false);
        setTimeout(() => titleRef.current?.focus(), 30);
      } else {
        if (mode === 'open') {
          const projectId = allLists.find((l) => l.id === effectiveListId)?.projectId;
          if (projectId) router.push(`/projects/${projectId}`);
        }
        close();
      }
    } catch {
      setSaving(false); // store already toasted the error
    }
  };

  const cta = tab === 'reminder' ? 'Create Reminder' : tab === 'doc' ? 'Create Doc' : 'Create Task';

  const node = (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center bg-black/50 px-4 pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-label="Create"
        className="w-full max-w-[640px] rounded-xl border border-(--c-333438) bg-(--c-1e1f21) text-(--c-e5e5e5) shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-(--c-333438) px-6">
          <div className="flex items-center gap-6">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 py-3.5 text-[14px] font-medium transition ${
                  tab === t.id
                    ? 'border-(--c-white) text-(--c-white)'
                    : 'border-transparent text-(--c-8a8c91) hover:text-(--c-white)'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-(--c-2a2b2e) text-(--c-e5e5e5) transition hover:bg-(--c-333438)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        {tab === 'task' ? (
          <TaskFields
            draft={taskDraft}
            setDraft={setDraft}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            titleRef={titleRef}
            onSubmit={() => handleCreate('close')}
            uploading={isUploading}
          />
        ) : (
          <div className="px-6 pt-5 pb-5">
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder={PLACEHOLDER[tab]}
              className="w-full bg-transparent text-[18px] font-medium text-(--c-white) outline-none placeholder:text-(--c-8a8c91)"
            />

            {showDesc ? (
              <textarea
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add description"
                className="mt-3 w-full resize-none bg-transparent text-[14px] text-(--c-e5e5e5) outline-none placeholder:text-(--c-8a8c91)"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowDesc(true)}
                className="mt-3 flex items-center gap-2 text-[14px] text-(--c-8a8c91) transition hover:text-(--c-white)"
              >
                <FileText className="h-4 w-4" /> Add description
              </button>
            )}

            {tab === 'reminder' && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  ref={reminderDateRef}
                  type="button"
                  onClick={() => setPickerOpen((o) => !o)}
                  className={chipCls}
                >
                  <Calendar className="h-3.5 w-3.5 text-(--c-8a8c91)" />
                  {dayLabel(due)}
                  {dueTouched && `, ${formatTime(due)}`}
                  {recurrence !== 'none' && (
                    <span className="flex items-center gap-1 text-violet-400">
                      <Repeat className="h-3 w-3" /> {recurrenceLabel(recurrence)}
                    </span>
                  )}
                </button>

                <div className={`${chipCls} cursor-default`}>
                  {user?.avatar ? (
                    <Image
                      src={user.avatar}
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">
                      {user?.name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  )}
                  For me
                </div>

                <ChipMenu
                  trigger={
                    <>
                      <Bell className="h-3.5 w-3.5 text-(--c-8a8c91)" /> {notifyLabel(notifyBefore)}
                    </>
                  }
                  options={NOTIFY_OPTIONS}
                  selected={notifyBefore}
                  onSelect={setNotifyBefore}
                />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-(--c-333438) px-4 py-3">
          {tab === 'task' ? (
            <>
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
              <button
                type="button"
                aria-label="Attach file"
                title="Attach file"
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
                className="rounded p-1.5 text-(--c-8a8c91) transition hover:bg-(--c-2a2b2e) hover:text-(--c-white)"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <div className="relative flex" ref={createMenuRef}>
                <button
                  type="button"
                  onClick={() => handleCreate('close')}
                  disabled={saving}
                  className="rounded-l-md bg-(--c-white) px-4 py-2 text-[14px] font-semibold text-(--c-1e1f21) transition hover:opacity-85 disabled:opacity-60"
                >
                  {saving ? 'Creating…' : cta}
                </button>
                <button
                  type="button"
                  aria-label="More create options"
                  onClick={() => setCreateMenuOpen((o) => !o)}
                  disabled={saving}
                  className="rounded-r-md border-l border-(--c-1e1f21)/25 bg-(--c-white) px-2 text-(--c-1e1f21) transition hover:opacity-85 disabled:opacity-60"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                {createMenuOpen && (
                  <div className="absolute right-0 bottom-full z-[320] mb-1 w-52 rounded-lg border border-(--c-333438) bg-(--c-1e1f21) p-1 shadow-2xl">
                    {[
                      { label: 'Create and open list', mode: 'open' as const },
                      { label: 'Create and add another', mode: 'another' as const },
                    ].map((o) => (
                      <button
                        key={o.mode}
                        type="button"
                        onClick={() => {
                          setCreateMenuOpen(false);
                          handleCreate(o.mode);
                        }}
                        className="w-full rounded-md px-2.5 py-1.5 text-left text-[13px] text-(--c-white) hover:bg-(--c-2a2b2e)"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                aria-label="Attach file"
                onClick={() => toast.info('Attachments are not available here yet')}
                className="rounded p-1.5 text-(--c-8a8c91) transition hover:bg-(--c-2a2b2e) hover:text-(--c-white)"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCreate()}
                className="rounded-md bg-(--c-white) px-4 py-2 text-[14px] font-semibold text-(--c-1e1f21) transition hover:opacity-85"
              >
                {cta}
              </button>
            </>
          )}
        </div>
      </div>

      {pickerOpen && tab === 'reminder' && (
        <DateTimePicker
          anchorRef={reminderDateRef}
          value={due}
          recurrence={recurrence}
          onChange={(d, picked) => {
            setDue(d);
            if (picked) setDueTouched(true);
          }}
          onRecurrenceChange={(r) => {
            setRecurrence(r);
            setDueTouched(true);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );

  return createPortal(node, document.body);
}

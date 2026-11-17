'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, ChevronRight, MessageSquare, Sparkles, Circle, CheckCircle2, Calendar, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface MyTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  updatedAt?: string;
  list: { id: string; name: string; project: { id: string; name: string; color: string } };
  comments?: { id: string }[];
}

type TabKey = 'activity' | 'tasks' | 'comments' | 'calendar' | 'more';
type SectionKey = 'today' | 'overdue' | 'next' | 'unscheduled' | 'done' | 'delegated';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'next', label: 'Next' },
  { key: 'unscheduled', label: 'Unscheduled' },
  { key: 'done', label: 'Done' },
  { key: 'delegated', label: 'Delegated' },
];

const formatDue = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

export default function MyWorkDrawer({ open, onClose, onStandUp }: { open: boolean; onClose: () => void; onStandUp?: () => void }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  const [tab, setTab] = useState<TabKey>('tasks');
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    today: false,
    overdue: false,
    next: false,
    unscheduled: false,
    done: false,
    delegated: false,
  });

  const workspaceId = activeWorkspace?.id;

  const fetchTasks = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ tasks: MyTask[] }>(`/workspaces/${workspaceId}/my-tasks`);
      setTasks(data.tasks);
    } catch (err) {
      console.error('Failed to fetch my work', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(fetchTasks, 0);
    return () => clearTimeout(id);
  }, [open, fetchTasks]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const grouped = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const g: Record<SectionKey, MyTask[]> = { today: [], overdue: [], next: [], unscheduled: [], done: [], delegated: [] };
    for (const t of tasks) {
      if (t.status === 'DONE') {
        g.done.push(t);
      } else if (!t.dueDate) {
        g.unscheduled.push(t);
      } else {
        const due = new Date(t.dueDate);
        if (due < startOfToday) g.overdue.push(t);
        else if (due < endOfToday) g.today.push(t);
        else g.next.push(t);
      }
    }
    return g;
  }, [tasks]);

  const openTasksCount = tasks.length - grouped.done.length;
  const totalComments = tasks.reduce((n, t) => n + (t.comments?.length ?? 0), 0);

  const recent = useMemo(
    () => [...tasks].sort((a, b) => +new Date(b.updatedAt ?? 0) - +new Date(a.updatedAt ?? 0)).slice(0, 15),
    [tasks]
  );
  const withDates = useMemo(
    () => tasks.filter((t) => t.dueDate && t.status !== 'DONE').sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!)),
    [tasks]
  );

  const goToTask = (t: MyTask) => {
    onClose();
    router.push(`/projects/${t.list.project.id}`);
  };

  const renderTask = (t: MyTask) => {
    const done = t.status === 'DONE';
    const overdue = !done && t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
    return (
      <button
        key={t.id}
        onClick={() => goToTask(t)}
        className="w-full flex items-center gap-2.5 px-5 py-2 text-left hover:bg-(--c-2a2b2e) transition-colors"
      >
        {done ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
        ) : (
          <Circle className="h-3.5 w-3.5 shrink-0" style={{ color: t.list.project.color }} />
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-[12px] truncate ${done ? 'line-through text-(--c-8a8c91)' : 'text-(--c-e5e5e5)'}`}>{t.title}</p>
          <p className="text-[10px] text-(--c-8a8c91) truncate">
            {t.list.project.name} / {t.list.name}
          </p>
        </div>
        {t.dueDate && (
          <span className={`text-[11px] shrink-0 ${overdue ? 'text-red-400' : 'text-(--c-8a8c91)'}`}>{formatDue(t.dueDate)}</span>
        )}
      </button>
    );
  };

  const renderEmpty = (text: string) => (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-16 px-6">
      <p className="text-[12px] text-(--c-8a8c91)">{text}</p>
    </div>
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'activity', label: 'Activity' },
    { key: 'tasks', label: `Tasks (${openTasksCount})` },
    { key: 'comments', label: `Comments (${totalComments})` },
    { key: 'calendar', label: 'Calendar' },
    { key: 'more', label: '1 more..' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        aria-hidden={!open}
        className={`fixed top-1 right-1 bottom-1 w-full max-w-90 bg-(--c-1e1f21) border border-(--c-333438) rounded-lg z-150 flex flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-[110%]'
        }`}
      >
        {/* Profile header */}
        <div className="relative flex gap-4 p-4 pb-3 shrink-0">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name || 'User'}
              width={84}
              height={100}
              className="h-25 w-21 rounded-md object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-25 w-21 rounded-md bg-indigo-500 text-white flex items-center justify-center text-3xl font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}

          <div className="min-w-0 flex-1 pt-1 pr-8">
            <h2 className="text-[17px] font-bold text-(--c-white) truncate flex items-center gap-1.5 leading-tight">
              {user?.name}
            </h2>
            <p className="text-[12px] text-(--c-8a8c91) mt-1.5 truncate">Add description...</p>
            <p className="text-[12px] text-[#1bb5a5] mt-1.5 flex items-center gap-1.5">
              <span className="inline-block h-3 w-px bg-(--c-444548) mr-0.5" />
              <Circle className="h-2 w-2 fill-current" /> Online
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <button
                aria-label="Message"
                className="h-6.5 w-6.5 flex items-center justify-center rounded-md bg-(--c-2a2b2e) border border-(--c-333438) hover:bg-(--c-333438) transition"
              >
                <MessageSquare className="h-3.5 w-3.5 text-(--c-c4c5c8)" />
              </button>
              <button
                onClick={onStandUp}
                className="h-6.5 flex items-center gap-1.5 px-2 rounded-md bg-(--c-2a2b2e) border border-(--c-333438) hover:bg-(--c-333438) text-[11px] font-medium text-(--c-e5e5e5) transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Get StandUp
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-(--c-2a2b2e) hover:bg-(--c-333438) flex items-center justify-center transition"
          >
            <X className="h-4 w-4 text-(--c-c4c5c8)" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-5 px-4 border-b border-(--c-333438) shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative py-2.5 text-[11px] whitespace-nowrap transition-colors ${
                tab === t.key ? 'text-(--c-white) font-semibold' : 'text-(--c-8a8c91) hover:text-(--c-e5e5e5)'
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-(--c-white) rounded-full" />}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && tasks.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-(--c-8a8c91)" />
            </div>
          ) : tab === 'tasks' ? (
            <div>
              {SECTIONS.map(({ key, label }) => {
                const items = grouped[key];
                const isOpen = expanded[key];
                return (
                  <div key={key} className="border-b border-(--c-333438)">
                    <button
                      onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))}
                      className="w-full flex items-center justify-between px-5 h-14 hover:bg-(--c-232426) transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-[13px] font-semibold text-(--c-white)">{label}</span>
                        <span className="text-[11px] text-(--c-8a8c91)">{items.length}</span>
                      </span>
                      <ChevronRight className={`h-3.5 w-3.5 text-(--c-8a8c91) transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="pb-2">
                        {items.length === 0 ? (
                          <p className="px-5 py-2 text-[11px] text-(--c-8a8c91)">No tasks</p>
                        ) : (
                          items.map(renderTask)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : tab === 'activity' ? (
            recent.length === 0 ? (
              renderEmpty('No recent activity')
            ) : (
              <div className="py-2">
                {recent.map(renderTask)}
              </div>
            )
          ) : tab === 'calendar' ? (
            withDates.length === 0 ? (
              renderEmpty('No scheduled tasks')
            ) : (
              <div className="py-2">
                {withDates.map((t) => (
                  <div key={t.id} className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 ml-5 text-(--c-8a8c91) shrink-0" />
                    <div className="flex-1 min-w-0">
                      {renderTask(t)}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            renderEmpty(tab === 'more' ? 'Nothing here yet' : 'No comments yet')
          )}
        </div>
      </aside>
    </>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Check, ListFilter, MessageSquare, Search, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/store/workspaceStore';
import UserAvatar from '@/components/UserAvatar';
import { lazyOnOpen } from '@/components/LazyMount';

import { Skeleton } from '@/components/ui/skeleton';

const TaskDetailModal = lazyOnOpen(() => import('@/components/TaskDetailModal'));

type TabId = 'assigned' | 'delegated';
type RangeId = 'all' | 'today' | 'week' | 'month';

interface AssignedComment {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
  task: {
    id: string;
    title: string;
    status: string;
    listId: string;
    assignee: { id: string; name: string; avatar: string | null } | null;
    list: { id: string; name: string; project: { id: string; name: string; color: string } };
  };
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'delegated', label: 'Delegated by me' },
];

const RANGES: { id: RangeId; label: string }[] = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'Last 30 days' },
];

const RANGE_MS: Record<Exclude<RangeId, 'all'>, number> = {
  today: 24 * 3600 * 1000,
  week: 7 * 24 * 3600 * 1000,
  month: 30 * 24 * 3600 * 1000,
};

const STATUS_LABEL: Record<string, string> = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Complete' };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function useOutside(onOutside: () => void, active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [active, onOutside]);
  return ref;
}

export default function AssignedCommentsPage() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const isAdmin = activeWorkspace?.role === 'ADMIN';

  const [tab, setTab] = useState<TabId>('assigned');
  const [range, setRange] = useState<RangeId>('all');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [comments, setComments] = useState<AssignedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ id: string; listId: string } | null>(null);
  const rangeRef = useOutside(() => setRangeOpen(false), rangeOpen);

  useEffect(() => {
    if (!activeWorkspace) return;
    let cancelled = false;
    setLoading(true);
    api
      .get<{ comments: AssignedComment[] }>(`/workspaces/${activeWorkspace.id}/assigned-comments`, { params: { type: tab } })
      .then(({ data }) => !cancelled && setComments(data.comments))
      .catch((err) => {
        console.error('Failed to fetch assigned comments', err);
        if (!cancelled) setComments([]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace, tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff = range === 'all' ? 0 : Date.now() - RANGE_MS[range];
    return comments.filter((c) => {
      if (new Date(c.createdAt).getTime() < cutoff) return false;
      if (!q) return true;
      return (
        c.text.toLowerCase().includes(q) ||
        c.task.title.toLowerCase().includes(q) ||
        c.user.name.toLowerCase().includes(q)
      );
    });
  }, [comments, query, range]);

  const hasFilters = range !== 'all' || query.trim() !== '';
  const closeModal = useCallback(() => setSelected(null), []);

  return (
    <div className="flex min-h-full flex-col">
      {/* Header + tabs */}
      <div className="shrink-0 border-b border-(--c-333438) px-6 pt-4">
        <h1 className="text-[16px] font-semibold text-(--c-white)">Assigned Comments</h1>
        <div className="mt-3 flex gap-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 pb-2 text-[13px] font-medium transition ${
                tab === t.id
                  ? 'border-b-(--c-white) text-(--c-white)'
                  : 'border-b-transparent text-(--c-8a8c91) hover:text-(--c-white)'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-6 pt-4 pb-3">
        <div className="relative" ref={rangeRef}>
          <button
            onClick={() => setRangeOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-full border border-(--c-333438) px-3 py-1 text-[12px] font-medium transition hover:bg-(--c-2a2b2e) ${
              range !== 'all' ? 'text-violet-400' : 'text-(--c-e5e5e5)'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" /> {RANGES.find((r) => r.id === range)?.label}
          </button>
          {rangeOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-(--c-333438) bg-(--c-1e1f21) p-1 shadow-2xl">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setRange(r.id);
                    setRangeOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] text-(--c-white) hover:bg-(--c-2a2b2e)"
                >
                  {r.label}
                  {range === r.id && <Check className="h-3.5 w-3.5 text-violet-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-full max-w-[240px] items-center gap-2 rounded-md border border-(--c-333438) px-2.5 py-1 text-(--c-8a8c91) transition focus-within:border-(--c-444548)">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-(--c-white) outline-none placeholder:text-(--c-8a8c91)"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-6 pb-6">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 pb-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-(--c-333438) bg-(--c-232426) text-(--c-8a8c91)">
              <UserCheck className="h-6 w-6" />
            </div>
            <p className="mt-5 text-[16px] font-semibold text-(--c-white)">No results found</p>
            <p className="mt-1 text-[12px] text-(--c-8a8c91)">
              {tab === 'assigned' ? 'No comments on your assigned tasks yet.' : 'You have not commented on tasks assigned to others.'}
            </p>
            {hasFilters && (
              <button
                onClick={() => {
                  setRange('all');
                  setQuery('');
                }}
                className="mt-4 flex items-center gap-1.5 rounded-md border border-(--c-333438) px-3 py-1.5 text-[13px] font-medium text-(--c-white) transition hover:bg-(--c-2a2b2e)"
              >
                <ListFilter className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected({ id: c.task.id, listId: c.task.listId })}
                className="group block w-full rounded-lg border border-(--c-333438) bg-(--c-232426)/40 px-4 py-3 text-left transition hover:bg-(--c-2a2b2e)"
              >
                <div className="flex items-center gap-2 text-[11px] text-(--c-8a8c91)">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.task.list.project.color }} />
                  <span className="truncate uppercase tracking-wider">
                    {c.task.list.project.name} / {c.task.list.name}
                  </span>
                </div>
                <p className="mt-1 truncate text-[14px] font-medium text-(--c-white)">{c.task.title}</p>

                <div className="mt-2 flex items-start gap-2.5">
                  <UserAvatar name={c.user.name} src={c.user.avatar} size={24} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-semibold text-(--c-white)">{c.user.name}</span>
                      <span className="text-[11px] text-(--c-8a8c91)">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="line-clamp-2 whitespace-pre-wrap break-words text-[13px] text-(--c-e5e5e5)">{c.text}</p>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 rounded bg-(--c-2a2b2e) px-1.5 py-0.5 text-[10px] font-medium text-(--c-8a8c91) sm:flex">
                    <MessageSquare className="h-3 w-3" /> {STATUS_LABEL[c.task.status] ?? c.task.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <TaskDetailModal
        taskId={selected?.id ?? ''}
        listId={selected?.listId ?? ''}
        open={!!selected}
        onClose={closeModal}
        isAdmin={isAdmin}
      />
    </div>
  );
}

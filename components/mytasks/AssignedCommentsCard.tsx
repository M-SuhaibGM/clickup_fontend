'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { Calendar, Check, CheckCheck, ListFilter, Search, UserCheck, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { apiError } from '@/lib/apiError';
import { useApi } from '@/lib/useApi';
import { useNow } from '@/lib/useNow';
import UserAvatar from '../UserAvatar';

interface AssignedComment {
  id: string;
  text: string;
  createdAt: string;
  resolvedAt: string | null;
  user: { id: string; name: string; avatar: string | null };
  task: {
    id: string;
    title: string;
    status: string;
    listId: string;
    list: { id: string; name: string; project: { id: string; name: string; color: string } };
  };
}

type TabId = 'assigned' | 'delegated';
type RangeId = 'all' | 'today' | 'week' | 'month';
const TABS: { id: TabId; label: string }[] = [
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'delegated', label: 'Delegated by me' },
];
const RANGES: { id: RangeId; label: string; ms: number }[] = [
  { id: 'all', label: 'All Time', ms: 0 },
  { id: 'today', label: 'Today', ms: 24 * 3600e3 },
  { id: 'week', label: 'Last 7 days', ms: 7 * 24 * 3600e3 },
  { id: 'month', label: 'Last 30 days', ms: 30 * 24 * 3600e3 },
];

const timeAgo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const pill = 'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition';

export default function AssignedCommentsCard({
  workspaceId, reloadKey, onOpenTask,
}: {
  workspaceId: string;
  reloadKey: number;
  onOpenTask: (task: { id: string; listId: string }) => void;
}) {
  const [tab, setTab] = useState<TabId>('assigned');
  const [range, setRange] = useState<RangeId>('all');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [query, setQuery] = useState('');
  const rangeRef = useRef<HTMLDivElement>(null);
  const now = useNow(60_000).getTime();
  const { data, loading, mutate } = useApi<{ comments: AssignedComment[] }>(`/workspaces/${workspaceId}/assigned-comments`, { type: tab }, reloadKey);

  useEffect(() => {
    if (!rangeOpen) return;
    const onDown = (e: MouseEvent) => !rangeRef.current?.contains(e.target as Node) && setRangeOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [rangeOpen]);

  const comments = useMemo(() => data?.comments ?? [], [data]);
  const unresolvedCount = comments.filter((c) => !c.resolvedAt).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff = range === 'all' ? 0 : now - (RANGES.find((r) => r.id === range)?.ms ?? 0);
    return comments.filter((c) => {
      if (!!c.resolvedAt !== showResolved) return false;
      if (new Date(c.createdAt).getTime() < cutoff) return false;
      return !q || `${c.text} ${c.task.title} ${c.user.name}`.toLowerCase().includes(q);
    });
  }, [comments, query, range, showResolved, now]);

  const filtersOn = range !== 'all' || query.trim() !== '' || showResolved;

  const setResolved = async (c: AssignedComment, resolved: boolean) => {
    const stamp = resolved ? new Date().toISOString() : null;
    mutate((d) => ({ comments: d.comments.map((x) => (x.id === c.id ? { ...x, resolvedAt: stamp } : x)) }));
    try {
      await api.patch(`/tasks/comments/${c.id}/resolve`, { resolved });
    } catch (err) {
      mutate((d) => ({ comments: d.comments.map((x) => (x.id === c.id ? c : x)) }));
      toast.error(apiError(err, 'Could not update the comment'));
    }
  };

  return (
    <>
      <div className="flex shrink-0 gap-4 border-b border-[color:var(--mt-border)] px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 pb-2 text-[13px] font-medium transition ${tab === t.id ? 'border-[color:var(--c-white)] text-[color:var(--c-white)]' : 'border-transparent text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'}`}
          >
            {t.label}
            {t.id === tab && unresolvedCount > 0 && <span className="ml-1.5 text-[11.5px] opacity-70">{unresolvedCount}</span>}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-4 py-2.5">
        <button
          onClick={() => setShowResolved((v) => !v)}
          aria-pressed={showResolved}
          className={`${pill} ${showResolved ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-[color:var(--mt-border)] text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]'}`}
        >
          <Check className="h-3.5 w-3.5" /> Resolved
        </button>
        <div className="relative" ref={rangeRef}>
          <button
            onClick={() => setRangeOpen((v) => !v)}
            className={`${pill} ${range !== 'all' ? 'border-violet-500/50 text-violet-400' : 'border-[color:var(--mt-border)] text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]'}`}
          >
            <Calendar className="h-3.5 w-3.5" /> {RANGES.find((r) => r.id === range)?.label}
          </button>
          {rangeOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 min-w-[150px] rounded-lg border border-[color:var(--mt-border)] bg-[color:var(--c-2a2b2e)] p-1 shadow-2xl">
              {RANGES.map((r) => (
                <button key={r.id} onClick={() => { setRange(r.id); setRangeOpen(false); }} className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)]">
                  {r.label} {range === r.id && <Check className="h-3.5 w-3.5 text-violet-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto flex min-w-[110px] flex-1 items-center gap-1.5 rounded-md px-2 py-1 text-[color:var(--c-8a8c91)] focus-within:bg-[color:var(--c-232426)] sm:max-w-[180px]">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-[13px] text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)]" />
        </div>
      </div>

      {loading && !data ? (
        <p className="flex flex-1 items-center justify-center text-[13px] text-[color:var(--c-8a8c91)]">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 pb-6 text-center">
          <span className="mb-1 flex h-14 w-14 items-center justify-center rounded-xl border border-[color:var(--mt-border)] text-[color:var(--c-8a8c91)]">
            <UserCheck className="h-6 w-6" />
          </span>
          <p className="text-[16px] font-semibold text-[color:var(--c-white)]">No results found</p>
          <p className="text-[12.5px] text-[color:var(--c-8a8c91)]">
            {showResolved ? 'No resolved comments yet.' : tab === 'assigned' ? 'No open comments on your assigned tasks.' : "You haven't commented on tasks assigned to others."}
          </p>
          {filtersOn && (
            <button onClick={() => { setRange('all'); setQuery(''); setShowResolved(false); }} className="mt-2 flex items-center gap-1.5 rounded-md border border-[color:var(--c-444548)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--c-white)] transition hover:bg-[color:var(--c-2a2b2e)]">
              <ListFilter className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>
      ) : (
        <ul className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3 custom-scrollbar">
          {visible.map((c) => (
            <li key={c.id} className="group relative rounded-lg border border-[color:var(--mt-border)] bg-[color:var(--c-232426)]/40 transition hover:bg-[color:var(--c-2a2b2e)]">
              <button onClick={() => onOpenTask({ id: c.task.id, listId: c.task.listId })} className="block w-full px-3 py-2.5 pr-11 text-left">
                <span className="flex items-center gap-1.5 text-[11px] text-[color:var(--c-8a8c91)]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: c.task.list.project.color }} />
                  <span className="truncate">{c.task.list.project.name} / {c.task.list.name}</span>
                </span>
                <span className="mt-0.5 block truncate text-[13.5px] font-medium text-[color:var(--c-white)]">{c.task.title}</span>
                <span className="mt-1.5 flex items-start gap-2">
                  <UserAvatar name={c.user.name} src={c.user.avatar} size={22} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2 text-[12.5px]">
                      <span className="font-semibold text-[color:var(--c-white)]">{c.user.name}</span>
                      <span className="text-[11px] text-[color:var(--c-8a8c91)]">{timeAgo(c.createdAt)}</span>
                    </span>
                    <span className="line-clamp-2 whitespace-pre-wrap break-words text-[13px] text-[color:var(--c-e5e5e5)]">{c.text}</span>
                  </span>
                </span>
              </button>
              <button
                onClick={() => setResolved(c, !c.resolvedAt)}
                aria-label={c.resolvedAt ? 'Reopen comment' : 'Resolve comment'}
                title={c.resolvedAt ? 'Reopen' : 'Resolve'}
                className="absolute right-2 top-2 rounded-md p-1.5 text-[color:var(--c-8a8c91)] opacity-0 transition hover:bg-[color:var(--c-333438)] hover:text-emerald-400 focus-visible:opacity-100 group-hover:opacity-100"
              >
                {c.resolvedAt ? <Undo2 className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

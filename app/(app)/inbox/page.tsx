'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  AlarmClock,
  Check,
  Check as CheckIcon,
  CheckCheck,
  Inbox as InboxIcon,
  ListFilter,
  Repeat,
  RotateCcw,
  Settings,
  Trash2,
  Activity,
  Clock,
} from 'lucide-react';
import { useReminderStore, bucketOf, type Reminder, type ReminderBucket } from '@/store/reminderStore';
import { useNow } from '@/lib/useNow';
import { dayLabel, formatTime, recurrenceLabel, startOfDay } from '@/lib/reminders';

type TabId = 'primary' | 'other' | 'later' | 'cleared';
type FilterId = 'all' | 'recurring' | 'one-time';

const TABS: { id: TabId; label: string; icon: typeof InboxIcon; countLabel?: string }[] = [
  { id: 'primary', label: 'Primary', icon: InboxIcon, countLabel: 'New' },
  { id: 'other', label: 'Other', icon: Activity },
  { id: 'later', label: 'Later', icon: Clock, countLabel: 'Later' },
  { id: 'cleared', label: 'Cleared', icon: CheckCheck },
];

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'recurring', label: 'Recurring' },
  { id: 'one-time', label: 'One-time' },
];

// localStorage-backed state only exists on the client
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
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

function InboxZero() {
  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-16">
      <svg width="220" height="170" viewBox="0 0 220 170" fill="none" aria-hidden>
        <path d="M20 70 C 30 40, 60 30, 80 62" stroke="var(--c-444548)" strokeDasharray="3 4" strokeLinecap="round" />
        <circle cx="20" cy="70" r="2.5" fill="var(--c-444548)" />
        <path d="M130 70 C 140 20, 180 10, 200 30" stroke="var(--c-444548)" strokeDasharray="3 4" strokeLinecap="round" />
        <circle cx="200" cy="30" r="2.5" fill="var(--c-444548)" />
        <path d="M50 100 C 70 85, 95 95, 105 112" stroke="var(--c-444548)" strokeDasharray="3 4" strokeLinecap="round" />
        <circle cx="50" cy="100" r="2.5" fill="var(--c-444548)" />
        <path d="M150 112 C 165 85, 190 92, 188 82" stroke="var(--c-444548)" strokeDasharray="3 4" strokeLinecap="round" />

        <g transform="rotate(-8 108 25)">
          <rect x="97" y="14" width="22" height="22" rx="6" fill="var(--c-2a2b2e)" stroke="var(--c-333438)" />
          <circle cx="108" cy="25" r="4" fill="#ec4899" />
        </g>
        <g transform="rotate(-10 78 62)">
          <rect x="60" y="44" width="36" height="36" rx="9" fill="var(--c-2a2b2e)" stroke="var(--c-333438)" />
          <rect x="68" y="52" width="20" height="20" rx="5" fill="#6d4aff" />
          <path d="M75 57 l-2 10 M82 57 l-2 10 M71 60 h14 M70 65 h14" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
        </g>
        <g transform="rotate(10 140 66)">
          <rect x="122" y="48" width="36" height="36" rx="9" fill="var(--c-2a2b2e)" stroke="var(--c-333438)" />
          <rect x="130" y="56" width="20" height="20" rx="5" fill="#2f80ed" />
          <path d="M135 62 h10 M135 66 h10 M135 70 h6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <g transform="rotate(-4 108 92)">
          <rect x="90" y="74" width="36" height="36" rx="9" fill="var(--c-2a2b2e)" stroke="var(--c-333438)" />
          <rect x="98" y="82" width="20" height="20" rx="5" fill="#f97316" />
          <path d="M103 90 h10 M103 94 h7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </g>

        <path d="M82 138 l12 -22 h28 l12 22 v16 a6 6 0 0 1 -6 6 h-40 a6 6 0 0 1 -6 -6 z" fill="var(--c-232426)" stroke="var(--c-444548)" strokeWidth="1.5" />
        <path d="M82 138 h18 a8 8 0 0 0 16 0 h18" stroke="var(--c-444548)" strokeWidth="1.5" fill="var(--c-2a2b2e)" />
        <circle cx="148" cy="152" r="10" fill="#22a06b" />
        <path d="M143 152 l3.5 3.5 l6 -7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="mt-6 text-[16px] font-semibold text-(--c-white)">You&apos;ve achieved Inbox Zero!</p>
    </div>
  );
}

function ReminderRow({
  r,
  bucket,
  now,
}: {
  r: Reminder;
  bucket: ReminderBucket;
  now: Date;
}) {
  const { clearReminder, restoreReminder, deleteReminder } = useReminderStore();
  const due = new Date(r.dueAt);
  const overdue = bucket === 'primary' && due.getTime() <= now.getTime();

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-(--c-333438) bg-(--c-232426)/40 px-3 py-2.5 transition hover:bg-(--c-2a2b2e)">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
          bucket === 'cleared' ? 'bg-(--c-2a2b2e) text-(--c-8a8c91)' : 'bg-amber-500/15 text-amber-400'
        }`}
      >
        <AlarmClock className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-[14px] ${bucket === 'cleared' ? 'text-(--c-8a8c91) line-through' : 'text-(--c-white)'}`}>
          {r.title}
        </p>
        {r.description && <p className="truncate text-[12px] text-(--c-8a8c91)">{r.description}</p>}
      </div>

      {r.recurrence !== 'none' && (
        <span className="hidden items-center gap-1 text-[11px] text-violet-400 sm:flex">
          <Repeat className="h-3 w-3" /> {recurrenceLabel(r.recurrence)}
        </span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        {bucket === 'cleared' ? (
          <button
            onClick={() => restoreReminder(r.id)}
            title="Restore"
            aria-label="Restore"
            className="rounded p-1.5 text-(--c-8a8c91) hover:bg-(--c-333438) hover:text-(--c-white)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => clearReminder(r.id)}
            title="Clear"
            aria-label="Clear"
            className="rounded p-1.5 text-(--c-8a8c91) hover:bg-(--c-333438) hover:text-emerald-400"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => deleteReminder(r.id)}
          title="Delete"
          aria-label="Delete"
          className="rounded p-1.5 text-(--c-8a8c91) hover:bg-(--c-333438) hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <span className={`w-[68px] shrink-0 text-right text-[12px] ${overdue ? 'text-amber-400' : 'text-amber-500/80'}`}>
        {formatTime(due)}
      </span>
    </div>
  );
}

export default function InboxPage() {
  const reminders = useReminderStore((s) => s.reminders);
  const clearMany = useReminderStore((s) => s.clearMany);
  const deleteCleared = useReminderStore((s) => s.deleteCleared);
  const now = useNow(15000);

  const mounted = useHydrated();
  const [tab, setTab] = useState<TabId>('primary');
  const [filter, setFilter] = useState<FilterId>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const filterRef = useOutside(() => setFilterOpen(false), filterOpen);
  const settingsRef = useOutside(() => setSettingsOpen(false), settingsOpen);

  const buckets = useMemo(() => {
    const out: Record<ReminderBucket, Reminder[]> = { primary: [], later: [], cleared: [] };
    reminders.forEach((r) => out[bucketOf(r, now)].push(r));
    out.primary.sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt));
    out.later.sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt));
    out.cleared.sort((a, b) => +new Date(b.clearedAt ?? 0) - +new Date(a.clearedAt ?? 0));
    return out;
  }, [reminders, now]);

  const list: Reminder[] = useMemo(() => {
    if (tab === 'other') return [];
    return buckets[tab].filter((r) =>
      filter === 'all' ? true : filter === 'recurring' ? r.recurrence !== 'none' : r.recurrence === 'none'
    );
  }, [buckets, tab, filter]);

  // Group by day
  const groups = useMemo(() => {
    const map = new Map<number, Reminder[]>();
    list.forEach((r) => {
      const key = startOfDay(new Date(r.dueAt)).getTime();
      map.set(key, [...(map.get(key) ?? []), r]);
    });
    return [...map.entries()];
  }, [list]);

  const canClearAll = (tab === 'primary' || tab === 'later') && list.length > 0;

  if (!mounted) return <div className="h-full" />;

  return (
    <div className="flex min-h-full flex-col">
      {/* Tabs */}
      <div className="grid shrink-0 grid-cols-2 border-b border-(--c-333438) sm:grid-cols-4">
        {TABS.map((t) => {
          const count = t.id === 'primary' ? buckets.primary.length : t.id === 'later' ? buckets.later.length : 0;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px flex items-center justify-center gap-2.5 border-b-2 border-r border-r-(--c-333438) px-4 py-3 text-left transition last:border-r-0 ${
                active
                  ? 'border-b-(--c-white) text-(--c-white)'
                  : 'border-b-transparent text-(--c-8a8c91) hover:text-(--c-white)'
              }`}
            >
              <t.icon className="h-4 w-4 shrink-0" />
              <span className="flex flex-col leading-tight">
                <span className="text-[14px] font-medium">{t.label}</span>
                {count > 0 && t.countLabel && (
                  <span className="text-[11px] text-(--c-8a8c91)">
                    {count} {t.countLabel}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-3">
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-full border border-(--c-333438) px-3 py-1 text-[12px] font-medium transition hover:bg-(--c-2a2b2e) ${
              filter !== 'all' ? 'text-violet-400' : 'text-(--c-e5e5e5)'
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" /> Filter{filter !== 'all' && `: ${FILTERS.find((f) => f.id === filter)?.label}`}
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[150px] rounded-lg border border-(--c-333438) bg-(--c-1e1f21) p-1 shadow-2xl">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilter(f.id);
                    setFilterOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] text-(--c-white) hover:bg-(--c-2a2b2e)"
                >
                  {f.label}
                  {filter === f.id && <Check className="h-3.5 w-3.5 text-violet-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              aria-label="Inbox settings"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-(--c-333438) text-(--c-8a8c91) transition hover:bg-(--c-2a2b2e) hover:text-(--c-white)"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[190px] rounded-lg border border-(--c-333438) bg-(--c-1e1f21) p-1 shadow-2xl">
                <button
                  onClick={() => {
                    deleteCleared();
                    setSettingsOpen(false);
                  }}
                  disabled={buckets.cleared.length === 0}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-red-400 hover:bg-(--c-2a2b2e) disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete cleared reminders
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => clearMany(list.map((r) => r.id))}
            disabled={!canClearAll}
            className="flex items-center gap-1.5 rounded-md border border-(--c-333438) px-2.5 py-1 text-[12px] font-medium text-(--c-e5e5e5) transition enabled:hover:bg-(--c-2a2b2e) disabled:cursor-default disabled:text-(--c-8a8c91)/60"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Clear all
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-6 pb-6">
        {groups.length === 0 ? (
          <InboxZero />
        ) : (
          <div className="space-y-4">
            {groups.map(([day, items]) => (
              <section key={day}>
                <h3 className="mb-2 text-[12px] font-semibold text-(--c-8a8c91)">{dayLabel(new Date(day), now)}</h3>
                <div className="space-y-1.5">
                  {items.map((r) => (
                    <ReminderRow key={r.id} r={r} bucket={bucketOf(r, now)} now={now} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

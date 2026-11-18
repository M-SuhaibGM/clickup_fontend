'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { formatSeconds } from '@/lib/duration';
import { useNow } from '@/lib/useNow';

interface Entry {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  task: { title: string; list: { project: { name: string; color: string } } };
}

const DAY = 86_400_000;
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** My tracked time over the last 7 days: a bar per day, plus where the time went. */
export default function TimeTrackedCard({ workspaceId, reloadKey }: { workspaceId: string; reloadKey: number }) {
  const { data, loading, error } = useApi<{ entries: Entry[] }>(`/workspaces/${workspaceId}/my-time`, { days: '7' }, reloadKey);
  const nowDate = useNow(30_000); // keeps a running timer's share of today growing

  const stats = useMemo(() => {
    const entries = data?.entries ?? [];
    const now = nowDate.getTime();
    const today = midnight(nowDate);
    const days = Array.from({ length: 7 }, (_, i) => ({ start: today - (6 - i) * DAY, seconds: 0 }));
    const perTask = new Map<string, { title: string; project: string; color: string; seconds: number }>();
    let running = false;

    for (const e of entries) {
      const from = Date.parse(e.startedAt);
      const to = e.endedAt ? Date.parse(e.endedAt) : now;
      if (!e.endedAt) running = true;
      let inRange = 0;
      // an entry that spans midnight is split between the days it touches
      for (const d of days) {
        const overlap = Math.min(to, d.start + DAY) - Math.max(from, d.start);
        if (overlap > 0) { d.seconds += overlap / 1000; inRange += overlap / 1000; }
      }
      if (inRange > 0) {
        const row = perTask.get(e.taskId) ?? { title: e.task.title, project: e.task.list.project.name, color: e.task.list.project.color, seconds: 0 };
        row.seconds += inRange;
        perTask.set(e.taskId, row);
      }
    }
    const total = days.reduce((s, d) => s + d.seconds, 0);
    const max = Math.max(...days.map((d) => d.seconds), 1);
    return { days, total, max, running, top: [...perTask.values()].sort((a, b) => b.seconds - a.seconds).slice(0, 4), today };
  }, [data, nowDate]);

  if (loading && !data) return <p className="flex flex-1 items-center justify-center text-[13px] text-[color:var(--c-8a8c91)]">Loading…</p>;
  if (error && !data) return <p className="flex flex-1 items-center justify-center text-[13px] text-red-400">Couldn&apos;t load your tracked time.</p>;

  if (stats.total < 1) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 pb-6 text-center">
        <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--mt-border)] text-[color:var(--c-8a8c91)]"><Clock className="h-5 w-5" /></span>
        <p className="text-[14px] font-semibold text-[color:var(--c-white)]">No time tracked this week</p>
        <p className="text-[12.5px] text-[color:var(--c-8a8c91)]">Start a timer on a task assigned to you and it will show up here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-4 pb-4">
      <div className="flex items-baseline gap-2">
        <span className="text-[26px] font-bold text-[color:var(--c-white)]">{formatSeconds(stats.total)}</span>
        <span className="text-[12.5px] text-[color:var(--c-8a8c91)]">in the last 7 days</span>
        {stats.running && <span className="ml-auto flex items-center gap-1.5 text-[12px] text-emerald-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Timer running</span>}
      </div>

      <div className="mt-4 flex h-[130px] items-end gap-2">
        {stats.days.map((d) => {
          const label = new Date(d.start).toLocaleDateString('en-US', { weekday: 'short' });
          const isToday = d.start === stats.today;
          return (
            <div key={d.start} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${new Date(d.start).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}: ${d.seconds >= 1 ? formatSeconds(d.seconds) : 'nothing tracked'}`}>
              <span className="text-[10.5px] text-[color:var(--c-8a8c91)]">{d.seconds >= 60 ? formatSeconds(d.seconds) : ''}</span>
              <div className={`w-full rounded-t-md ${isToday ? 'bg-indigo-500' : 'bg-indigo-500/45'}`} style={{ height: `${Math.max(d.seconds >= 1 ? 4 : 2, (d.seconds / stats.max) * 90)}px`, opacity: d.seconds >= 1 ? 1 : 0.25 }} />
              <span className={`text-[11px] ${isToday ? 'font-semibold text-[color:var(--c-white)]' : 'text-[color:var(--c-8a8c91)]'}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {stats.top.length > 0 && (
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--mt-border)] pt-3 custom-scrollbar">
          <p className="mb-1.5 text-[12px] font-semibold text-[color:var(--c-8a8c91)]">Most time on</p>
          <ul className="space-y-1.5">
            {stats.top.map((t) => (
              <li key={`${t.title}-${t.project}`} className="flex items-center gap-2 text-[13px]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="min-w-0 flex-1 truncate text-[color:var(--c-white)]">{t.title}</span>
                <span className="hidden truncate text-[11.5px] text-[color:var(--c-8a8c91)] sm:inline sm:max-w-[110px]">{t.project}</span>
                <span className="shrink-0 font-medium tabular-nums text-[color:var(--c-e5e5e5)]">{formatSeconds(t.seconds)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

'use client';

import { CalendarSearch } from 'lucide-react';
import { toast } from 'sonner';
import { startOfDay } from '@/lib/dateUtils';
import TaskLine from './TaskLine';
import type { MyTask } from './types';

const PROVIDERS = [
  { name: 'Google Calendar', emoji: '🗓️' },
  { name: 'Microsoft Outlook', emoji: '📧' },
];

const dayHeading = (ms: number, today: number) => {
  const diff = Math.round((ms - today) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return new Date(ms).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

/** What's due in the next 7 days, plus a place to connect a calendar. */
export default function AgendaCard({ tasks, now, onOpen, onToggle }: {
  tasks: MyTask[];
  now: Date;
  onOpen: (task: MyTask) => void;
  onToggle: (task: MyTask) => void;
}) {
  const today = startOfDay(now);
  const week = today + 7 * 86_400_000;
  const upcoming = tasks
    .filter((t) => t.status !== 'DONE' && t.dueDate && startOfDay(new Date(t.dueDate)) >= today && startOfDay(new Date(t.dueDate)) < week)
    .sort((a, b) => Date.parse(a.dueDate!) - Date.parse(b.dueDate!));

  const days = new Map<number, MyTask[]>();
  for (const t of upcoming) {
    const day = startOfDay(new Date(t.dueDate!));
    days.set(day, [...(days.get(day) ?? []), t]);
  }

  const connect = (
    <div className="space-y-2">
      {PROVIDERS.map((p) => (
        <div key={p.name} className="flex items-center justify-between rounded-xl border border-[color:var(--mt-border)] bg-[color:var(--c-232426)] px-3 py-2.5">
          <span className="flex items-center gap-2.5 text-[14px] font-medium text-[color:var(--c-white)]"><span className="text-base leading-none">{p.emoji}</span> {p.name}</span>
          <button onClick={() => toast.info(`${p.name} integration is coming soon`)} className="rounded-md bg-[color:var(--c-2a2b2e)] px-3 py-1 text-[12.5px] font-medium text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-333438)]">Connect</button>
        </div>
      ))}
    </div>
  );

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 pb-5 text-center custom-scrollbar">
        <div className="flex flex-col items-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[color:var(--c-2a2b2e)] text-[color:var(--c-8a8c91)]"><CalendarSearch className="h-7 w-7" /></span>
          <p className="max-w-[240px] text-[13px] leading-snug text-[color:var(--c-8a8c91)]">Connect your calendar to view upcoming events and join your next call</p>
        </div>
        <div className="w-full max-w-[380px]">{connect}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 pb-3 custom-scrollbar">
      {[...days].map(([day, list]) => (
        <div key={day}>
          <p className="px-2.5 pb-1 pt-3 text-[12px] font-semibold text-[color:var(--c-8a8c91)]">{dayHeading(day, today)} <span className="font-normal opacity-70">{list.length}</span></p>
          {list.map((t) => <TaskLine key={t.id} task={t} onOpen={onOpen} onToggle={onToggle} />)}
        </div>
      ))}
      <div className="mt-4 border-t border-[color:var(--mt-border)] px-2 pt-3">
        <p className="mb-2 text-[12px] font-semibold text-[color:var(--c-8a8c91)]">Add your calendar</p>
        {connect}
      </div>
    </div>
  );
}

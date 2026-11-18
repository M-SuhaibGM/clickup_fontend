'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, ListChecks } from 'lucide-react';
import { startOfDay } from '@/lib/dateUtils';
import TaskLine from './TaskLine';
import type { MyTask } from './types';

interface Shared {
  tasks: MyTask[];
  onOpen: (task: MyTask) => void;
  onToggle: (task: MyTask) => void;
}

/** Splits my tasks into the buckets the cards use. */
export function bucketTasks(tasks: MyTask[]) {
  const today = startOfDay(new Date());
  const open = tasks.filter((t) => t.status !== 'DONE');
  const byDue = (a: MyTask, b: MyTask) => Date.parse(a.dueDate ?? '') - Date.parse(b.dueDate ?? '');
  return {
    overdue: open.filter((t) => t.dueDate && startOfDay(new Date(t.dueDate)) < today).sort(byDue),
    today: open.filter((t) => t.dueDate && startOfDay(new Date(t.dueDate)) === today),
    upcoming: open.filter((t) => t.dueDate && startOfDay(new Date(t.dueDate)) > today).sort(byDue),
    noDate: open.filter((t) => !t.dueDate),
    done: tasks.filter((t) => t.status === 'DONE'),
  };
}

function Empty({ icon: Icon, title, hint }: { icon: typeof CalendarCheck; title: string; hint: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 pb-6 text-center">
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--mt-border)] text-[color:var(--c-8a8c91)]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-[14px] font-semibold text-[color:var(--c-white)]">{title}</p>
      <p className="text-[12.5px] text-[color:var(--c-8a8c91)]">{hint}</p>
    </div>
  );
}

function GroupLabel({ children, tone, count }: { children: string; tone?: 'danger'; count: number }) {
  return (
    <p className={`px-2.5 pb-1 pt-3 text-[12px] font-semibold ${tone === 'danger' ? 'text-red-400' : 'text-[color:var(--c-8a8c91)]'}`}>
      {children} <span className="font-normal opacity-70">{count}</span>
    </p>
  );
}

export function TodayOverdueCard({ tasks, onOpen, onToggle }: Shared) {
  const { overdue, today } = useMemo(() => bucketTasks(tasks), [tasks]);
  if (overdue.length + today.length === 0) {
    return <Empty icon={CalendarCheck} title="You're all clear" hint="Nothing is due today and nothing is overdue." />;
  }
  return (
    <div className="flex-1 overflow-y-auto px-2 pb-3 custom-scrollbar">
      {overdue.length > 0 && <GroupLabel tone="danger" count={overdue.length}>Overdue</GroupLabel>}
      {overdue.map((t) => <TaskLine key={t.id} task={t} onOpen={onOpen} onToggle={onToggle} />)}
      {today.length > 0 && <GroupLabel count={today.length}>Today</GroupLabel>}
      {today.map((t) => <TaskLine key={t.id} task={t} onOpen={onOpen} onToggle={onToggle} />)}
    </div>
  );
}

type Tab = 'upcoming' | 'noDate' | 'done';
const TABS: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'noDate', label: 'No date' },
  { id: 'done', label: 'Done' },
];

export function AssignedCard({ tasks, onOpen, onToggle }: Shared) {
  const [tab, setTab] = useState<Tab>('upcoming');
  const buckets = useMemo(() => bucketTasks(tasks), [tasks]);
  const list = buckets[tab];

  return (
    <>
      <div className="flex shrink-0 gap-4 border-b border-[color:var(--mt-border)] px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2 text-[13px] font-medium transition ${tab === t.id ? 'border-[color:var(--c-white)] text-[color:var(--c-white)]' : 'border-transparent text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'}`}
          >
            {t.label} <span className="text-[11.5px] opacity-70">{buckets[t.id].length}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty
          icon={tab === 'done' ? CheckCircle2 : ListChecks}
          title={tab === 'done' ? 'Nothing completed yet' : tab === 'noDate' ? 'Every task has a date' : 'Nothing coming up'}
          hint={tab === 'done' ? 'Tasks you complete will show up here.' : 'Tasks assigned to you will appear here.'}
        />
      ) : (
        <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
          {list.map((t) => <TaskLine key={t.id} task={t} onOpen={onOpen} onToggle={onToggle} />)}
        </div>
      )}
    </>
  );
}

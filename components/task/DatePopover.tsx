'use client';

import { useState } from 'react';
import { Ban, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarDays, getQuickDates, sameDay, startOfDay } from '@/lib/dateUtils';
import { popoverCls, useDismiss } from './FieldRow';

export type DateField = 'startDate' | 'dueDate';

interface Props {
  start: string | null;
  due: string | null;
  initialTab: 'start' | 'due';
  onPick: (field: DateField, date: Date | null) => void;
  onClose: () => void;
}

/** Start / Due date picker: quick options on the left, a month grid on the right. */
export default function DatePopover({ start, due, initialTab, onPick, onClose }: Props) {
  const ref = useDismiss<HTMLDivElement>(true, onClose);
  const [tab, setTab] = useState(initialTab);
  const startD = start ? new Date(start) : null;
  const dueD = due ? new Date(due) : null;
  const selected = tab === 'start' ? startD : dueD;

  const anchor = selected ?? dueD ?? startD ?? new Date();
  const [month, setMonth] = useState(anchor.getMonth());
  const [year, setYear] = useState(anchor.getFullYear());
  const days = getCalendarDays(year, month);
  const today = new Date();

  const pick = (d: Date | null) => {
    onPick(tab === 'start' ? 'startDate' : 'dueDate', d);
    // Choosing a start with no due date yet? Move on to the due date, like ClickUp.
    if (d && tab === 'start' && !dueD) setTab('due');
    else onClose();
  };

  const inRange = (d: Date) => !!startD && !!dueD && startOfDay(d) > startOfDay(startD) && startOfDay(d) < startOfDay(dueD);
  const step = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setMonth(next.getMonth());
    setYear(next.getFullYear());
  };

  return (
    <div ref={ref} className={`${popoverCls} w-[470px] overflow-hidden`}>
      <div className="flex border-b border-[color:var(--c-333438)]">
        {(['start', 'due'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2 text-xs transition ${
              tab === t ? 'border-indigo-500 font-semibold text-[color:var(--c-white)]' : 'border-transparent text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            {t === 'start' ? 'Start date' : 'Due date'}
            <span className="text-[color:var(--c-8a8c91)] font-normal">
              {(t === 'start' ? startD : dueD)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? ''}
            </span>
          </button>
        ))}
      </div>

      <div className="flex">
        <div className="w-[180px] border-r border-[color:var(--c-333438)] py-1">
          {getQuickDates().map((o) => (
            <button key={o.label} onClick={() => pick(o.date)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-[color:var(--c-white)] transition hover:bg-[color:var(--c-333438)]">
              <span>{o.label}</span>
              <span className="text-[10px] text-[color:var(--c-8a8c91)]">{o.hint}</span>
            </button>
          ))}
          {selected && (
            <button onClick={() => pick(null)} className="mt-1 flex w-full items-center gap-1.5 border-t border-[color:var(--c-333438)] px-3 py-1.5 text-xs text-red-400 transition hover:bg-[color:var(--c-333438)]">
              <Ban className="h-3 w-3" /> Clear {tab === 'start' ? 'start' : 'due'} date
            </button>
          )}
        </div>

        <div className="flex-1 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[color:var(--c-white)]">
              {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => step(-1)} aria-label="Previous month" className="rounded p-1 text-[color:var(--c-8a8c91)] transition hover:bg-[color:var(--c-333438)] hover:text-[color:var(--c-white)]">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }} className="px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300">Today</button>
              <button onClick={() => step(1)} aria-label="Next month" className="rounded p-1 text-[color:var(--c-8a8c91)] transition hover:bg-[color:var(--c-333438)] hover:text-[color:var(--c-white)]">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-semibold text-[#666]">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map(({ date, currentMonth }, i) => {
              const isToday = sameDay(date, today);
              const isStart = !!startD && sameDay(date, startD);
              const isDue = !!dueD && sameDay(date, dueD);
              return (
                <button
                  key={i}
                  onClick={() => pick(date)}
                  className={[
                    'mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] transition',
                    currentMonth ? 'text-[color:var(--c-e5e5e5)] hover:bg-[#444]' : 'text-[#555] hover:bg-[#3a3b3f]',
                    inRange(date) ? 'bg-indigo-500/15' : '',
                    isToday ? 'ring-1 ring-indigo-400' : '',
                    isStart || isDue ? '!bg-indigo-600 font-bold !text-white' : '',
                  ].join(' ')}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

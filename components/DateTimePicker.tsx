'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlarmClockCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Repeat,
  Sunrise,
  Sunset,
} from 'lucide-react';
import {
  RECURRENCE_OPTIONS,
  addDays,
  atTime,
  formatShortDate,
  formatTime,
  parseNatural,
  sameDay,
  startOfDay,
  type Recurrence,
} from '@/lib/reminders';

interface Props {
  anchorRef: React.RefObject<HTMLElement | null>;
  value: Date;
  recurrence?: Recurrence;
  allowRecurrence?: boolean;
  onChange: (d: Date, picked: boolean) => void;
  onRecurrenceChange?: (r: Recurrence) => void;
  onClose: () => void;
}

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toTimeInput(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DateTimePicker({
  anchorRef,
  value,
  recurrence = 'none',
  allowRecurrence = true,
  onChange,
  onRecurrenceChange,
  onClose,
}: Props) {
  const popRef = useRef<HTMLDivElement>(null);
  const [now] = useState(() => new Date());
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [view, setView] = useState<'main' | 'recurring'>('main');
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Position next to the anchor, clamped to the viewport
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const pop = popRef.current;
    if (!anchor || !pop) return;
    const r = anchor.getBoundingClientRect();
    const h = pop.offsetHeight;
    const w = pop.offsetWidth;
    const top = Math.max(8, Math.min(r.top - 36, window.innerHeight - h - 8));
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    setPos({ top, left });
  }, [anchorRef, view]);

  // Outside click / Escape
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [anchorRef, onClose]);

  const pick = (d: Date) => {
    onChange(d, true);
    onClose();
  };

  const quick = [
    { icon: AlarmClockCheck, label: 'In 20 minutes', date: new Date(now.getTime() + 20 * 60000) },
    { icon: Clock, label: 'In 2 hours', date: new Date(now.getTime() + 2 * 3600000) },
    { icon: Sunrise, label: 'Tomorrow', date: atTime(addDays(now, 1), 8) },
    { icon: Sunset, label: 'In 2 days', date: atTime(addDays(now, 2), 8) },
    { icon: CalendarPlus, label: 'Next week', date: atTime(addDays(now, ((8 - now.getDay()) % 7) || 7), 8) },
  ];

  const quickRight = (d: Date, label: string) =>
    label.startsWith('In 20') || label.startsWith('In 2 hours')
      ? formatTime(d)
      : `${d.toLocaleDateString('en-US', { weekday: 'short' })}, ${formatTime(d)}`;

  // Calendar grid
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = addDays(first, -first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = startOfDay(now);

  const selectDay = (d: Date) => {
    const next = atTime(d, value.getHours(), value.getMinutes());
    pick(next);
  };

  const submitText = () => {
    const parsed = parseNatural(text, new Date());
    if (!parsed) {
      setInvalid(true);
      return;
    }
    pick(parsed);
  };

  const node = (
    <div
      ref={popRef}
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      className="fixed z-[400] w-[244px] rounded-xl border border-(--c-333438) bg-(--c-1e1f21) text-(--c-e5e5e5) shadow-2xl animate-in fade-in duration-100"
    >
      {view === 'main' ? (
        <>
          <div className="p-2 pb-1.5">
            <input
              autoFocus
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setInvalid(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitText();
                }
              }}
              placeholder='Try "Tomorrow at 2 PM"...'
              className={`w-full rounded-md border bg-transparent px-2.5 py-1.5 text-[13px] text-(--c-white) outline-none placeholder:text-(--c-8a8c91) ${
                invalid ? 'border-red-500' : 'border-(--c-white)/80 focus:border-(--c-white)'
              }`}
            />
          </div>

          <div className="px-1 pb-1">
            {quick.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => pick(q.date)}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-(--c-2a2b2e)"
              >
                <q.icon className="h-4 w-4 shrink-0 text-(--c-8a8c91)" />
                <span className="flex-1 text-[13px] text-(--c-white)">{q.label}</span>
                <span className="text-[11px] text-(--c-8a8c91)">{quickRight(q.date, q.label)}</span>
              </button>
            ))}
            {allowRecurrence && (
              <button
                type="button"
                onClick={() => setView('recurring')}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-(--c-2a2b2e)"
              >
                <Repeat className="h-4 w-4 shrink-0 text-violet-400" />
                <span className="flex-1 text-[13px] text-violet-400">Set Recurring</span>
                <ChevronRight className="h-4 w-4 text-violet-400" />
              </button>
            )}
          </div>

          <div className="border-t border-(--c-333438) px-3 pt-2.5 pb-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-(--c-white)">
                {month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
                  className="mr-1 rounded px-1 text-[12px] text-(--c-8a8c91) hover:text-(--c-white)"
                >
                  Today
                </button>
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  className="rounded p-0.5 text-(--c-8a8c91) hover:bg-(--c-2a2b2e) hover:text-(--c-white)"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="rounded p-0.5 text-(--c-8a8c91) hover:bg-(--c-2a2b2e) hover:text-(--c-white)"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-0.5 text-center">
              {WEEK.map((w) => (
                <span key={w} className="py-1 text-[11px] font-medium text-(--c-e5e5e5)">
                  {w}
                </span>
              ))}
              {days.map((d) => {
                const inMonth = d.getMonth() === month.getMonth();
                const past = startOfDay(d) < today;
                const isToday = sameDay(d, today);
                const selected = sameDay(d, value);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    disabled={past}
                    onClick={() => selectDay(d)}
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[12px] transition ${
                      isToday
                        ? 'bg-red-600 font-semibold text-white'
                        : selected
                          ? 'bg-(--c-white) font-semibold text-(--c-1e1f21)'
                          : past
                            ? 'cursor-default text-(--c-8a8c91)/40'
                            : inMonth
                              ? 'text-(--c-white) hover:bg-(--c-2a2b2e)'
                              : 'text-(--c-e5e5e5) hover:bg-(--c-2a2b2e)'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-(--c-333438) px-3 py-2">
            <CalendarClock className="h-4 w-4 shrink-0 text-(--c-8a8c91)" />
            <span className="flex-1 text-[12px] text-(--c-8a8c91)">{formatShortDate(value)} at</span>
            <input
              type="time"
              value={toTimeInput(value)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map((n) => parseInt(n, 10));
                if (Number.isNaN(h) || Number.isNaN(m)) return;
                onChange(atTime(value, h, m), true);
              }}
              className="rounded-md border border-(--c-333438) bg-transparent px-1.5 py-1 text-[12px] text-(--c-white) outline-none focus:border-(--c-444548) scheme-dark"
            />
          </div>
        </>
      ) : (
        <div className="p-1.5">
          <button
            type="button"
            onClick={() => setView('main')}
            className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-(--c-8a8c91) hover:bg-(--c-2a2b2e)"
          >
            <ChevronLeft className="h-4 w-4" /> Set Recurring
          </button>
          {RECURRENCE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onRecurrenceChange?.(o.value);
                onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-(--c-2a2b2e)"
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-(--c-8a8c91)" />
              <span className="flex-1 text-[13px] text-(--c-white)">{o.label}</span>
              {recurrence === o.value && <Check className="h-4 w-4 text-violet-400" />}
            </button>
          ))}
          {recurrence !== 'none' && (
            <button
              type="button"
              onClick={() => {
                onRecurrenceChange?.('none');
                onClose();
              }}
              className="mt-1 w-full rounded-md px-2.5 py-1.5 text-left text-[13px] text-red-400 hover:bg-(--c-2a2b2e)"
            >
              Don&apos;t repeat
            </button>
          )}
        </div>
      )}
    </div>
  );

  return createPortal(node, document.body);
}

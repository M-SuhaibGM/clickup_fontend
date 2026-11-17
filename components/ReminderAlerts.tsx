'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlarmClock, Check, X } from 'lucide-react';
import { useReminderStore, type Reminder } from '@/store/reminderStore';
import { formatTime, dayLabel } from '@/lib/reminders';

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.22);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {}
}

/** Watches reminders and pops an alert when a reminder's time arrives. Mount once in the app shell. */
export default function ReminderAlerts() {
  const [queue, setQueue] = useState<Reminder[]>([]);
  const checking = useRef(false);

  const check = useCallback(() => {
    if (checking.current) return;
    checking.current = true;
    const { reminders, markAlerted } = useReminderStore.getState();
    const nowMs = Date.now();
    const due = reminders.filter((r) => !r.clearedAt && !r.alerted && new Date(r.dueAt).getTime() <= nowMs);
    if (due.length) {
      due.forEach((r) => markAlerted(r.id));
      setQueue((q) => [...q, ...due]);
      beep();
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        due.forEach((r) => {
          try {
            new Notification(`Reminder: ${r.title}`, { body: r.description || formatTime(new Date(r.dueAt)) });
          } catch {}
        });
      }
    }
    checking.current = false;
  }, []);

  useEffect(() => {
    const first = setTimeout(check, 0);
    const id = setInterval(check, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [check]);

  const current = queue[0];
  const dismiss = () => setQueue((q) => q.slice(1));

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [current]);

  if (!current) return null;
  const due = new Date(current.dueAt);

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-start justify-center bg-black/40 px-4 pt-[18vh]">
      <div
        role="alertdialog"
        aria-label="Reminder"
        className="w-full max-w-[420px] rounded-xl border border-(--c-333438) bg-(--c-1e1f21) p-4 text-(--c-e5e5e5) shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            <AlarmClock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Reminder{queue.length > 1 ? ` · ${queue.length - 1} more` : ''}
            </p>
            <h3 className="mt-0.5 break-words text-[15px] font-semibold text-(--c-white)">{current.title}</h3>
            {current.description && (
              <p className="mt-1 whitespace-pre-wrap break-words text-[13px] text-(--c-8a8c91)">{current.description}</p>
            )}
            <p className="mt-1.5 text-[12px] text-(--c-8a8c91)">
              {dayLabel(due)}, {formatTime(due)}
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="rounded p-1 text-(--c-8a8c91) hover:bg-(--c-2a2b2e) hover:text-(--c-white)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {[5, 10, 60].map((m) => (
            <button
              key={m}
              onClick={() => {
                useReminderStore.getState().snoozeReminder(current.id, m);
                dismiss();
              }}
              className="rounded-md border border-(--c-333438) px-2.5 py-1.5 text-[12px] text-(--c-e5e5e5) transition hover:bg-(--c-2a2b2e)"
            >
              Snooze {m === 60 ? '1 hr' : `${m} min`}
            </button>
          ))}
          <button
            onClick={() => {
              useReminderStore.getState().clearReminder(current.id);
              dismiss();
            }}
            className="flex items-center gap-1.5 rounded-md bg-(--c-white) px-3 py-1.5 text-[12px] font-semibold text-(--c-1e1f21) transition hover:opacity-85"
          >
            <Check className="h-3.5 w-3.5" /> Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Clock, Play, Square, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatClock, formatMinutes, formatSeconds, parseDuration } from '@/lib/duration';
import type { TimeEntry } from '@/types/task';
import UserAvatar from '../UserAvatar';

const secondsOf = (e: TimeEntry, now: number) =>
  Math.max(0, ((e.endedAt ? Date.parse(e.endedAt) : now) - Date.parse(e.startedAt)) / 1000);

/** Re-renders every second, but only the component that calls it. */
function useTick(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now; // only read while an entry is running, which is exactly when it is ticking
}

export const totalSeconds = (entries: TimeEntry[], now = Date.now()) => entries.reduce((sum, e) => sum + secondsOf(e, now), 0);

/**
 * "Track time" field: one wide button with two click zones.
 *  - the round icon starts / stops the timer (assignee only)
 *  - the rest of the button opens the log-time popup (admins only)
 */
export function TrackTimeField({
  entries, myId, estimateMinutes, busy, canTimer, canLog, popupOpen, onStartTimer, onOpen, onStop,
}: {
  entries: TimeEntry[];
  myId?: string;
  estimateMinutes?: number | null;
  busy: boolean;
  /** this person is the assignee, so they may run the timer */
  canTimer: boolean;
  /** this person is an admin, so they may open the log-time popup */
  canLog: boolean;
  popupOpen: boolean;
  onStartTimer: () => void;
  onOpen: () => void;
  onStop: () => void;
}) {
  const mine = entries.find((e) => !e.endedAt && e.userId === myId);
  const someoneElse = entries.some((e) => !e.endedAt && e.userId !== myId);
  const now = useTick(entries.some((e) => !e.endedAt));
  const total = totalSeconds(entries, now);
  const over = !!estimateMinutes && total > estimateMinutes * 60;
  const iconEnabled = !busy && (!!mine || canTimer);

  return (
    <div
      data-popover-trigger
      onClick={canLog ? onOpen : undefined}
      title={canLog ? 'Log time' : undefined}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13.5px] transition ${
        popupOpen ? 'bg-[color:var(--c-2a2b2e)]' : ''
      } ${canLog ? 'cursor-pointer hover:bg-[color:var(--c-2a2b2e)]' : ''}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation(); // the icon only toggles the timer — it must not also open the popup
          if (mine) onStop();
          else onStartTimer();
        }}
        disabled={!iconEnabled}
        aria-label={mine ? 'Stop timer' : 'Start timer'}
        title={mine ? 'Stop timer' : canTimer ? 'Start timer' : 'Only the assignee can track time'}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
          mine
            ? 'bg-red-500 text-white hover:bg-red-400'
            : 'bg-[color:var(--c-8a8c91)] text-[color:var(--c-1e1f21)] hover:bg-[color:var(--c-white)] disabled:hover:bg-[color:var(--c-8a8c91)]'
        }`}
      >
        {mine ? <Square className="h-2.5 w-2.5 fill-current" /> : <Play className="ml-px h-2.5 w-2.5 fill-current" />}
      </button>

      {mine ? (
        <span className="font-medium tabular-nums text-red-400">{formatClock(secondsOf(mine, now))}</span>
      ) : (
        <span className={total >= 1 ? (over ? 'text-amber-400' : 'text-[color:var(--c-white)]') : 'text-[color:var(--c-8a8c91)]'} title={over ? 'Over the estimate' : undefined}>
          {total >= 1 ? formatSeconds(total) : 'Start'}
        </span>
      )}
      {mine && total >= 1 && <span className="text-[12.5px] text-[color:var(--c-8a8c91)]">{formatSeconds(total)} total</span>}
      {estimateMinutes ? <span className="text-[12.5px] text-[color:var(--c-8a8c91)]">/ {formatMinutes(estimateMinutes)}</span> : null}
      {someoneElse && !mine && <span className="text-[12px] text-emerald-400">● someone is tracking</span>}
    </div>
  );
}

const dayTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Right-hand "Time" tab: every entry, plus a form to log time by hand. */
export function TimeLogPanel({
  entries, myId, isAdmin, estimateMinutes, onAdd, onDelete,
}: {
  entries: TimeEntry[];
  myId?: string;
  isAdmin: boolean;
  estimateMinutes?: number | null;
  onAdd: (input: { minutes: number; date: string; note: string }) => Promise<void>;
  onDelete: (entry: TimeEntry) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const running = entries.some((e) => !e.endedAt);
  const now = useTick(running);
  const total = totalSeconds(entries, now);

  const submit = async () => {
    const minutes = parseDuration(duration);
    if (!minutes) return toast.error('Enter a duration like 1h 30m, 45m or 1:30');
    setSaving(true);
    try {
      await onAdd({ minutes, date, note });
      setDuration('');
      setNote('');
    } catch { /* the caller already toasted */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-[color:var(--c-333438)] px-4 py-3">
        <span className="text-sm font-semibold text-[color:var(--c-white)]">Time tracked</span>
        <span className="text-[12.5px] text-[color:var(--c-8a8c91)]">
          {formatSeconds(total)}{estimateMinutes ? ` / ${formatMinutes(estimateMinutes)} est.` : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {entries.length === 0 ? (
          <div className="space-y-2 py-10 text-center">
            <Clock className="mx-auto h-8 w-8 text-[color:var(--c-444548)]" />
            <p className="text-sm font-semibold text-[color:var(--c-white)]">No time tracked yet</p>
            <p className="text-xs text-[color:var(--c-8a8c91)]">Start the timer on the task, or log time below.</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {entries.map((e) => (
              <li key={e.id} className="group flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-[color:var(--c-2a2b2e)]">
                <UserAvatar name={e.user.name} src={e.user.avatar} size={24} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[13px] text-[color:var(--c-white)]">
                    <span className="truncate">{e.userId === myId ? 'You' : e.user.name}</span>
                    {!e.endedAt ? (
                      <span className="rounded bg-emerald-500/15 px-1.5 text-[10px] font-semibold uppercase text-emerald-400">Running</span>
                    ) : (
                      <span className="font-semibold tabular-nums">{formatSeconds(secondsOf(e, now))}</span>
                    )}
                  </p>
                  <p className="text-[11.5px] text-[color:var(--c-8a8c91)]">
                    {e.manual ? `Added ${dayTime(e.endedAt ?? e.startedAt)}` : `${dayTime(e.startedAt)}${e.endedAt ? '' : ' →'}`}
                  </p>
                  {e.note && <p className="mt-0.5 break-words text-[12px] text-[color:var(--c-e5e5e5)]">{e.note}</p>}
                </div>
                {e.endedAt && (e.userId === myId || isAdmin) && (
                  <button onClick={() => onDelete(e)} aria-label="Delete time entry" title="Delete" className="rounded p-1 text-[color:var(--c-8a8c91)] opacity-0 transition hover:text-red-400 group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isAdmin && (
        <p className="border-t border-[color:var(--c-333438)] px-4 py-3 text-[12px] text-[color:var(--c-8a8c91)]">
          The assignee starts the timer from the task. Admins can also log time by hand.
        </p>
      )}
      {isAdmin && (
      <div className="space-y-2 border-t border-[color:var(--c-333438)] p-3">
        <p className="text-[12px] font-semibold text-[color:var(--c-e5e5e5)]">Log time</p>
        <div className="flex gap-2">
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="1h 30m"
            className="w-24 rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] px-2.5 py-1.5 text-[13px] text-[color:var(--c-white)] outline-none focus:border-indigo-500"
          />
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] px-2.5 py-1.5 text-[13px] text-[color:var(--c-white)] outline-none [color-scheme:dark] focus:border-indigo-500"
          />
        </div>
        <input
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="What did you work on? (optional)"
          className="w-full rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] px-2.5 py-1.5 text-[13px] text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)] focus:border-indigo-500"
        />
        <button onClick={submit} disabled={saving || !duration.trim()} className="w-full rounded-lg bg-indigo-600 py-1.5 text-[13px] font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50">
          {saving ? 'Adding…' : 'Add time'}
        </button>
      </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { AlignLeft, Clock, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { formatMinutes, formatSeconds, parseDuration } from '@/lib/duration';
import type { TimeEntry } from '@/types/task';
import UserAvatar from '../UserAvatar';
import { popoverCls, useDismiss } from './FieldRow';
import { totalSeconds } from './TimePanel';

export interface ManualTimeInput {
  minutes?: number;
  date?: string;
  startedAt?: string;
  endedAt?: string;
  note?: string;
}

interface Props {
  entries: TimeEntry[];
  me: { name: string; avatar?: string | null };
  estimateMinutes?: number | null;
  busy: boolean;
  /** the timer is only for the assignee */
  canTimer: boolean;
  onStart: () => Promise<void> | void;
  onAdd: (input: ManualTimeInput) => Promise<void>;
  onClose: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const inputCls =
  'rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[13.5px] text-[color:var(--c-e5e5e5)] outline-none transition hover:border-[color:var(--c-333438)] focus:border-indigo-500 [color-scheme:dark]';

/** The popup behind "Start": log time by hand, or start the timer. */
export default function TimeEntryPopover({ entries, me, estimateMinutes, busy, canTimer, onStart, onAdd, onClose }: Props) {
  const ref = useDismiss<HTMLDivElement>(true, onClose);
  const today = localDate();
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(today);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const total = totalSeconds(entries);
  const range = from && to ? { from, to } : null;
  const rangeMinutes = range ? (Date.parse(`${date}T${to}`) - Date.parse(`${date}T${from}`)) / 60_000 : null;
  const typed = parseDuration(duration);
  // What would be saved: a typed duration wins, otherwise the from–to range
  const minutes = typed ?? (rangeMinutes && rangeMinutes > 0 ? Math.round(rangeMinutes) : null);
  const canSave = !!minutes && !saving;

  const save = async () => {
    if (duration.trim() && typed === null) return toast.error('Enter a time like 3h 20m, 45m or 1:30');
    if (!minutes) return toast.error('Enter a time, or a start and end time');
    setSaving(true);
    try {
      await onAdd(
        typed === null && range
          ? { startedAt: new Date(`${date}T${from}`).toISOString(), endedAt: new Date(`${date}T${to}`).toISOString(), note: note.trim() || undefined }
          : { minutes: minutes, date, note: note.trim() || undefined }
      );
      onClose();
    } catch { /* the caller already toasted; keep the form open */ } finally {
      setSaving(false);
    }
  };

  const start = async () => {
    await onStart();
    onClose();
  };

  return (
    <div ref={ref} className={`${popoverCls} w-[430px] p-4`}>
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold text-[color:var(--c-white)]">Time on this task</span>
        <span className="text-[14px] font-semibold text-[color:var(--c-white)]">{total >= 1 ? formatSeconds(total) : '0h'}</span>
      </div>
      {estimateMinutes ? (
        <p className="mt-0.5 text-[12.5px] text-[color:var(--c-8a8c91)]">Estimate {formatMinutes(estimateMinutes)}</p>
      ) : null}

      <div className="mt-3 rounded-xl border border-[color:var(--c-333438)]">
        <div className="flex items-center gap-2 border-b border-[color:var(--c-333438)] px-3 py-2.5 text-[13.5px] text-[color:var(--c-white)]">
          <UserAvatar name={me.name} src={me.avatar ?? null} size={22} /> {me.name}
        </div>

        <div className="border-b border-[color:var(--c-333438)] p-2">
          <div className="flex items-center gap-2 rounded-lg border border-[color:var(--c-555660)] bg-[color:var(--c-1e1f21)] px-3 py-2 focus-within:border-indigo-500">
            <input
              autoFocus
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                if (duration.trim() || !canTimer) save();
                else start();
              }}
              placeholder={canTimer ? 'Enter time (ex: 3h 20m) or start timer' : 'Enter time (ex: 3h 20m)'}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
            />
            {canTimer && (
            <button
              onClick={start}
              disabled={busy || !!duration.trim()}
              aria-label="Start timer"
              title={duration.trim() ? 'Clear the time field to start a timer' : 'Start timer'}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--c-8a8c91)] text-[color:var(--c-1e1f21)] transition hover:bg-[color:var(--c-white)] disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="ml-px h-3.5 w-3.5 fill-current" />}
            </button>
            )}
          </div>
        </div>

        <div className="space-y-1 p-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[13.5px] text-[color:var(--c-8a8c91)]">
            <Clock className="mr-1 h-4 w-4" />
            <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} className={inputCls} aria-label="Date" />
            <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} aria-label="Start time" />
            <span>–</span>
            <input type="time" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} aria-label="End time" />
          </div>
          {typed === null && rangeMinutes !== null && (
            <p className={`pl-7 text-[12px] ${rangeMinutes > 0 ? 'text-[color:var(--c-8a8c91)]' : 'text-red-400'}`}>
              {rangeMinutes > 0 ? `= ${formatMinutes(Math.round(rangeMinutes))}` : 'The end time must be after the start time'}
            </p>
          )}
          <div className="flex items-center gap-2.5 text-[color:var(--c-8a8c91)]">
            <AlignLeft className="h-4 w-4 shrink-0" />
            <input
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Notes"
              className="min-w-0 flex-1 bg-transparent py-1 text-[13.5px] text-[color:var(--c-e5e5e5)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-[color:var(--c-333438)] px-3 py-2.5">
          <button
            onClick={save}
            disabled={!canSave}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-[13.5px] font-semibold text-white transition hover:bg-indigo-500 disabled:bg-[color:var(--c-333438)] disabled:text-[color:var(--c-8a8c91)]"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

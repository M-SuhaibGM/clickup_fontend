export type Recurrence = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export const RECURRENCE_OPTIONS: { value: Exclude<Recurrence, 'none'>; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const NOTIFY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'At time of reminder' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export function notifyLabel(mins: number) {
  return NOTIFY_OPTIONS.find((o) => o.value === mins)?.label ?? `${mins} minutes before`;
}

export function recurrenceLabel(r: Recurrence) {
  return RECURRENCE_OPTIONS.find((o) => o.value === r)?.label ?? '';
}

// ───── date helpers ─────
export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function atTime(d: Date, h: number, m = 0) {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatShortDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "Today" / "Tomorrow" / "Wed, Nov 18" */
export function dayLabel(d: Date, now = new Date()) {
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, addDays(now, 1))) return 'Tomorrow';
  if (sameDay(d, addDays(now, -1))) return 'Yesterday';
  const base = formatShortDate(d);
  return d.getFullYear() === now.getFullYear() ? base : `${base}, ${d.getFullYear()}`;
}

export function nextOccurrence(d: Date, rec: Recurrence, now = new Date()) {
  if (rec === 'none') return d;
  let next = new Date(d);
  let guard = 0;
  while (next <= now && guard++ < 1000) {
    if (rec === 'daily') next = addDays(next, 1);
    else if (rec === 'weekly') next = addDays(next, 7);
    else if (rec === 'monthly') next.setMonth(next.getMonth() + 1);
    else if (rec === 'weekdays') {
      next = addDays(next, 1);
      while (next.getDay() === 0 || next.getDay() === 6) next = addDays(next, 1);
    }
  }
  return next;
}

// ───── natural language ("Tomorrow at 2 PM") ─────
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function parseNatural(input: string, now = new Date()): Date | null {
  let s = input.trim().toLowerCase();
  if (!s) return null;

  // relative: "in 20 minutes", "in 2 hours", "in 3 days", "in 1 week"
  const rel = s.match(/^in\s+(\d+)\s*(min|mins|minute|minutes|hour|hours|hr|hrs|day|days|week|weeks)$/);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const unit = rel[2];
    const d = new Date(now);
    if (unit.startsWith('min')) d.setMinutes(d.getMinutes() + n);
    else if (unit.startsWith('h')) d.setHours(d.getHours() + n);
    else if (unit.startsWith('d')) d.setDate(d.getDate() + n);
    else d.setDate(d.getDate() + n * 7);
    d.setSeconds(0, 0);
    return d;
  }

  // extract time
  let hour: number | null = null;
  let minute = 0;
  const t12 = s.match(/(?:\bat\s+)?\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  const t24 = s.match(/(?:\bat\s+)?\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (t12) {
    hour = parseInt(t12[1], 10);
    minute = t12[2] ? parseInt(t12[2], 10) : 0;
    if (hour < 1 || hour > 12) return null;
    if (t12[3] === 'pm' && hour < 12) hour += 12;
    if (t12[3] === 'am' && hour === 12) hour = 0;
    s = s.replace(t12[0], ' ');
  } else if (t24) {
    hour = parseInt(t24[1], 10);
    minute = parseInt(t24[2], 10);
    s = s.replace(t24[0], ' ');
  }
  s = s.replace(/\bat\b/g, ' ').replace(/\s+/g, ' ').trim();

  let date: Date | null = null;
  let defaultHour = 8;

  if (s === '' ) {
    date = hour === null ? null : new Date(now);
  } else if (s === 'today') date = new Date(now);
  else if (s === 'tonight') {
    date = new Date(now);
    defaultHour = 20;
  } else if (s === 'tomorrow' || s === 'tmrw' || s === 'tom') date = addDays(now, 1);
  else if (s === 'next week') {
    date = addDays(now, ((8 - now.getDay()) % 7) || 7); // next Monday
  } else {
    const wd = s.match(/^(?:next\s+)?([a-z]+)$/);
    const wdIdx = wd ? WEEKDAYS.findIndex((w) => w === wd[1] || (wd[1].length >= 3 && w.startsWith(wd[1]))) : -1;
    if (wdIdx >= 0) {
      let diff = (wdIdx - now.getDay() + 7) % 7;
      if (diff === 0) diff = 7;
      date = addDays(now, diff);
    } else {
      const md = s.match(/^([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?$/);
      const mIdx = md ? MONTHS.findIndex((m) => md[1].startsWith(m)) : -1;
      if (md && mIdx >= 0) {
        date = new Date(md[3] ? parseInt(md[3], 10) : now.getFullYear(), mIdx, parseInt(md[2], 10));
        if (!md[3] && startOfDay(date) < startOfDay(now)) date.setFullYear(date.getFullYear() + 1);
      } else {
        const sl = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
        if (sl) {
          let y = sl[3] ? parseInt(sl[3], 10) : now.getFullYear();
          if (y < 100) y += 2000;
          date = new Date(y, parseInt(sl[1], 10) - 1, parseInt(sl[2], 10));
          if (!sl[3] && startOfDay(date) < startOfDay(now)) date.setFullYear(date.getFullYear() + 1);
        }
      }
    }
  }

  if (!date || isNaN(date.getTime())) return null;

  const result = atTime(date, hour ?? defaultHour, hour === null ? 0 : minute);
  // only a time was given and it already passed today → tomorrow
  if (s === '' && hour !== null && result <= now) return addDays(result, 1);
  return result;
}

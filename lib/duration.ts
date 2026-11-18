/** "1h 30m", "90m", "1.5h", "1:30", "45" (minutes) → whole minutes; null when it can't be read. */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;

  const clock = s.match(/^(\d+):([0-5]?\d)$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(Number(s)); // bare number = minutes

  const re = /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|min|mins|minutes?)\b/g;
  let total = 0;
  let matched = '';
  for (const m of s.matchAll(re)) {
    total += Number(m[1]) * (m[2].startsWith('h') ? 60 : 1);
    matched += m[0];
  }
  // everything in the string must have been understood ("1h 30m" ok, "1h banana" not)
  if (!matched || s.replace(/\s+/g, '') !== matched.replace(/\s+/g, '')) return null;
  return Math.round(total);
}

/** 3725 → "1h 2m"; under a minute → "45s". */
export function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export const formatMinutes = (minutes: number) => formatSeconds(minutes * 60);

/** 83 seconds → "00:01:23" (running-timer display). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

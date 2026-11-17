'use client';

import { useEffect, useState } from 'react';

/** Re-renders on an interval so time-based UI (due reminders) stays current. */
export function useNow(intervalMs = 15000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

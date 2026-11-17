import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nextOccurrence, type Recurrence } from '@/lib/reminders';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueAt: string; // ISO
  notifyBefore: number; // minutes
  recurrence: Recurrence;
  clearedAt: string | null;
  createdAt: string;
  alerted: boolean; // the "time has come" alert was already shown
}

export type ReminderBucket = 'primary' | 'later' | 'cleared';

/** primary = notification time reached, later = scheduled in the future, cleared = done */
export function bucketOf(r: Reminder, now: Date = new Date()): ReminderBucket {
  if (r.clearedAt) return 'cleared';
  const notifyAt = new Date(r.dueAt).getTime() - r.notifyBefore * 60000;
  return now.getTime() >= notifyAt ? 'primary' : 'later';
}

interface ReminderState {
  reminders: Reminder[];
  addReminder: (input: Omit<Reminder, 'id' | 'clearedAt' | 'createdAt' | 'alerted'>) => Reminder;
  clearReminder: (id: string) => void;
  restoreReminder: (id: string) => void;
  markAlerted: (id: string) => void;
  snoozeReminder: (id: string, minutes: number) => void;
  deleteReminder: (id: string) => void;
  clearMany: (ids: string[]) => void;
  deleteCleared: () => void;
}

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function clearOne(r: Reminder): Reminder {
  // Recurring reminders roll forward to their next occurrence instead of being archived
  if (r.recurrence !== 'none') {
    const next = nextOccurrence(new Date(r.dueAt), r.recurrence);
    return { ...r, dueAt: next.toISOString(), alerted: false };
  }
  return { ...r, clearedAt: new Date().toISOString() };
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set) => ({
      reminders: [],
      addReminder: (input) => {
        const reminder: Reminder = { ...input, id: genId(), clearedAt: null, alerted: false, createdAt: new Date().toISOString() };
        set((s) => ({ reminders: [reminder, ...s.reminders] }));
        return reminder;
      },
      clearReminder: (id) =>
        set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? clearOne(r) : r)) })),
      restoreReminder: (id) =>
        set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, clearedAt: null } : r)) })),
      markAlerted: (id) =>
        set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, alerted: true } : r)) })),
      snoozeReminder: (id, minutes) =>
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id
              ? { ...r, dueAt: new Date(Date.now() + minutes * 60000).toISOString(), alerted: false, notifyBefore: 0 }
              : r
          ),
        })),
      deleteReminder: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),
      clearMany: (ids) =>
        set((s) => ({ reminders: s.reminders.map((r) => (ids.includes(r.id) ? clearOne(r) : r)) })),
      deleteCleared: () => set((s) => ({ reminders: s.reminders.filter((r) => !r.clearedAt) })),
    }),
    { name: 'clickup:reminders' }
  )
);

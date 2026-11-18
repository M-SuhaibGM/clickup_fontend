import type { Task } from '@/types/task';

export type ColumnKey = 'assignee' | 'dueDate' | 'priority' | 'status' | 'comments';

export const TASK_COLUMNS: { key: ColumnKey; label: string; width: string }[] = [
  { key: 'assignee', label: 'Assignee', width: '110px' },
  { key: 'dueDate', label: 'Due date', width: '110px' },
  { key: 'priority', label: 'Priority', width: '120px' },
  { key: 'status', label: 'Status', width: '130px' },
  { key: 'comments', label: 'Comments', width: '90px' },
];

export const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  assignee: true, dueDate: true, priority: true, status: true, comments: true,
};

/** checkbox | name | visible columns | row menu */
export const gridTemplate = (visible: Record<ColumnKey, boolean>) =>
  ['28px', 'minmax(240px,1fr)', ...TASK_COLUMNS.filter((c) => visible[c.key]).map((c) => c.width), '36px'].join(' ');

export const STATUSES: { value: Task['status']; label: string; color: string }[] = [
  { value: 'TODO', label: 'TO DO', color: '#8a8c91' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS', color: '#3b82f6' },
  { value: 'DONE', label: 'COMPLETE', color: '#22c55e' },
];

export const PRIORITY_OPTIONS: { value: Task['priority']; label: string; color: string }[] = [
  { value: 'URGENT', label: 'Urgent', color: '#ef4444' },
  { value: 'HIGH', label: 'High', color: '#f59e0b' },
  { value: 'NORMAL', label: 'Normal', color: '#3b82f6' },
  { value: 'LOW', label: 'Low', color: '#8a8c91' },
];

export const statusMeta = (s: Task['status']) => STATUSES.find((x) => x.value === s) ?? STATUSES[0];

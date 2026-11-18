import type { Task } from '@/types/task';

export type GroupBy = 'status' | 'priority' | 'assignee' | 'none';
export const GROUP_LABEL: Record<GroupBy, string> = { status: 'Status', priority: 'Priority', assignee: 'Assignee', none: 'None' };
export const UNASSIGNED = '__unassigned';

/** Which group a task belongs to under the given grouping. */
export const groupKeyOf = (groupBy: GroupBy, t: Task) =>
  groupBy === 'status' ? t.status : groupBy === 'priority' ? t.priority : groupBy === 'assignee' ? (t.assigneeId ?? UNASSIGNED) : 'all';

/** The change that moves a task into a group (null when the grouping has no field behind it). */
export const patchForGroup = (groupBy: GroupBy, key: string): Partial<Task> | null => {
  if (groupBy === 'status') return { status: key as Task['status'] };
  if (groupBy === 'priority') return { priority: key as Task['priority'] };
  if (groupBy === 'assignee') return { assigneeId: key === UNASSIGNED ? null : key };
  return null;
};

/** Fields a task created inside a group should start with. */
export const defaultsForGroup = (groupBy: GroupBy, key: string): { status?: string; priority?: string; assigneeId?: string } => {
  if (groupBy === 'status') return { status: key };
  if (groupBy === 'priority') return { priority: key };
  if (groupBy === 'assignee' && key !== UNASSIGNED) return { assigneeId: key };
  return {};
};

/** Group key to use for "Add Task" when no group is visible yet. */
export const defaultGroupKey = (groupBy: GroupBy) =>
  groupBy === 'priority' ? 'NORMAL' : groupBy === 'assignee' ? UNASSIGNED : groupBy === 'none' ? 'all' : 'TODO';

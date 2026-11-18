export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  startDate?: string | null;
  /** estimated time, in minutes */
  estimateMinutes?: number | null;
  tags?: string[];
  listId: string;
  assigneeId: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; name: string; avatar: string | null } | null;
  comments?: Comment[]; //
  subtasks?: Task[]; // Add this
  attachments?: string[]; // ← ADD
  timeEntries?: TimeEntry[];
  list?: { id: string; name: string; projectId: string; project: { id: string; name: string; workspaceId: string } };

  _count?: {
    subtasks: number;
    comments: number;
  };

}

export interface Comment {
  id: string;
  text: string;
  taskId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startedAt: string;
  /** null while the timer is running */
  endedAt: string | null;
  manual: boolean;
  note: string | null;
  user: { id: string; name: string; avatar: string | null };
}

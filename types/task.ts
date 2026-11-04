export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  listId: string;
  assigneeId: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; name: string; avatar: string | null } | null;
}
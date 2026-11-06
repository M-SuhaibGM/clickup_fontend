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
  comments?: Comment[]; //
  subtasks?: Task[]; // Add this
  attachments?: string[]; // ← ADD

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

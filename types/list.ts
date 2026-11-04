import type { Task } from './task';

export interface List {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  _count?: { tasks: number };
  tasks?: Task[];
}
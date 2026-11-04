export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { lists: number };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
}
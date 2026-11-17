export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  ownerId?: string;
  workspaceId?: string;
  /** Every project lives in exactly one space. */
  spaceId: string | null;
  space?: { id: string; name: string; color: string; icon: string | null } | null;
  /** Every project owns exactly one channel, named after the project. */
  channel?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  _count?: { lists: number };
}

export interface CreateProjectInput {
  name: string;
  spaceId: string;
  description?: string;
  color?: string;
}

export interface Space {
  id: string;
  name: string;
  color: string;
  /** key into SPACE_ICONS; null = show the first letter of the name */
  icon: string | null;
  description: string | null;
  order: number;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { projects: number };
}

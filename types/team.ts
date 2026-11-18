export interface TeamMember {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

export interface Team {
  id: string;
  name: string;
  color: string;
  /** key into SPACE_ICONS; null = show the first letter of the name */
  icon: string | null;
  description: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
}

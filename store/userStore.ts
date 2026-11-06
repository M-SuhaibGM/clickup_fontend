import { create } from 'zustand';
import { api } from '@/lib/api';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface UserState {
  users: UserSummary[];
  loading: boolean;
  fetchUsers: (workspaceId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,

  fetchUsers: async (workspaceId) => {
    set({ loading: true });
    try {
      // Fetch the workspace details which includes its members
      const { data } = await api.get<{ workspace: { members: { user: UserSummary }[] } }>(`/workspaces/${workspaceId}`);
      
      // Extract just the user objects from the members array
      const members = data.workspace.members.map((m) => m.user);
      
      set({ users: members, loading: false });
    } catch (err) {
      console.error('Failed to fetch workspace members', err);
      set({ loading: false });
    }
  },
}));
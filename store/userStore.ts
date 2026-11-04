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
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    // Prevent redundant fetches
    if (get().users.length > 0) return;
    
    set({ loading: true });
    try {
      const { data } = await api.get<{ users: UserSummary[] }>('/users');
      set({ users: data.users, loading: false });
    } catch (err) {
      console.error('Failed to fetch users', err);
      set({ loading: false });
    }
  },
}));
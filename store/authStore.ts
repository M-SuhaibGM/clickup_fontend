import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/auth';
import { useWorkspaceStore } from './workspaceStore';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAccessToken: (token: string) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,

      setAccessToken: (token) => set({ accessToken: token }),

      setUser: (user) => {
        const prev = get().user;
        if (prev?.id !== user?.id) {
          // Identity changed (login, OAuth switch, logout) — wipe workspace state
          useWorkspaceStore.getState().clear();
        }
        set({ user });
      },

      logout: () => {
        useWorkspaceStore.getState().clear();
        set({ accessToken: null, user: null });
      },

      isAuthenticated: () => Boolean(get().accessToken),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);
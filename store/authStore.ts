import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/auth';
import { useWorkspaceStore } from './workspaceStore';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  hasHydrated: boolean;
  setAccessToken: (token: string) => void;
  setUser: (user: User | null) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,

      setAccessToken: (token) => set({ accessToken: token }),

      setHasHydrated: (value) => set({ hasHydrated: value }),

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
      // Keep only the user profile in localStorage. The access token stays in
      // memory — it is refreshed from the httpOnly refresh cookie on page load.
      // This prevents the token from being stolen via XSS.
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
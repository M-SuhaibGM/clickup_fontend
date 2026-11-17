import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Space } from '@/types/space';
import { useProjectStore } from './projectStore';

// The workspace of the most recent fetch — a slower response for a workspace the
// user has already switched away from must not overwrite the current one.
let latestRequest: string | null = null;

interface SpaceState {
  spaces: Space[];
  loading: boolean;

  fetchSpaces: (workspaceId: string) => Promise<void>;
  createSpace: (workspaceId: string, input: { name: string; color?: string; icon?: string | null; description?: string }) => Promise<Space>;
  updateSpace: (id: string, input: { name?: string; color?: string; icon?: string | null; description?: string | null }) => Promise<Space>;
  deleteSpace: (id: string) => Promise<void>;
  bumpProjectCount: (spaceId: string, amount: number) => void;
  clear: () => void;
}

export const useSpaceStore = create<SpaceState>((set) => ({
  spaces: [],
  loading: false,

  fetchSpaces: async (workspaceId) => {
    latestRequest = workspaceId;
    set({ loading: true });
    try {
      const { data } = await api.get<{ spaces: Space[] }>(`/workspaces/${workspaceId}/spaces`);
      if (latestRequest !== workspaceId) return;
      set({ spaces: data.spaces, loading: false });
    } catch (err) {
      console.error('Failed to fetch spaces', err);
      if (latestRequest === workspaceId) set({ loading: false });
    }
  },

  createSpace: async (workspaceId, input) => {
    const { data } = await api.post<{ space: Space }>(`/workspaces/${workspaceId}/spaces`, input);
    set((s) => ({ spaces: [...s.spaces, data.space] }));
    return data.space;
  },

  updateSpace: async (id, input) => {
    const { data } = await api.patch<{ space: Space }>(`/spaces/${id}`, input);
    set((s) => ({ spaces: s.spaces.map((sp) => (sp.id === id ? data.space : sp)) }));
    return data.space;
  },

  deleteSpace: async (id) => {
    await api.delete(`/spaces/${id}`);
    set((s) => ({ spaces: s.spaces.filter((sp) => sp.id !== id) }));
    // The server deleted every project inside it too
    useProjectStore.getState().removeBySpace(id);
  },

  bumpProjectCount: (spaceId, amount) =>
    set((s) => ({
      spaces: s.spaces.map((sp) =>
        sp.id === spaceId
          ? { ...sp, _count: { projects: Math.max(0, (sp._count?.projects ?? 0) + amount) } }
          : sp
      ),
    })),

  clear: () => set({ spaces: [], loading: false }),
}));

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { List } from '@/types/list';
import { useProjectStore } from './projectStore';

interface ListState {
  listsByProject: Record<string, List[]>;
  loading: boolean;
  error: string | null;

  fetchLists: (projectId: string) => Promise<void>;
  createList: (projectId: string, name: string) => Promise<List>;
  updateList: (projectId: string, listId: string, name: string) => Promise<void>;
  deleteList: (projectId: string, listId: string) => Promise<void>;
  incrementTaskCount: (listId: string, amount: number) => void;
  clear: () => void;
  reorderLists: (projectId: string, newLists: List[]) => Promise<void>;
}

export const useListStore = create<ListState>((set, get) => ({
  listsByProject: {},
  loading: false,
  error: null,

  fetchLists: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<{ lists: List[] }>(`/projects/${projectId}/lists`);
      set((s) => ({
        listsByProject: { ...s.listsByProject, [projectId]: data.lists },
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to load lists', loading: false });
    }
  },

  createList: async (projectId, name) => {
    const { data } = await api.post<{ list: List }>(`/projects/${projectId}/lists`, { name });
    set((s) => ({
      listsByProject: {
        ...s.listsByProject,
        [projectId]: [...(s.listsByProject[projectId] ?? []), data.list],
      },
    }));

    // Tell the sidebar to update the list count
    useProjectStore.getState().updateProjectListCount(projectId, 1);

    return data.list;
  },

  updateList: async (projectId, listId, name) => {
    const { data } = await api.patch<{ list: List }>(`/lists/${listId}`, { name });
    set((s) => ({
      listsByProject: {
        ...s.listsByProject,
        [projectId]: (s.listsByProject[projectId] ?? []).map((l) =>
          l.id === listId ? data.list : l
        ),
      },
    }));
  },

  deleteList: async (projectId, listId) => {
    await api.delete(`/lists/${listId}`);
    set((s) => ({
      listsByProject: {
        ...s.listsByProject,
        [projectId]: (s.listsByProject[projectId] ?? []).filter((l) => l.id !== listId),
      },
    }));

    // Tell the sidebar to update the list count
    useProjectStore.getState().updateProjectListCount(projectId, -1);
  },

  incrementTaskCount: (listId, amount) => {
    set((s) => {
      const updatedListsByProject = { ...s.listsByProject };
      for (const projectId in updatedListsByProject) {
        updatedListsByProject[projectId] = updatedListsByProject[projectId].map((l) => {
          if (l.id === listId) {
            return {
              ...l,
              _count: {
                ...l._count,
                tasks: Math.max(0, (l._count?.tasks ?? 0) + amount),
              },
            };
          }
          return l;
        });
      }
      return { listsByProject: updatedListsByProject };
    });
  },
  reorderLists: async (projectId, newLists) => {
    // Optimistic update
    set((s) => ({
      listsByProject: {
        ...s.listsByProject,
        [projectId]: newLists,
      },
    }));

    try {
      // Send the IDs to the backend
      const listIds = newLists.map((l) => l.id);
      await api.patch('/lists/reorder', { listIds });
    } catch (err) {
      console.error('Failed to save list order', err);
      // Optional: revert on failure by re-fetching
    }
  },
  clear: () => set({ listsByProject: {}, loading: false, error: null }),
}));
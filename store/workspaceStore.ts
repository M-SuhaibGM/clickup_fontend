// frontend/store/workspaceStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { toast } from 'sonner'; // ← Import toast

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  _count?: { members: number; projects: number };
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  pendingTaskCount: number;
  
  fetchWorkspaces: () => Promise<void>;
  fetchPendingTaskCount: (workspaceId: string) => Promise<void>;
  setActiveWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  clear: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspace: null,
      loading: false,
      pendingTaskCount: 0,

      fetchWorkspaces: async () => {
        set({ loading: true });
        try {
          const { data } = await api.get<{ workspaces: Workspace[] }>('/workspaces');
          const currentActive = get().activeWorkspace;
          const activeExists = data.workspaces.some((w) => w.id === currentActive?.id);
          
          set({ 
            workspaces: data.workspaces, 
            loading: false,
            activeWorkspace: activeExists ? currentActive : (data.workspaces[0] ?? null)
          });
        } catch (err: any) {
          console.error('Failed to fetch workspaces', err);
          set({ loading: false });
          // Only show error toast if it's not a 401 (handled by interceptor)
          if (err?.response?.status !== 401) {
            toast.error('Failed to load workspaces');
          }
        }
      },

      fetchPendingTaskCount: async (workspaceId) => {
        try {
          const { data } = await api.get<{ count: number }>(`/workspaces/${workspaceId}/pending-task-count`);
          set({ pendingTaskCount: data.count });
        } catch (err) {
          console.error('Failed to fetch pending task count', err);
          // Silent fail — this is a background task, don't spam the user
        }
      },

      setActiveWorkspace: (workspace) => {
        set({ activeWorkspace: workspace });
        // Show toast when switching workspaces
        toast.success(`Switched to ${workspace.name}`);
        get().fetchPendingTaskCount(workspace.id);
      },

      createWorkspace: async (name) => {
        try {
          const { data } = await api.post<{ workspace: Workspace }>('/workspaces', { name });
          set((s) => ({ 
            workspaces: [...s.workspaces, data.workspace], 
            activeWorkspace: data.workspace 
          }));
          toast.success(`Workspace "${data.workspace.name}" created`);
          return data.workspace;
        } catch (err: any) {
          const message = err?.response?.data?.error ?? 'Failed to create workspace';
          toast.error(message);
          throw err;
        }
      },

      clear: () => {
        set({ workspaces: [], activeWorkspace: null, loading: false, pendingTaskCount: 0 });
      },
    }),
    {
      name: 'workspace-store',
      partialize: (state) => ({ activeWorkspace: state.activeWorkspace }),
    }
  )
);
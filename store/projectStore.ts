import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Project, CreateProjectInput } from '@/types/project';
import type { List } from '@/types/list'; // ← Import List type

interface ProjectState {
  projects: Project[];
  listsByProject: Record<string, List[]>; // ← ADD
  loading: boolean;
  error: string | null;

  fetchProjects: (workspaceId: string) => Promise<void>;
  fetchProjectLists: (projectId: string) => Promise<void>; // ← ADD
  createProject: (workspaceId: string, input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, input: Partial<CreateProjectInput>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectListCount: (projectId: string, amount: number) => void;
  clear: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  listsByProject: {}, // ← ADD
  loading: false,
  error: null,

  fetchProjects: async (workspaceId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<{ projects: Project[] }>(`/workspaces/${workspaceId}/projects`);
      set({ projects: data.projects, loading: false });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to load projects', loading: false });
    }
  },

  // ← ADD THIS FUNCTION
  fetchProjectLists: async (projectId) => {
    try {
      const { data } = await api.get<{ lists: List[] }>(`/projects/${projectId}/lists`);
      set((s) => ({
        listsByProject: {
          ...s.listsByProject,
          [projectId]: data.lists,
        },
      }));
    } catch (err) {
      console.error('Failed to fetch lists', err);
    }
  },

  createProject: async (workspaceId, input) => {
    const { data } = await api.post<{ project: Project }>(`/workspaces/${workspaceId}/projects`, input);
    set({ projects: [data.project, ...get().projects] });
    return data.project;
  },

  updateProject: async (id, input) => {
    const { data } = await api.patch<{ project: Project }>(`/projects/${id}`, input);
    set({
      projects: get().projects.map((p) => (p.id === id ? data.project : p)),
    });
    return data.project;
  },

  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set({ projects: get().projects.filter((p) => p.id !== id) });
  },

  updateProjectListCount: (projectId, amount) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            _count: {
              ...p._count,
              lists: Math.max(0, (p._count?.lists ?? 0) + amount),
            },
          };
        }
        return p;
      }),
    }));
  },

  clear: () => set({ projects: [], listsByProject: {}, loading: false, error: null }), // ← Clear lists too
}));
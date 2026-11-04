import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Project, CreateProjectInput } from '@/types/project';

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, input: Partial<CreateProjectInput>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectListCount: (projectId: string, amount: number) => void; // ← ADDED
  clear: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<{ projects: Project[] }>('/projects');
      set({ projects: data.projects, loading: false });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to load projects', loading: false });
    }
  },

  createProject: async (input) => {
    const { data } = await api.post<{ project: Project }>('/projects', input);
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

  // THIS IS THE NEW FUNCTION TO UPDATE LIST COUNT INSTANTLY
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

  clear: () => set({ projects: [], loading: false, error: null }),
}));
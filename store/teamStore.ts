import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Team } from '@/types/team';

// A slower response for a workspace the user already switched away from must not overwrite the current one.
let latestRequest: string | null = null;

interface TeamState {
  teams: Team[];
  loading: boolean;
  /** true once the first fetch for the current workspace has finished */
  loaded: boolean;

  fetchTeams: (workspaceId: string) => Promise<void>;
  createTeam: (workspaceId: string, input: { name: string; color?: string; icon?: string | null; description?: string }) => Promise<Team>;
  updateTeam: (id: string, input: { name?: string; color?: string; icon?: string | null; description?: string | null }) => Promise<Team>;
  deleteTeam: (id: string) => Promise<void>;
  addMember: (teamId: string, userId: string) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
  clear: () => void;
}

export const useTeamStore = create<TeamState>((set) => {
  const replace = (team: Team) => set((s) => ({ teams: s.teams.map((t) => (t.id === team.id ? team : t)) }));

  return {
    teams: [],
    loading: false,
    loaded: false,

    fetchTeams: async (workspaceId) => {
      latestRequest = workspaceId;
      set({ loading: true });
      try {
        const { data } = await api.get<{ teams: Team[] }>(`/workspaces/${workspaceId}/teams`);
        if (latestRequest !== workspaceId) return;
        set({ teams: data.teams, loading: false, loaded: true });
      } catch (err) {
        console.error('Failed to fetch teams', err);
        if (latestRequest === workspaceId) set({ loading: false, loaded: true });
      }
    },

    createTeam: async (workspaceId, input) => {
      const { data } = await api.post<{ team: Team }>(`/workspaces/${workspaceId}/teams`, input);
      set((s) => ({ teams: [...s.teams, data.team] }));
      return data.team;
    },

    updateTeam: async (id, input) => {
      const { data } = await api.patch<{ team: Team }>(`/teams/${id}`, input);
      replace(data.team);
      return data.team;
    },

    deleteTeam: async (id) => {
      await api.delete(`/teams/${id}`);
      set((s) => ({ teams: s.teams.filter((t) => t.id !== id) }));
    },

    addMember: async (teamId, userId) => {
      const { data } = await api.post<{ team: Team }>(`/teams/${teamId}/members`, { userId });
      replace(data.team);
    },

    removeMember: async (teamId, userId) => {
      const { data } = await api.delete<{ team: Team }>(`/teams/${teamId}/members/${userId}`);
      replace(data.team);
    },

    clear: () => set({ teams: [], loading: false, loaded: false }),
  };
});

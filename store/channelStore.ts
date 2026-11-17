import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Channel, ChannelMessage } from '@/types/channel';

interface ChannelState {
  channels: Record<string, Channel>;          // keyed by projectId
  messages: Record<string, ChannelMessage[]>; // keyed by projectId
  loaded: Record<string, boolean>;
  hasMore: Record<string, boolean>;

  fetchChannel: (projectId: string) => Promise<void>;
  loadOlder: (projectId: string) => Promise<void>;
  sendMessage: (projectId: string, text: string) => Promise<void>;
  receive: (projectId: string, message: ChannelMessage) => void;
  reset: () => void;
}

const merge = (existing: ChannelMessage[], incoming: ChannelMessage) =>
  existing.some((m) => m.id === incoming.id) ? existing : [...existing, incoming];

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: {},
  messages: {},
  loaded: {},
  hasMore: {},

  fetchChannel: async (projectId) => {
    const { data } = await api.get<{ channel: Channel; messages: ChannelMessage[]; hasMore: boolean }>(
      `/projects/${projectId}/channel/messages`
    );
    set((s) => {
      // Keep anything that arrived over the socket while the request was in flight
      const fetched = new Set(data.messages.map((m) => m.id));
      const extra = (s.messages[projectId] ?? []).filter((m) => !fetched.has(m.id));
      return {
        channels: { ...s.channels, [projectId]: { ...data.channel, projectId } },
        messages: { ...s.messages, [projectId]: [...data.messages, ...extra] },
        loaded: { ...s.loaded, [projectId]: true },
        hasMore: { ...s.hasMore, [projectId]: data.hasMore },
      };
    });
  },

  loadOlder: async (projectId) => {
    const current = get().messages[projectId] ?? [];
    if (!current.length) return;
    const { data } = await api.get<{ messages: ChannelMessage[]; hasMore: boolean }>(
      `/projects/${projectId}/channel/messages`,
      { params: { before: current[0].createdAt } }
    );
    set((s) => {
      const have = new Set((s.messages[projectId] ?? []).map((m) => m.id));
      return {
        messages: {
          ...s.messages,
          [projectId]: [...data.messages.filter((m) => !have.has(m.id)), ...(s.messages[projectId] ?? [])],
        },
        hasMore: { ...s.hasMore, [projectId]: data.hasMore },
      };
    });
  },

  sendMessage: async (projectId, text) => {
    const { data } = await api.post<{ message: ChannelMessage }>(
      `/projects/${projectId}/channel/messages`,
      { text }
    );
    // The socket echo may arrive first — merge() dedupes by id
    get().receive(projectId, data.message);
  },

  receive: (projectId, message) =>
    set((s) => ({ messages: { ...s.messages, [projectId]: merge(s.messages[projectId] ?? [], message) } })),

  reset: () => set({ channels: {}, messages: {}, loaded: {}, hasMore: {} }),
}));

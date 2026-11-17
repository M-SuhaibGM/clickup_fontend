// frontend/store/dmStore.ts
import { create } from 'zustand';
import { api } from '@/lib/api';

export interface DmUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface DirectMessage {
  id: string;
  workspaceId: string;
  senderId: string;
  receiverId: string;
  text: string;
  readAt: string | null;
  createdAt: string;
  sender?: { id: string; name: string; avatar: string | null };
}

interface DmState {
  members: DmUser[];
  unread: Record<string, number>;
  lastMessageAt: Record<string, string>;
  messages: Record<string, DirectMessage[]>; // keyed by the other user's id
  loaded: Record<string, boolean>;
  activeChatUserId: string | null;

  fetchMembers: (workspaceId: string) => Promise<void>;
  fetchSummary: (workspaceId: string) => Promise<void>;
  fetchConversation: (workspaceId: string, userId: string) => Promise<void>;
  sendMessage: (workspaceId: string, userId: string, text: string) => Promise<void>;
  markRead: (workspaceId: string, userId: string) => Promise<void>;
  receive: (message: DirectMessage, currentUserId: string) => void;
  setActiveChat: (userId: string | null) => void;
  reset: () => void;
}

const otherOf = (m: DirectMessage, me: string) => (m.senderId === me ? m.receiverId : m.senderId);

const merge = (existing: DirectMessage[], incoming: DirectMessage) =>
  existing.some((m) => m.id === incoming.id) ? existing : [...existing, incoming];

export const useDmStore = create<DmState>((set, get) => ({
  members: [],
  unread: {},
  lastMessageAt: {},
  messages: {},
  loaded: {},
  activeChatUserId: null,

  fetchMembers: async (workspaceId) => {
    try {
      const { data } = await api.get<{ workspace: { members: { user: DmUser }[] } }>(
        `/workspaces/${workspaceId}`
      );
      set({ members: data.workspace.members.map((m) => m.user) });
    } catch (err) {
      console.error('Failed to fetch workspace members', err);
    }
  },

  fetchSummary: async (workspaceId) => {
    try {
      const { data } = await api.get<{
        unread: Record<string, number>;
        lastMessageAt: Record<string, string>;
      }>(`/workspaces/${workspaceId}/dm`);
      set({ unread: data.unread, lastMessageAt: data.lastMessageAt });
    } catch (err) {
      console.error('Failed to fetch DM summary', err);
    }
  },

  fetchConversation: async (workspaceId, userId) => {
    const { data } = await api.get<{ messages: DirectMessage[] }>(
      `/workspaces/${workspaceId}/dm/${userId}`
    );
    set((s) => {
      // Keep anything that arrived over the socket while the request was in flight
      const fetchedIds = new Set(data.messages.map((m) => m.id));
      const extra = (s.messages[userId] ?? []).filter((m) => !fetchedIds.has(m.id));
      return {
        messages: { ...s.messages, [userId]: [...data.messages, ...extra] },
        loaded: { ...s.loaded, [userId]: true },
      };
    });
  },

  sendMessage: async (workspaceId, userId, text) => {
    const { data } = await api.post<{ message: DirectMessage }>(
      `/workspaces/${workspaceId}/dm/${userId}`,
      { text }
    );
    // The socket echo may arrive first — merge() dedupes by id
    set((s) => ({
      messages: { ...s.messages, [userId]: merge(s.messages[userId] ?? [], data.message) },
      lastMessageAt: { ...s.lastMessageAt, [userId]: data.message.createdAt },
    }));
  },

  markRead: async (workspaceId, userId) => {
    set((s) => ({ unread: { ...s.unread, [userId]: 0 } }));
    try {
      await api.post(`/workspaces/${workspaceId}/dm/${userId}/read`);
    } catch (err) {
      console.error('Failed to mark messages read', err);
    }
  },

  receive: (message, currentUserId) => {
    const other = otherOf(message, currentUserId);
    const isIncoming = message.receiverId === currentUserId && message.senderId !== currentUserId;
    set((s) => ({
      messages: { ...s.messages, [other]: merge(s.messages[other] ?? [], message) },
      lastMessageAt: { ...s.lastMessageAt, [other]: message.createdAt },
      // Don't bump the badge for a chat the user is looking at right now
      unread:
        isIncoming && s.activeChatUserId !== other
          ? { ...s.unread, [other]: (s.unread[other] ?? 0) + 1 }
          : s.unread,
    }));
  },

  setActiveChat: (userId) => set({ activeChatUserId: userId }),

  reset: () =>
    set({ members: [], unread: {}, lastMessageAt: {}, messages: {}, loaded: {}, activeChatUserId: null }),
}));

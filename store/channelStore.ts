import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Channel, ChannelMessage, Reaction } from '@/types/channel';
import type { Post } from '@/types/post';

interface ChannelState {
  channels: Record<string, Channel>;          // keyed by projectId
  messages: Record<string, ChannelMessage[]>; // keyed by projectId
  posts: Record<string, Post[]>;              // keyed by projectId
  loaded: Record<string, boolean>;
  hasMore: Record<string, boolean>;

  fetchChannel: (projectId: string) => Promise<void>;
  loadOlder: (projectId: string) => Promise<void>;
  sendMessage: (projectId: string, text: string) => Promise<void>;
  receive: (projectId: string, message: ChannelMessage) => void;
  receivePost: (projectId: string, post: Post) => void;
  removeMessage: (projectId: string, messageId: string) => void;
  deleteMessage: (projectId: string, messageId: string) => Promise<void>;
  setReactions: (projectId: string, kind: ReactionTarget, targetId: string, reactions: Reaction[]) => void;
  react: (projectId: string, kind: ReactionTarget, targetId: string, emoji: string, userId: string) => Promise<void>;
  removePost: (projectId: string, postId: string) => void;
  reset: () => void;
}

export type ReactionTarget = 'message' | 'post';

const merge = <T extends { id: string }>(existing: T[], incoming: T) =>
  existing.some((m) => m.id === incoming.id) ? existing : [...existing, incoming];

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: {},
  messages: {},
  posts: {},
  loaded: {},
  hasMore: {},

  fetchChannel: async (projectId) => {
    const { data } = await api.get<{ channel: Channel; messages: ChannelMessage[]; posts?: Post[]; hasMore: boolean }>(
      `/projects/${projectId}/channel/messages`
    );
    set((s) => {
      // Keep anything that arrived over the socket while the request was in flight
      const fetched = new Set(data.messages.map((m) => m.id));
      const extra = (s.messages[projectId] ?? []).filter((m) => !fetched.has(m.id));
      const fetchedPosts = new Set((data.posts ?? []).map((p) => p.id));
      const extraPosts = (s.posts[projectId] ?? []).filter((p) => !fetchedPosts.has(p.id));
      return {
        channels: { ...s.channels, [projectId]: { ...data.channel, projectId } },
        messages: { ...s.messages, [projectId]: [...data.messages, ...extra] },
        posts: { ...s.posts, [projectId]: [...(data.posts ?? []), ...extraPosts] },
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

  receivePost: (projectId, post) =>
    set((s) => ({ posts: { ...s.posts, [projectId]: merge(s.posts[projectId] ?? [], post) } })),

  removeMessage: (projectId, messageId) =>
    set((s) => ({ messages: { ...s.messages, [projectId]: (s.messages[projectId] ?? []).filter((m) => m.id !== messageId) } })),

  deleteMessage: async (projectId, messageId) => {
    await api.delete(`/projects/${projectId}/channel/messages/${messageId}`);
    get().removeMessage(projectId, messageId);
  },

  setReactions: (projectId, kind, targetId, reactions) =>
    set((s) =>
      kind === 'message'
        ? { messages: { ...s.messages, [projectId]: (s.messages[projectId] ?? []).map((m) => (m.id === targetId ? { ...m, reactions } : m)) } }
        : { posts: { ...s.posts, [projectId]: (s.posts[projectId] ?? []).map((p) => (p.id === targetId ? { ...p, reactions } : p)) } }
    ),

  // Optimistic: flip the reaction now, then take the server's list (which is also what everyone else gets)
  react: async (projectId, kind, targetId, emoji, userId) => {
    const current = () =>
      (kind === 'message'
        ? get().messages[projectId]?.find((m) => m.id === targetId)?.reactions
        : get().posts[projectId]?.find((p) => p.id === targetId)?.reactions) ?? [];
    const flip = (list: Reaction[]) =>
      list.some((r) => r.emoji === emoji && r.userId === userId)
        ? list.filter((r) => !(r.emoji === emoji && r.userId === userId))
        : [...list, { emoji, userId }];

    const before = current();
    get().setReactions(projectId, kind, targetId, flip(before));
    try {
      const { data } = await api.post<{ reactions: Reaction[] }>(`/projects/${projectId}/channel/reactions`, { targetType: kind, targetId, emoji });
      get().setReactions(projectId, kind, targetId, data.reactions);
    } catch (err) {
      get().setReactions(projectId, kind, targetId, before);
      throw err;
    }
  },

  removePost: (projectId, postId) =>
    set((s) => ({ posts: { ...s.posts, [projectId]: (s.posts[projectId] ?? []).filter((p) => p.id !== postId) } })),

  reset: () => set({ channels: {}, messages: {}, posts: {}, loaded: {}, hasMore: {} }),
}));

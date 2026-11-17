import { create } from 'zustand';
import { api } from '@/lib/api';
import type { CreatePostInput, Post, PostFilters } from '@/types/post';

// Only the newest request may write results (filters can change mid-flight)
let latestRequest = 0;

interface PostState {
  posts: Post[];
  loaded: boolean;
  loading: boolean;
  error: string | null;

  fetchPosts: (workspaceId: string, filters: PostFilters) => Promise<void>;
  createPost: (workspaceId: string, input: CreatePostInput) => Promise<Post>;
  deletePost: (id: string) => Promise<void>;
  reset: () => void;
}

export const usePostStore = create<PostState>((set) => ({
  posts: [],
  loaded: false,
  loading: false,
  error: null,

  fetchPosts: async (workspaceId, filters) => {
    const request = ++latestRequest;
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<{ posts: Post[] }>(`/workspaces/${workspaceId}/posts`, {
        params: filters,
      });
      if (request !== latestRequest) return;
      set({ posts: data.posts, loaded: true, loading: false });
    } catch {
      if (request !== latestRequest) return;
      set({ loading: false, loaded: true, error: 'Failed to load posts' });
    }
  },

  createPost: async (workspaceId, input) => {
    const { data } = await api.post<{ post: Post }>(`/workspaces/${workspaceId}/posts`, input);
    return data.post;
  },

  deletePost: async (id) => {
    await api.delete(`/posts/${id}`);
    set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
  },

  reset: () => {
    latestRequest++;
    set({ posts: [], loaded: false, loading: false, error: null });
  },
}));

export type PostType = 'ANNOUNCEMENT' | 'UPDATE' | 'DISCUSSION' | 'QUESTION';

export interface Post {
  id: string;
  channelId: string;
  authorId: string;
  type: PostType;
  title: string | null;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null };
  channel: { id: string; name: string; projectId: string };
  reactions?: { emoji: string; userId: string }[];
}

export interface PostFilters {
  channelId?: string;
  authorId?: string;
  type?: PostType;
  sort: 'newest' | 'oldest';
}

export interface CreatePostInput {
  channelId: string;
  type: PostType;
  title?: string;
  content: string;
}

import { CircleHelp, Megaphone, MessageSquare, Newspaper, type LucideIcon } from 'lucide-react';
import type { PostType } from '@/types/post';

export const POST_TYPES: Record<
  PostType,
  { label: string; icon: LucideIcon; color: string; placeholder: string }
> = {
  ANNOUNCEMENT: { label: 'Announcement', icon: Megaphone, color: '#ef4444', placeholder: 'Share an announcement...' },
  UPDATE: { label: 'Update', icon: Newspaper, color: '#3b82f6', placeholder: 'Share an update...' },
  DISCUSSION: { label: 'Discussion', icon: MessageSquare, color: '#10b981', placeholder: 'Start a discussion...' },
  QUESTION: { label: 'Question', icon: CircleHelp, color: '#f59e0b', placeholder: 'Ask a question...' },
};

export const POST_TYPE_KEYS = Object.keys(POST_TYPES) as PostType[];

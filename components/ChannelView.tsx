'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CornerUpLeft, Copy, Hash, Loader2, Search, Send, Smile, SmilePlus, ThumbsUp, Trash2, Users, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { connectSocket } from '@/lib/socket';
import { apiError } from '@/lib/apiError';
import { POST_TYPES, POST_TYPE_KEYS } from '@/lib/postTypes';
import { useAuthStore } from '@/store/authStore';
import { useChannelStore, type ReactionTarget } from '@/store/channelStore';
import { usePostStore } from '@/store/postStore';
import { useUserStore } from '@/store/userStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { ChannelMessage, Reaction } from '@/types/channel';
import type { Post, PostType } from '@/types/post';
import UserAvatar from './UserAvatar';

const EMPTY: ChannelMessage[] = [];
const EMPTY_POSTS: Post[] = [];

// Must match the server's allow-list
const REACTION_EMOJI = ['👍', '✅', '🔥', '❤️', '😂', '🎉', '👀', '🙏'];
const QUICK = REACTION_EMOJI.slice(0, 3);
// Plain-text emoji for the composer (any character is fine there)
const COMPOSER_EMOJI = [...REACTION_EMOJI, '😀', '😅', '🙂', '😎', '🤔', '😢', '💯', '🚀', '👏', '👌', '💪', '✨'];

type FeedItem =
  | { kind: 'message'; id: string; createdAt: string; message: ChannelMessage }
  | { kind: 'post'; id: string; createdAt: string; post: Post };
type Mode = 'message' | 'post';

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** [{emoji, count, mine}] in first-reacted order. */
function summarize(reactions: Reaction[] | undefined, myId?: string) {
  const out: { emoji: string; count: number; mine: boolean }[] = [];
  for (const r of reactions ?? []) {
    const row = out.find((x) => x.emoji === r.emoji);
    if (row) {
      row.count++;
      row.mine ||= r.userId === myId;
    } else out.push({ emoji: r.emoji, count: 1, mine: r.userId === myId });
  }
  return out;
}

const iconBtn =
  'flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-333438)] hover:text-[color:var(--c-white)] transition';

/** The project's single channel. Its name is always the project's name. */
export default function ChannelView({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);
  const isAdmin = useWorkspaceStore((s) => s.activeWorkspace?.role === 'ADMIN');
  const memberCount = useUserStore((s) => s.users.length);
  const channel = useChannelStore((s) => s.channels[projectId]);
  const channelName = channel?.name ?? projectName;
  const messages = useChannelStore((s) => s.messages[projectId]) ?? EMPTY;
  const posts = useChannelStore((s) => s.posts[projectId]) ?? EMPTY_POSTS;
  const loaded = useChannelStore((s) => !!s.loaded[projectId]);
  const hasMore = useChannelStore((s) => !!s.hasMore[projectId]);

  const [mode, setMode] = useState<Mode>('message');
  const [text, setText] = useState('');
  const [postType, setPostType] = useState<PostType>('ANNOUNCEMENT');
  const [postTitle, setPostTitle] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null); // `${kind}:${id}` of the open reaction picker
  const [composerEmoji, setComposerEmoji] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const scroller = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);

  // Load history
  useEffect(() => {
    useChannelStore.getState().fetchChannel(projectId).catch((err) => setError(apiError(err, 'Failed to load channel')));
  }, [projectId]);

  // Live updates. The server broadcasts to the `project:<id>` room. Rooms are per-connection, so the
  // room is joined again on EVERY (re)connect — otherwise a dropped connection silently stops updates.
  useEffect(() => {
    const socket = connectSocket();
    const store = () => useChannelStore.getState();
    const mine = (p: { projectId: string }) => p.projectId === projectId;

    const join = () => socket.emit('join:project', projectId);
    join();

    const onMessage = (p: { projectId: string; message: ChannelMessage }) => mine(p) && store().receive(projectId, p.message);
    const onMessageDeleted = (p: { projectId: string; id: string }) => mine(p) && store().removeMessage(projectId, p.id);
    const onPost = (p: { projectId: string; post: Post }) => mine(p) && store().receivePost(projectId, p.post);
    const onPostDeleted = (p: { projectId: string; id: string }) => mine(p) && store().removePost(projectId, p.id);
    const onReaction = (p: { projectId: string; targetType: ReactionTarget; targetId: string; reactions: Reaction[] }) =>
      mine(p) && store().setReactions(projectId, p.targetType, p.targetId, p.reactions);
    // Catch up on anything sent while the socket was offline
    const onReconnect = () => store().fetchChannel(projectId).catch(() => {});

    socket.on('connect', join);
    socket.on('channel:message', onMessage);
    socket.on('channel:message-deleted', onMessageDeleted);
    socket.on('channel:post', onPost);
    socket.on('channel:post-deleted', onPostDeleted);
    socket.on('channel:reaction', onReaction);
    socket.io.on('reconnect', onReconnect);
    return () => {
      socket.off('connect', join);
      socket.off('channel:message', onMessage);
      socket.off('channel:message-deleted', onMessageDeleted);
      socket.off('channel:post', onPost);
      socket.off('channel:post-deleted', onPostDeleted);
      socket.off('channel:reaction', onReaction);
      socket.io.off('reconnect', onReconnect);
    };
  }, [projectId]);

  // Messages and posts share one chronological feed
  const feed = useMemo<FeedItem[]>(() => {
    const all = [
      ...messages.map((message): FeedItem => ({ kind: 'message', id: message.id, createdAt: message.createdAt, message })),
      ...posts.map((post): FeedItem => ({ kind: 'post', id: post.id, createdAt: post.createdAt, post })),
    ].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((i) =>
      (i.kind === 'message'
        ? `${i.message.text} ${i.message.sender?.name ?? ''}`
        : `${i.post.title ?? ''} ${i.post.content} ${i.post.author?.name ?? ''}`
      ).toLowerCase().includes(q)
    );
  }, [messages, posts, query]);

  // Follow new items only while the reader is already at the bottom
  useEffect(() => {
    if (stickToBottom.current) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [feed.length, loaded]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadOlder = async () => {
    const el = scroller.current;
    const prevHeight = el?.scrollHeight ?? 0;
    setLoadingOlder(true);
    stickToBottom.current = false;
    try {
      await useChannelStore.getState().loadOlder(projectId);
      requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - prevHeight; });
    } catch {
      toast.error('Failed to load earlier messages');
    } finally {
      setLoadingOlder(false);
    }
  };

  // ── Actions ──
  const react = async (kind: ReactionTarget, id: string, emoji: string) => {
    if (!me) return;
    setPickerFor(null);
    try {
      await useChannelStore.getState().react(projectId, kind, id, emoji, me.id);
    } catch (err) {
      toast.error(apiError(err, 'Failed to react'));
    }
  };

  const quoteReply = (author: string, body: string) => {
    setMode('message');
    const snippet = body.replace(/\s+/g, ' ').slice(0, 120);
    setText((t) => `> ${author}: ${snippet}\n\n${t}`);
    requestAnimationFrame(() => composerRef.current?.focus());
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const removeMessage = async (m: ChannelMessage) => {
    if (!confirm('Delete this message?')) return;
    try {
      await useChannelStore.getState().deleteMessage(projectId, m.id);
    } catch (err) {
      toast.error(apiError(err, 'Failed to delete message'));
    }
  };

  const removePost = async (post: Post) => {
    if (!confirm('Delete this post?')) return;
    try {
      await usePostStore.getState().deletePost(post.id);
      useChannelStore.getState().removePost(projectId, post.id);
    } catch (err) {
      toast.error(apiError(err, 'Failed to delete post'));
    }
  };

  const send = async () => {
    if (sending) return;
    if (mode === 'message') {
      const value = text.trim();
      if (!value) return;
      setSending(true);
      stickToBottom.current = true;
      try {
        await useChannelStore.getState().sendMessage(projectId, value);
        setText('');
      } catch (err) {
        toast.error(apiError(err, 'Failed to send message'));
      } finally {
        setSending(false);
      }
      return;
    }

    const content = text.trim();
    if (!content) return;
    if (!workspaceId || !channel) return toast.error('The channel is still loading');
    setSending(true);
    stickToBottom.current = true;
    try {
      const post = await usePostStore.getState().createPost(workspaceId, { channelId: channel.id, type: postType, title: postTitle.trim() || undefined, content });
      useChannelStore.getState().receivePost(projectId, post); // the socket echo is deduped by id
      setText('');
      setPostTitle('');
      setMode('message');
    } catch (err) {
      toast.error(apiError(err, 'Failed to publish post'));
    } finally {
      setSending(false);
    }
  };

  // ── Pieces ──
  const reactionPicker = (target: string) =>
    pickerFor === target ? (
      <>
        <div className="fixed inset-0 z-20" onClick={() => setPickerFor(null)} />
        <div className="absolute right-0 top-full z-30 mt-1 grid grid-cols-4 gap-1 rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] p-1.5 shadow-2xl">
          {REACTION_EMOJI.map((e) => (
            <PickerEmoji key={e} emoji={e} target={target} onPick={react} />
          ))}
        </div>
      </>
    ) : null;

  const pills = (kind: ReactionTarget, id: string, reactions: Reaction[] | undefined, extra?: React.ReactNode) => {
    const list = summarize(reactions, me?.id);
    if (!list.length && !extra) return null;
    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {list.map((r) => (
          <button
            key={r.emoji}
            onClick={() => react(kind, id, r.emoji)}
            className={`flex h-7 items-center gap-1.5 rounded-full border px-2 text-[12.5px] transition ${
              r.mine
                ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-200'
                : 'border-[color:var(--c-333438)] text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]'
            }`}
          >
            <span>{r.emoji}</span> <span>{r.count}</span>
          </button>
        ))}
        {extra}
      </div>
    );
  };

  const hoverBar = (kind: ReactionTarget, id: string, opts: { author: string; body: string; canDelete: boolean; onDelete: () => void }) => {
    const key = `${kind}:${id}`;
    return (
      <div className={`absolute right-4 top-1 z-10 items-center gap-0.5 rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] p-0.5 shadow-lg ${pickerFor === key ? 'flex' : 'hidden group-hover/item:flex'}`}>
        {QUICK.map((e) => (
          <button key={e} onClick={() => react(kind, id, e)} aria-label={`React ${e}`} className={`${iconBtn} text-[15px]`}>{e}</button>
        ))}
        <div className="relative">
          <button onClick={() => setPickerFor(pickerFor === key ? null : key)} aria-label="Add reaction" title="Add reaction" className={iconBtn}>
            <SmilePlus className="h-4 w-4" />
          </button>
          {reactionPicker(key)}
        </div>
        <button onClick={() => quoteReply(opts.author, opts.body)} aria-label="Reply" title="Reply" className={iconBtn}>
          <CornerUpLeft className="h-4 w-4" />
        </button>
        <button onClick={() => copy(opts.body)} aria-label="Copy text" title="Copy text" className={iconBtn}>
          <Copy className="h-4 w-4" />
        </button>
        {opts.canDelete && (
          <button onClick={opts.onDelete} aria-label="Delete" title="Delete" className={`${iconBtn} hover:!text-red-400`}>
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  const canSend = !!text.trim();

  return (
    <div className="relative flex h-[calc(100vh-10.5rem)] min-h-[420px] flex-col">
      {/* Top strip */}
      <div className="flex shrink-0 items-center gap-2 pb-2">
        <button
          onClick={() => toast.info('Bookmarks and notes are coming soon')}
          className="rounded-full border border-[color:var(--c-333438)] px-3 py-1 text-[12.5px] text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)] transition"
        >
          Add bookmarks, notes, and more
        </button>
        {searchOpen && (
          <div className="flex items-center gap-1.5 rounded-full border border-[color:var(--c-333438)] px-3 py-1">
            <Search className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && (setQuery(''), setSearchOpen(false))}
              placeholder={`Search #${channelName}`}
              className="w-48 bg-transparent text-[12.5px] text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
            />
            <button onClick={() => { setQuery(''); setSearchOpen(false); }} aria-label="Close search" className="text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Side rail */}
      <div className="absolute right-1 top-12 z-10 flex flex-col items-center gap-1 rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] p-1.5">
        <span title={`${memberCount} member${memberCount === 1 ? '' : 's'}`} className="flex flex-col items-center gap-0.5 py-0.5 text-[11px] text-[color:var(--c-8a8c91)]">
          <Users className="h-4 w-4" /> {memberCount}
        </span>
        <button onClick={() => setSearchOpen((v) => !v)} aria-label="Search channel" title="Search" className={`${iconBtn} ${searchOpen ? '!bg-[color:var(--c-333438)] !text-[color:var(--c-white)]' : ''}`}>
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Feed */}
      <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto pr-12 custom-scrollbar">
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        {!error && !loaded && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[color:var(--c-8a8c91)]" />
          </div>
        )}
        {!error && loaded && hasMore && !query && (
          <div className="flex justify-center pb-2">
            <button onClick={loadOlder} disabled={loadingOlder} className="text-xs text-indigo-400 hover:underline disabled:opacity-50">
              {loadingOlder ? 'Loading…' : 'Load earlier messages'}
            </button>
          </div>
        )}
        {!error && loaded && feed.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            {query ? (
              <p className="text-sm text-[color:var(--c-8a8c91)]">No messages match &quot;{query}&quot;</p>
            ) : (
              <>
                <Hash className="mb-1 h-8 w-8 text-[color:var(--c-8a8c91)]" />
                <p className="text-sm font-medium text-[color:var(--c-white)]">Welcome to {channelName}</p>
                <p className="text-xs text-[color:var(--c-8a8c91)]">This is the start of the channel for this project.</p>
              </>
            )}
          </div>
        )}

        {feed.map((item, i) => {
          const prev = feed[i - 1];
          const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(item.createdAt).toDateString();
          const divider = newDay && (
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-x-0 border-t border-[color:var(--c-333438)]" />
              <span className="relative rounded-full border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] px-3 py-0.5 text-[12px] font-semibold text-[color:var(--c-e5e5e5)]">
                {dayLabel(item.createdAt)}
              </span>
            </div>
          );

          if (item.kind === 'post') {
            const post = item.post;
            const t = POST_TYPES[post.type] ?? POST_TYPES.ANNOUNCEMENT;
            const TypeIcon = t.icon;
            const name = post.authorId === me?.id ? 'You' : post.author?.name ?? 'Unknown';
            const hasThumb = (post.reactions ?? []).some((r) => r.emoji === '👍');
            const body = `${post.title ? `${post.title}\n` : ''}${post.content}`;
            return (
              <div key={`post-${item.id}`}>
                {divider}
                <div className="group/item relative flex gap-3 px-3 py-2.5 hover:bg-white/[0.03]">
                  {hoverBar('post', post.id, { author: name, body, canDelete: post.authorId === me?.id || isAdmin, onDelete: () => removePost(post) })}
                  <UserAvatar name={post.author?.name ?? '?'} src={post.author?.avatar ?? null} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] leading-none">
                      <span className="font-bold text-[color:var(--c-white)]">{name}</span>
                      <span className="ml-1.5 text-[color:var(--c-8a8c91)]">made a new <span className="font-semibold text-[color:var(--c-e5e5e5)]">Post!</span></span>
                      <span className="ml-2 text-[12px] text-[color:var(--c-8a8c91)]">{timeLabel(post.createdAt)}</span>
                    </p>
                    <div className="mt-2 max-w-[860px] rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] p-4">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--c-333438)] px-2 py-0.5 text-[12px] font-medium text-[color:var(--c-white)]">
                        <TypeIcon className="h-3.5 w-3.5" style={{ color: t.color }} /> {t.label}
                      </span>
                      {post.title && <h3 className="mt-3 text-[20px] font-bold leading-tight text-[color:var(--c-white)]">{post.title}</h3>}
                      <p className={`${post.title ? 'mt-1.5' : 'mt-3'} whitespace-pre-wrap break-words text-[14px] leading-snug text-[color:var(--c-e5e5e5)]`}>{post.content}</p>
                      {pills(
                        'post',
                        post.id,
                        post.reactions,
                        <>
                          {!hasThumb && (
                            <button onClick={() => react('post', post.id, '👍')} aria-label="Like" className="flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--c-333438)] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition">
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => setPickerFor(`post:${post.id}`)} aria-label="Add reaction" className="flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--c-333438)] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition">
                            <SmilePlus className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const m = item.message;
          const mineMsg = m.senderId === me?.id;
          const name = mineMsg ? 'You' : m.sender?.name ?? 'Unknown';
          const grouped =
            !newDay && prev?.kind === 'message' && prev.message.senderId === m.senderId &&
            new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
          return (
            <div key={`msg-${m.id}`}>
              {divider}
              <div className={`group/item relative flex gap-3 px-3 hover:bg-white/[0.04] ${grouped ? 'py-0.5' : 'pb-1 pt-2'}`}>
                {hoverBar('message', m.id, { author: name, body: m.text, canDelete: mineMsg || isAdmin, onDelete: () => removeMessage(m) })}
                <div className="w-8 shrink-0">
                  {!grouped && <UserAvatar name={m.sender?.name ?? '?'} src={m.sender?.avatar ?? null} size={32} />}
                </div>
                <div className="min-w-0 flex-1 pb-0.5">
                  {!grouped && (
                    <p className="mb-0.5 text-[13.5px] leading-tight">
                      <span className="font-bold text-[color:var(--c-white)]">{name}</span>
                      <span className="ml-2 text-[12px] text-[color:var(--c-8a8c91)]">{timeLabel(m.createdAt)}</span>
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words text-[14px] leading-snug text-[color:var(--c-e5e5e5)]">{m.text}</p>
                  {pills('message', m.id, m.reactions)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="mt-2 shrink-0 rounded-2xl bg-[color:var(--c-232426)] p-1.5">
        <div className="flex items-center gap-1 px-1.5 pb-1.5 pt-0.5 text-[12.5px]">
          {(['message', 'post'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-2.5 py-1 font-medium capitalize transition ${mode === m ? 'bg-[color:var(--c-333438)] text-[color:var(--c-white)]' : 'text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'}`}
            >
              {m}
            </button>
          ))}
          <button onClick={() => router.push('/ai')} className="rounded-md px-2.5 py-1 font-medium text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition">
            Ask
          </button>
        </div>

        <div className="rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] px-3 py-2 focus-within:border-[color:var(--c-555660)] transition">
          {mode === 'post' && (
            <div className="mb-2 space-y-2 border-b border-[color:var(--c-2a2b2e)] pb-2">
              <div className="flex flex-wrap gap-1.5">
                {POST_TYPE_KEYS.map((k) => {
                  const Icon = POST_TYPES[k].icon;
                  const on = postType === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setPostType(k)}
                      className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px] transition ${on ? 'border-[color:var(--c-555660)] bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)]' : 'border-[color:var(--c-333438)] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'}`}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: POST_TYPES[k].color }} /> {POST_TYPES[k].label}
                    </button>
                  );
                })}
              </div>
              <input
                value={postTitle}
                maxLength={200}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full bg-transparent text-[15px] font-semibold text-[color:var(--c-white)] outline-none placeholder:font-normal placeholder:text-[color:var(--c-8a8c91)]"
              />
            </div>
          )}

          <textarea
            ref={composerRef}
            value={text}
            rows={mode === 'post' ? 3 : 1}
            maxLength={mode === 'post' ? 10000 : 4000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && mode === 'message') {
                e.preventDefault();
                send();
              }
            }}
            placeholder={mode === 'post' ? POST_TYPES[postType].placeholder : `Write to ${channelName}`}
            className="max-h-40 w-full resize-none bg-transparent py-1 text-[14px] text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
          />

          <div className="mt-1 flex items-center">
            <div className="relative">
              <button onClick={() => setComposerEmoji((v) => !v)} aria-label="Insert emoji" title="Emoji" className={iconBtn}>
                <Smile className="h-4 w-4" />
              </button>
              {composerEmoji && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setComposerEmoji(false)} />
                  <div className="absolute bottom-full left-0 z-30 mb-1 grid w-[216px] grid-cols-6 gap-1 rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] p-1.5 shadow-2xl">
                    {COMPOSER_EMOJI.map((e) => (
                      <button
                        key={e}
                        onClick={() => { setText((t) => t + e); setComposerEmoji(false); composerRef.current?.focus(); }}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[17px] hover:bg-[color:var(--c-333438)]"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <span className="ml-2 hidden text-[11px] text-[color:var(--c-8a8c91)] sm:inline">
              {mode === 'message' ? 'Enter to send · Shift+Enter for a new line' : 'Publishes to everyone in this channel'}
            </span>
            <button
              onClick={send}
              disabled={!canSend || sending}
              aria-label={mode === 'post' ? 'Publish post' : 'Send message'}
              className="ml-auto flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[13px] font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {mode === 'post' && 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PickerEmoji({ emoji, target, onPick }: { emoji: string; target: string; onPick: (kind: ReactionTarget, id: string, emoji: string) => void }) {
  const [kind, id] = target.split(':') as [ReactionTarget, string];
  return (
    <button onClick={() => onPick(kind, id, emoji)} className="flex h-8 w-8 items-center justify-center rounded-md text-[17px] hover:bg-[color:var(--c-333438)]">
      {emoji}
    </button>
  );
}

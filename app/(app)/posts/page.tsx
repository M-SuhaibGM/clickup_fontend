'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Hash, Megaphone, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiError } from '@/lib/apiError';
import { POST_TYPES, POST_TYPE_KEYS } from '@/lib/postTypes';
import { useAuthStore } from '@/store/authStore';
import { useDmStore } from '@/store/dmStore';
import { usePostStore } from '@/store/postStore';
import { useProjectStore } from '@/store/projectStore';
import { useSpaceStore } from '@/store/spaceStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Post, PostFilters, PostType } from '@/types/post';
import Dropdown, { MenuItem } from '@/components/posts/Dropdown';
import UserAvatar from '@/components/UserAvatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MAX_TITLE = 200;
const MAX_CONTENT = 10000;

const timeAgo = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
};

export default function PostsPage() {
  const me = useAuthStore((s) => s.user);
  const workspace = useWorkspaceStore((s) => s.activeWorkspace);
  const projects = useProjectStore((s) => s.projects);
  const spaces = useSpaceStore((s) => s.spaces);
  const members = useDmStore((s) => s.members);
  const { posts, loaded, loading, error } = usePostStore();
  const isAdmin = workspace?.role === 'ADMIN';

  // One channel per project
  const channels = useMemo(
    () =>
      projects
        .filter((p) => p.channel)
        .map((p) => ({
          id: p.channel!.id,
          name: p.channel!.name,
          space: spaces.find((sp) => sp.id === p.spaceId)?.name ?? '',
        })),
    [projects, spaces]
  );

  /* ── Composer ─────────────────────────────────────────── */
  const [channelId, setChannelId] = useState<string>('');
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [type, setType] = useState<PostType>('ANNOUNCEMENT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const selectedChannel = channels.find((c) => c.id === channelId);
  const canPost = !!selectedChannel && !!content.trim() && !posting;
  const TypeIcon = POST_TYPES[type].icon;

  /* ── Filters ──────────────────────────────────────────── */
  const [filters, setFilters] = useState<PostFilters>({ sort: 'newest' });

  /* ── Delete Dialog State ────────────────────────────────── */
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  const workspaceId = workspace?.id;
  useEffect(() => {
    if (!workspaceId) return;
    usePostStore.getState().fetchPosts(workspaceId, filters);
  }, [workspaceId, filters]);

  // A new workspace starts from a clean slate
  useEffect(() => {
    return () => usePostStore.getState().reset();
  }, [workspaceId]);

  const submit = async () => {
    if (!canPost || !workspaceId) return;
    setPosting(true);
    try {
      await usePostStore.getState().createPost(workspaceId, {
        channelId,
        type,
        title: title.trim() || undefined,
        content: content.trim(),
      });
      setTitle('');
      setContent('');
      toast.success(`Posted to #${selectedChannel!.name}`);
      await usePostStore.getState().fetchPosts(workspaceId, filters);
    } catch (err) {
      toast.error(apiError(err, 'Failed to publish post'));
    } finally {
      setPosting(false);
    }
  };

  const startNewPost = () => {
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (!channelId) setChannelMenuOpen(true);
    else titleRef.current?.focus();
  };

  // Opens the shadcn confirmation dialog
  const requestDelete = (post: Post) => {
    setPostToDelete(post);
  };

  // Runs when user confirms deletion
  const confirmDelete = async () => {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      await usePostStore.getState().deletePost(postToDelete.id);
      toast.success('Post deleted');
      setPostToDelete(null);
    } catch (err) {
      toast.error(apiError(err, 'Failed to delete post'));
    } finally {
      setDeleting(false);
    }
  };

  const chip =
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors';
  const chipIdle =
    'border-[color:var(--c-333438)] text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]';
  const chipOn = 'border-indigo-500/60 bg-indigo-500/15 text-indigo-200';
  const field = 'flex items-center gap-2 py-2.5 border-b border-[color:var(--c-333438)]';
  const label = 'text-[14px] text-[color:var(--c-8a8c91)] shrink-0';

  const filterChannel = channels.find((c) => c.id === filters.channelId);
  const filterAuthor = members.find((m) => m.id === filters.authorId);

  return (
    <>
      <div className="h-full flex flex-col text-[color:var(--c-e5e5e5)]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 h-12 border-b border-[color:var(--c-333438)]">
          <h1 className="text-[15px] font-semibold text-[color:var(--c-white)]">Posts</h1>
          <button
            onClick={startNewPost}
            className="rounded-md bg-[color:var(--c-white)] px-3 py-1.5 text-[13px] font-semibold text-[color:var(--c-1e1f21)] hover:opacity-85 transition"
          >
            New Post
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
          <div className="mx-auto max-w-[760px]">
            {/* Composer */}
            <div className="flex gap-3" ref={composerRef}>
              <div className="pt-1 shrink-0">
                <UserAvatar name={me?.name ?? '?'} src={me?.avatar ?? null} size={36} />
              </div>
              <div className="flex-1 min-w-0 rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] px-4 pt-1 pb-3">
                {/* 1. Channel — chosen first */}
                <div className={field}>
                  <span className={label}>Channel:</span>
                  <Dropdown
                    open={channelMenuOpen}
                    onOpenChange={setChannelMenuOpen}
                    triggerClassName="inline-flex items-center gap-1 text-[14px] font-semibold text-[color:var(--c-white)] hover:opacity-80"
                    trigger={
                      <>
                        {selectedChannel ? (
                          <>
                            <Hash className="h-3.5 w-3.5 text-indigo-400" />
                            {selectedChannel.name}
                          </>
                        ) : (
                          'Select Channel'
                        )}
                        <ChevronDown className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" />
                      </>
                    }
                  >
                    {(close) =>
                      channels.length === 0 ? (
                        <p className="px-3 py-3 text-[13px] text-[color:var(--c-8a8c91)]">
                          No channels yet — a channel is created with every project.
                        </p>
                      ) : (
                        channels.map((c) => (
                          <MenuItem key={c.id} active={c.id === channelId} onClick={() => { setChannelId(c.id); close(); setTimeout(() => titleRef.current?.focus(), 0); }}>
                            <Hash className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                            <span className="flex-1 truncate">{c.name}</span>
                            {c.space && <span className="text-[11px] text-[color:var(--c-8a8c91)] truncate max-w-[90px]">{c.space}</span>}
                          </MenuItem>
                        ))
                      )
                    }
                  </Dropdown>
                </div>

                {/* 2. Type */}
                <div className={field}>
                  <span className={label}>Type:</span>
                  <Dropdown
                    triggerClassName="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--c-2a2b2e)] px-2 py-1 text-[13px] text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)] transition"
                    trigger={
                      <>
                        <TypeIcon className="h-3.5 w-3.5" style={{ color: POST_TYPES[type].color }} />
                        {POST_TYPES[type].label}
                        <ChevronDown className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" />
                      </>
                    }
                  >
                    {(close) =>
                      POST_TYPE_KEYS.map((k) => {
                        const Icon = POST_TYPES[k].icon;
                        return (
                          <MenuItem key={k} active={k === type} onClick={() => { setType(k); close(); }}>
                            <Icon className="h-4 w-4" style={{ color: POST_TYPES[k].color }} />
                            {POST_TYPES[k].label}
                          </MenuItem>
                        );
                      })
                    }
                  </Dropdown>
                </div>

                {/* 3. Title */}
                <div className={field}>
                  <label htmlFor="post-title" className={label}>Title:</label>
                  <input
                    id="post-title"
                    ref={titleRef}
                    value={title}
                    maxLength={MAX_TITLE}
                    disabled={!selectedChannel}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-[14px] text-[color:var(--c-white)] outline-none disabled:cursor-not-allowed"
                  />
                </div>

                {/* 4. Body */}
                <textarea
                  value={content}
                  maxLength={MAX_CONTENT}
                  disabled={!selectedChannel}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  placeholder={selectedChannel ? POST_TYPES[type].placeholder : 'Select a channel to start writing…'}
                  rows={4}
                  className="mt-3 w-full resize-none bg-transparent text-[14px] text-[color:var(--c-white)] placeholder:text-[color:var(--c-8a8c91)] outline-none disabled:cursor-not-allowed"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[color:var(--c-8a8c91)]">
                    {selectedChannel ? 'Ctrl/⌘ + Enter to post' : 'Choose where this post will be published'}
                  </span>
                  <button
                    onClick={submit}
                    disabled={!canPost}
                    className="rounded-md bg-[color:var(--c-white)] px-4 py-1.5 text-[13px] font-semibold text-[color:var(--c-1e1f21)] transition hover:opacity-85 disabled:bg-[color:var(--c-2a2b2e)] disabled:text-[color:var(--c-8a8c91)] disabled:cursor-not-allowed"
                  >
                    {posting ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="my-5 -mx-4 border-t border-[color:var(--c-333438)]" />

          <div className="mx-auto max-w-[900px]">
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Dropdown
                  triggerClassName={`${chip} ${filters.channelId ? chipOn : chipIdle}`}
                  trigger={
                    <>
                      <Hash className="h-3.5 w-3.5" />
                      {filterChannel?.name ?? 'Channel'}
                      {filters.channelId && (
                        <X
                          className="h-3.5 w-3.5 opacity-70 hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setFilters((f) => ({ ...f, channelId: undefined })); }}
                        />
                      )}
                    </>
                  }
                >
                  {(close) =>
                    channels.length === 0 ? (
                      <p className="px-3 py-3 text-[13px] text-[color:var(--c-8a8c91)]">No channels yet</p>
                    ) : (
                      channels.map((c) => (
                        <MenuItem key={c.id} active={c.id === filters.channelId} onClick={() => { setFilters((f) => ({ ...f, channelId: c.id })); close(); }}>
                          <Hash className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                          <span className="truncate">{c.name}</span>
                        </MenuItem>
                      ))
                    )
                  }
                </Dropdown>

                <Dropdown
                  triggerClassName={`${chip} ${filters.authorId ? chipOn : chipIdle}`}
                  trigger={
                    <>
                      {filterAuthor ? <UserAvatar name={filterAuthor.name} src={filterAuthor.avatar} size={16} /> : null}
                      {filterAuthor?.name ?? 'Author'}
                      {filters.authorId && (
                        <X
                          className="h-3.5 w-3.5 opacity-70 hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setFilters((f) => ({ ...f, authorId: undefined })); }}
                        />
                      )}
                    </>
                  }
                >
                  {(close) =>
                    members.map((m) => (
                      <MenuItem key={m.id} active={m.id === filters.authorId} onClick={() => { setFilters((f) => ({ ...f, authorId: m.id })); close(); }}>
                        <UserAvatar name={m.name} src={m.avatar} size={20} />
                        <span className="truncate">{m.name}</span>
                      </MenuItem>
                    ))
                  }
                </Dropdown>

                <Dropdown
                  triggerClassName={`${chip} ${filters.type ? chipOn : chipIdle}`}
                  trigger={
                    <>
                      {filters.type ? (() => { const I = POST_TYPES[filters.type].icon; return <I className="h-3.5 w-3.5" style={{ color: POST_TYPES[filters.type].color }} />; })() : null}
                      {filters.type ? POST_TYPES[filters.type].label : 'Type'}
                      {filters.type && (
                        <X
                          className="h-3.5 w-3.5 opacity-70 hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setFilters((f) => ({ ...f, type: undefined })); }}
                        />
                      )}
                    </>
                  }
                >
                  {(close) =>
                    POST_TYPE_KEYS.map((k) => {
                      const Icon = POST_TYPES[k].icon;
                      return (
                        <MenuItem key={k} active={k === filters.type} onClick={() => { setFilters((f) => ({ ...f, type: k })); close(); }}>
                          <Icon className="h-4 w-4" style={{ color: POST_TYPES[k].color }} />
                          {POST_TYPES[k].label}
                        </MenuItem>
                      );
                    })
                  }
                </Dropdown>
              </div>

              <div className="flex items-center gap-1.5 text-[13px] text-[color:var(--c-8a8c91)]">
                Sort:
                <Dropdown
                  align="right"
                  menuClassName="min-w-[140px]"
                  triggerClassName="inline-flex items-center gap-1 rounded-full border border-[color:var(--c-333438)] px-3 py-1.5 text-[13px] text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] transition"
                  trigger={
                    <>
                      {filters.sort === 'newest' ? 'Newest' : 'Oldest'}
                      <ChevronDown className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" />
                    </>
                  }
                >
                  {(close) => (
                    <>
                      <MenuItem active={filters.sort === 'newest'} onClick={() => { setFilters((f) => ({ ...f, sort: 'newest' })); close(); }}>Newest</MenuItem>
                      <MenuItem active={filters.sort === 'oldest'} onClick={() => { setFilters((f) => ({ ...f, sort: 'oldest' })); close(); }}>Oldest</MenuItem>
                    </>
                  )}
                </Dropdown>
              </div>
            </div>

            {/* Feed */}
            <div className="mt-6">
              {error && <p className="text-center text-sm text-red-500">{error}</p>}

              {!error && loaded && posts.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
                  <div className="h-16 w-16 rounded-2xl border-2 border-[color:var(--c-444548)] flex items-center justify-center text-[color:var(--c-8a8c91)]">
                    <Megaphone className="h-7 w-7" />
                  </div>
                  <p className="text-[18px] font-semibold text-[color:var(--c-white)]">
                    {filters.channelId || filters.authorId || filters.type ? 'No posts match these filters' : 'There are no Posts yet!'}
                  </p>
                </div>
              )}

              {!loaded && loading && (
                <div className="space-y-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-28 rounded-xl bg-[color:var(--c-232426)] animate-pulse" />
                  ))}
                </div>
              )}

              <div className={`space-y-3 ${loading && loaded ? 'opacity-60' : ''}`}>
                {posts.map((post) => {
                  const t = POST_TYPES[post.type] ?? POST_TYPES.ANNOUNCEMENT;
                  const Icon = t.icon;
                  const canDelete = post.authorId === me?.id || isAdmin;
                  return (
                    <article
                      key={post.id}
                      className="group rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] p-4"
                    >
                      <header className="flex items-start gap-3">
                        <UserAvatar name={post.author.name} src={post.author.avatar} size={36} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-[14px] font-semibold text-[color:var(--c-white)]">{post.author.name}</span>
                            <span className="text-[12px] text-[color:var(--c-8a8c91)]">in</span>
                            <span className="inline-flex items-center gap-0.5 text-[13px] text-indigo-300">
                              <Hash className="h-3 w-3" />
                              {post.channel.name}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--c-2a2b2e)] px-1.5 py-0.5 text-[11px] text-[color:var(--c-e5e5e5)]">
                              <Icon className="h-3 w-3" style={{ color: t.color }} />
                              {t.label}
                            </span>
                          </div>
                          <p className="text-[12px] text-[color:var(--c-8a8c91)]" title={new Date(post.createdAt).toLocaleString()}>
                            {timeAgo(post.createdAt)}
                          </p>
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => requestDelete(post)}
                            title="Delete post"
                            aria-label="Delete post"
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded text-[color:var(--c-8a8c91)] hover:text-red-400 hover:bg-[color:var(--c-2a2b2e)] transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </header>
                      {post.title && <h2 className="mt-3 text-[16px] font-semibold text-[color:var(--c-white)] break-words">{post.title}</h2>}
                      <p className={`${post.title ? 'mt-1.5' : 'mt-3'} text-[14px] leading-relaxed whitespace-pre-wrap break-words text-[color:var(--c-e5e5e5)]`}>
                        {post.content}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DELETE CONFIRMATION DIALOG ─── */}
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && !deleting && setPostToDelete(null)}>
        <AlertDialogContent className="bg-(--c-1e1f21) border-(--c-333438) text-(--c-white)">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription className="text-(--c-8a8c91)">
              This will permanently delete the post{postToDelete?.title ? ` "${postToDelete.title}"` : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleting} 
              className="bg-(--c-2a2b2e) border-(--c-333438) text-(--c-white) hover:bg-(--c-333438) hover:text-(--c-white)"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
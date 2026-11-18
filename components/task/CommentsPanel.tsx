'use client';

import { useRef, useState } from 'react';
import { AtSign, MessageSquare, Pencil, Send, Smile, Trash2, UserPlus } from 'lucide-react';
import type { Comment } from '@/types/task';
import type { UserSummary } from '@/store/userStore';
import UserAvatar from '../UserAvatar';

const EMOJI = ['👍', '✅', '🔥', '❤️', '😂', '🎉', '👀', '🙏', '💯', '🚀', '🤔', '👏'];

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

interface Props {
  comments: Comment[];
  createdLabel: string;
  me?: { id: string } | null;
  users: UserSummary[];
  /** admins can assign from the empty state */
  canAssign: boolean;
  onAssignMe: () => void;
  onAdd: (text: string) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  onDelete: (id: string) => void;
}

export default function CommentsPanel({ comments, createdLabel, me, users, canAssign, onAssignMe, onAdd, onEdit, onDelete }: Props) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [menu, setMenu] = useState<'mention' | 'emoji' | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  const insert = (value: string) => {
    setText((t) => (t && !/\s$/.test(t) ? `${t} ${value}` : t + value));
    setMenu(null);
    requestAnimationFrame(() => input.current?.focus());
  };

  const send = async () => {
    const value = text.trim();
    if (!value || posting) return;
    setPosting(true);
    try {
      await onAdd(value);
      setText('');
    } catch { /* caller toasted; keep the text */ } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-[color:var(--c-333438)] px-4 py-3">
        <span className="text-sm font-semibold text-[color:var(--c-white)]">Comments</span>
        <span className="text-[12px] text-[color:var(--c-8a8c91)]">Created {createdLabel}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {comments.length === 0 ? (
          <div className="mx-auto max-w-[300px] space-y-2 pt-16 text-center">
            <MessageSquare className="mx-auto mb-1 h-8 w-8 text-[color:var(--c-444548)]" />
            <p className="text-[15px] font-semibold text-[color:var(--c-white)]">Send the first comment</p>
            <p className="pb-2 text-[12.5px] text-[color:var(--c-8a8c91)]">Ask a question, share an update, or loop someone in.</p>
            <button onClick={() => setMenu('mention')} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--c-333438)] py-2 text-[13px] text-[color:var(--c-e5e5e5)] transition hover:bg-[color:var(--c-2a2b2e)]">
              <AtSign className="h-4 w-4" /> Mention a teammate
            </button>
            {canAssign && (
              <button onClick={onAssignMe} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--c-333438)] py-2 text-[13px] text-[color:var(--c-e5e5e5)] transition hover:bg-[color:var(--c-2a2b2e)]">
                <UserPlus className="h-4 w-4" /> Assign this task to me
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => {
              const mine = me?.id === c.userId;
              const isEditing = editing?.id === c.id;
              return (
                <li key={c.id} className="group flex gap-2.5">
                  <UserAvatar name={c.user.name} src={c.user.avatar} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 flex items-center gap-2 text-[12.5px]">
                      <span className="font-semibold text-[color:var(--c-white)]">{mine ? 'You' : c.user.name}</span>
                      <span className="text-[11px] text-[color:var(--c-8a8c91)]">{when(c.createdAt)}</span>
                      {mine && !isEditing && !c.id.startsWith('temp-') && (
                        <span className="ml-auto flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                          <button onClick={() => setEditing({ id: c.id, text: c.text })} aria-label="Edit comment" className="rounded p-1 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={() => onDelete(c.id)} aria-label="Delete comment" className="rounded p-1 text-[color:var(--c-8a8c91)] hover:text-red-400">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </p>
                    {isEditing ? (
                      <div className="space-y-1.5">
                        <textarea
                          autoFocus
                          value={editing.text}
                          rows={2}
                          onChange={(e) => setEditing({ id: c.id, text: e.target.value })}
                          className="w-full resize-none rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] p-2 text-[13px] text-[color:var(--c-white)] outline-none focus:border-indigo-500"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={async () => {
                              try { await onEdit(c.id, editing.text); setEditing(null); } catch { /* caller toasted */ }
                            }}
                            disabled={!editing.text.trim()}
                            className="rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button onClick={() => setEditing(null)} className="px-2 py-1 text-[11px] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[color:var(--c-e5e5e5)]">{c.text}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="relative m-3 mt-0 rounded-2xl bg-[color:var(--c-1e1f21)] p-1.5">
        <div className="px-2 pb-1.5 pt-0.5 text-[12.5px]">
          <span className="rounded-md bg-[color:var(--c-2a2b2e)] px-2.5 py-1 font-medium text-[color:var(--c-white)]">Comment</span>
        </div>
        <div className="rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] px-3 py-2 transition focus-within:border-[color:var(--c-555660)]">
          <textarea
            ref={input}
            value={text}
            rows={2}
            maxLength={4000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Write a comment"
            className="w-full resize-none bg-transparent text-[13px] text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
          />
          <div className="flex items-center gap-0.5">
            <button onClick={() => setMenu(menu === 'mention' ? null : 'mention')} aria-label="Mention a teammate" title="Mention" className="rounded-md p-1.5 text-[color:var(--c-8a8c91)] transition hover:bg-[color:var(--c-333438)] hover:text-[color:var(--c-white)]">
              <AtSign className="h-4 w-4" />
            </button>
            <button onClick={() => setMenu(menu === 'emoji' ? null : 'emoji')} aria-label="Insert emoji" title="Emoji" className="rounded-md p-1.5 text-[color:var(--c-8a8c91)] transition hover:bg-[color:var(--c-333438)] hover:text-[color:var(--c-white)]">
              <Smile className="h-4 w-4" />
            </button>
            <button
              onClick={send}
              disabled={!text.trim() || posting}
              aria-label="Send comment"
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {menu && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMenu(null)} />
            <div className="absolute bottom-full left-3 z-30 mb-1 max-h-56 overflow-y-auto rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] p-1.5 shadow-2xl">
              {menu === 'emoji' ? (
                <div className="grid w-[200px] grid-cols-6 gap-1">
                  {EMOJI.map((e) => (
                    <button key={e} onClick={() => insert(e)} className="flex h-8 w-8 items-center justify-center rounded-md text-[17px] hover:bg-[color:var(--c-333438)]">{e}</button>
                  ))}
                </div>
              ) : (
                <div className="w-56">
                  {users.map((u) => (
                    <button key={u.id} onClick={() => insert(`@${u.name} `)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)]">
                      <UserAvatar name={u.name} src={u.avatar} size={20} /> <span className="truncate">{u.name}</span>
                    </button>
                  ))}
                  {users.length === 0 && <p className="px-2 py-2 text-xs text-[color:var(--c-8a8c91)]">No teammates found.</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

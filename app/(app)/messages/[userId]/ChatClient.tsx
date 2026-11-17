'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useDmStore, type DirectMessage } from '@/store/dmStore';
import UserAvatar from '@/components/UserAvatar';

const EMPTY: DirectMessage[] = [];

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export default function ChatClient() {
  const { userId } = useParams<{ userId: string }>();
  const me = useAuthStore((s) => s.user);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);

  const other = useDmStore((s) => s.members.find((m) => m.id === userId));
  const membersLoaded = useDmStore((s) => s.members.length > 0);
  const messages = useDmStore((s) => s.messages[userId] ?? EMPTY);
  const loaded = useDmStore((s) => !!s.loaded[userId]);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Open the conversation: load history, mark read, track it as the active chat
  useEffect(() => {
    if (!workspaceId || !userId) return;
    const { setActiveChat, fetchConversation, markRead } = useDmStore.getState();
    setActiveChat(userId);
    setError(null);
    fetchConversation(workspaceId, userId)
      .then(() => markRead(workspaceId, userId))
      .catch((err) => setError(err?.response?.data?.error ?? 'Failed to load messages'));
    return () => setActiveChat(null);
  }, [workspaceId, userId]);

  // Stick to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, loaded]);

  const send = async () => {
    const value = text.trim();
    if (!value || sending || !workspaceId) return;
    setSending(true);
    try {
      await useDmStore.getState().sendMessage(workspaceId, userId, value);
      setText('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to send message');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const isSelf = me?.id === userId;
  const title = other ? `${other.name}${isSelf ? ' (You)' : ''}` : 'Direct message';

  if (membersLoaded && !other) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-[color:var(--c-8a8c91)]">
        This person isn&apos;t in the current workspace.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-[color:var(--c-333438)]">
        {other && <UserAvatar name={other.name} src={other.avatar} size={32} />}
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-[color:var(--c-white)] truncate">{title}</h1>
          {other && <p className="text-[12px] text-[color:var(--c-8a8c91)] truncate">{other.email}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        {!error && loaded && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-1">
            <p className="text-[14px] font-medium text-[color:var(--c-white)]">
              {isSelf ? 'This is your personal space' : `Start a conversation with ${other?.name ?? 'them'}`}
            </p>
            <p className="text-[13px] text-[color:var(--c-8a8c91)]">
              {isSelf ? 'Jot down notes and reminders to yourself.' : 'Messages are saved and delivered instantly.'}
            </p>
          </div>
        )}

        <div className="space-y-1">
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
            const mine = m.senderId === me?.id;
            const grouped =
              !newDay && prev && prev.senderId === m.senderId &&
              new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;

            return (
              <div key={m.id}>
                {newDay && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 border-t border-[color:var(--c-333438)]" />
                    <span className="text-[11px] font-medium text-[color:var(--c-8a8c91)]">{dayLabel(m.createdAt)}</span>
                    <div className="flex-1 border-t border-[color:var(--c-333438)]" />
                  </div>
                )}
                <div className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''} ${grouped ? 'mt-0.5' : 'mt-3'}`}>
                  <div className="w-7 shrink-0">
                    {!grouped && (
                      <UserAvatar
                        name={m.sender?.name ?? '?'}
                        src={m.sender?.avatar ?? null}
                        size={28}
                      />
                    )}
                  </div>
                  <div className={`max-w-[75%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    {!grouped && (
                      <span className="text-[11px] text-[color:var(--c-8a8c91)] mb-0.5">
                        {mine ? 'You' : m.sender?.name} · {timeLabel(m.createdAt)}
                      </span>
                    )}
                    <div
                      className={`px-3 py-1.5 rounded-2xl text-[13.5px] leading-snug whitespace-pre-wrap break-words ${
                        mine
                          ? 'bg-indigo-600 text-white rounded-tr-sm'
                          : 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)] rounded-tl-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 px-5 pb-4 pt-2">
        <div className="flex items-end gap-2 rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] px-3 py-2 focus-within:border-[color:var(--c-444548)] transition">
          <textarea
            ref={inputRef}
            value={text}
            rows={1}
            maxLength={4000}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Message ${other?.name ?? ''}`.trim()}
            className="flex-1 resize-none bg-transparent outline-none text-[13.5px] text-[color:var(--c-white)] placeholder:text-[color:var(--c-8a8c91)] max-h-32 py-1"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="shrink-0 p-1.5 rounded-md bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-500 transition"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-[11px] text-[color:var(--c-8a8c91)]">Enter to send · Shift+Enter for a new line</p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Hash, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { connectSocket } from '@/lib/socket';
import { apiError } from '@/lib/apiError';
import { useAuthStore } from '@/store/authStore';
import { useChannelStore } from '@/store/channelStore';
import type { ChannelMessage } from '@/types/channel';
import UserAvatar from './UserAvatar';

const EMPTY: ChannelMessage[] = [];

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

/** The project's single channel. Its name is always the project's name. */
export default function ChannelView({ projectId, projectName }: { projectId: string; projectName: string }) {
  const me = useAuthStore((s) => s.user);
  const channelName = useChannelStore((s) => s.channels[projectId]?.name) ?? projectName;
  const messages = useChannelStore((s) => s.messages[projectId]) ?? EMPTY;
  const loaded = useChannelStore((s) => !!s.loaded[projectId]);
  const hasMore = useChannelStore((s) => !!s.hasMore[projectId]);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Load history
  useEffect(() => {
    useChannelStore.getState().fetchChannel(projectId).catch((err) =>
      setError(apiError(err, 'Failed to load channel'))
    );
  }, [projectId]);

  // Live messages. The server emits to the `project:<id>` room, which this page
  // joins via <SocketProvider projectId>; joining again here is idempotent.
  useEffect(() => {
    const socket = connectSocket();
    socket.emit('join:project', projectId);

    const onMessage = (payload: { projectId: string; message: ChannelMessage }) => {
      if (payload.projectId !== projectId) return;
      useChannelStore.getState().receive(projectId, payload.message);
    };
    // Catch up on anything sent while the socket was offline
    const onReconnect = () => useChannelStore.getState().fetchChannel(projectId).catch(() => {});

    socket.on('channel:message', onMessage);
    socket.io.on('reconnect', onReconnect);
    return () => {
      socket.off('channel:message', onMessage);
      socket.io.off('reconnect', onReconnect);
    };
  }, [projectId]);

  // Follow new messages only while the reader is already at the bottom
  useEffect(() => {
    if (stickToBottom.current) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, loaded]);

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
      // keep the viewport anchored on what the reader was looking at
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch {
      toast.error('Failed to load earlier messages');
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async () => {
    const value = text.trim();
    if (!value || sending) return;
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
  };

  return (
    <div className="flex flex-col h-[calc(100vh-17rem)] min-h-[360px] rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-[color:var(--c-333438)]">
        <Hash className="h-4 w-4 text-indigo-400" />
        <h2 className="text-sm font-semibold text-[color:var(--c-white)] truncate">{channelName}</h2>
      </div>

      <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        {!error && !loaded && (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[color:var(--c-8a8c91)]" />
          </div>
        )}
        {!error && loaded && hasMore && (
          <div className="flex justify-center pb-2">
            <button onClick={loadOlder} disabled={loadingOlder} className="text-xs text-indigo-400 hover:underline disabled:opacity-50">
              {loadingOlder ? 'Loading…' : 'Load earlier messages'}
            </button>
          </div>
        )}
        {!error && loaded && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-1">
            <p className="text-sm font-medium text-[color:var(--c-white)]">Welcome to #{channelName}</p>
            <p className="text-xs text-[color:var(--c-8a8c91)]">This is the start of the channel for this project.</p>
          </div>
        )}

        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
          const grouped =
            !newDay && prev && prev.senderId === m.senderId &&
            new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
          const mine = m.senderId === me?.id;
          return (
            <div key={m.id}>
              {newDay && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 border-t border-[color:var(--c-333438)]" />
                  <span className="text-[11px] font-medium text-[color:var(--c-8a8c91)]">{dayLabel(m.createdAt)}</span>
                  <div className="flex-1 border-t border-[color:var(--c-333438)]" />
                </div>
              )}
              <div className={`flex gap-2.5 ${grouped ? 'mt-0.5' : 'mt-3'}`}>
                <div className="w-7 shrink-0">
                  {!grouped && <UserAvatar name={m.sender?.name ?? '?'} src={m.sender?.avatar ?? null} size={28} />}
                </div>
                <div className="min-w-0 flex-1">
                  {!grouped && (
                    <p className="text-[12px] leading-none mb-1">
                      <span className="font-semibold text-[color:var(--c-white)]">{mine ? 'You' : m.sender?.name ?? 'Unknown'}</span>
                      <span className="ml-2 text-[11px] text-[color:var(--c-8a8c91)]">{timeLabel(m.createdAt)}</span>
                    </p>
                  )}
                  <p className="text-[13.5px] leading-snug text-[color:var(--c-e5e5e5)] whitespace-pre-wrap break-words">{m.text}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-4 pb-3 pt-2">
        <div className="flex items-end gap-2 rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] px-3 py-2 focus-within:border-[color:var(--c-444548)] transition">
          <textarea
            value={text}
            rows={1}
            maxLength={4000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Message #${channelName}`}
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

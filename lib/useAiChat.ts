'use client';

import { useCallback, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '@/lib/api';

export type AiChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
};

/** Shared chat state for the AI page and the AI chat drawer (POST /ai/chat). */
export function useAiChat() {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Refs keep `send` stable and guard against double-submits / stale replies.
  const messagesRef = useRef<AiChatMessage[]>([]);
  const loadingRef = useRef(false);
  const sessionRef = useRef(0);

  const update = useCallback((next: AiChatMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || loadingRef.current) return;

      const session = sessionRef.current;
      // Failed replies are UI-only; never send them back as conversation history.
      const history = messagesRef.current
        .filter((m) => !m.error)
        .map((m) => ({ role: m.role, content: m.content }));

      update([...messagesRef.current, { id: crypto.randomUUID(), role: 'user', content: text }]);
      loadingRef.current = true;
      setLoading(true);

      let reply: AiChatMessage;
      try {
        const { data } = await api.post<{ reply: string }>('/ai/chat', { message: text, history });
        reply = { id: crypto.randomUUID(), role: 'assistant', content: data.reply };
      } catch (err) {
        const detail = (err as AxiosError<{ error?: string }>).response?.data?.error;
        reply = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: detail || 'Sorry, something went wrong. Please try again.',
          error: true,
        };
      }

      // The chat was cleared while this request was in flight — drop the reply.
      if (session !== sessionRef.current) return;

      update([...messagesRef.current, reply]);
      loadingRef.current = false;
      setLoading(false);
    },
    [update]
  );

  const clear = useCallback(() => {
    sessionRef.current += 1;
    loadingRef.current = false;
    setLoading(false);
    update([]);
  }, [update]);

  return { messages, loading, send, clear };
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { useAiChat } from '@/lib/useAiChat';
import {
  X,
  Send,
  Sparkles,
  Loader2,
  Bot,
  User,
  Trash2,
} from 'lucide-react';

export default function AiChatDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { messages, loading, send, clear } = useAiChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = '24px';
    send(text);
  };

  const clearChat = () => {
    clear();
    setInput('');
  };

  const suggestions = [
    'Summarize my tasks for today',
    'Help me write a task description',
    'What should I prioritize this week?',
    'Draft a project update',
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-[color:var(--c-1e1f21)] border-l border-[color:var(--c-333438)] z-[150] flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-[color:var(--c-333438)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[color:var(--c-white)]" />
            </div>
            <span className="text-[14px] font-semibold text-[color:var(--c-white)]">AI Chat</span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-1.5 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-(--c-2a2b2e) rounded transition"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] rounded transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mb-4">
                <Bot className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-[color:var(--c-white)] mb-1">
                ClickUp AI Assistant
              </h3>
              <p className="text-[12px] text-(--c-8a8c91) mb-6 max-w-70">
                Ask me anything about your tasks, projects, or let me help you
                draft content.
              </p>
              <div className="w-full space-y-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] hover:bg-[color:var(--c-333438)] text-[12px] text-[#c4c4c4] hover:text-[color:var(--c-white)] transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-[color:var(--c-white)]" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : msg.error
                      ? 'bg-red-500/10 text-red-300 border border-red-500/30 rounded-bl-sm'
                      : 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-e5e5e5)] border border-[color:var(--c-333438)] rounded-bl-sm'
                    }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-[color:var(--c-white)]" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-2.5">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-[color:var(--c-white)]" />
              </div>
              <div className="bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] rounded-xl rounded-bl-sm px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[color:var(--c-8a8c91)] animate-bounce [animation-delay:0ms]" />
                  <div className="h-2 w-2 rounded-full bg-[color:var(--c-8a8c91)] animate-bounce [animation-delay:150ms]" />
                  <div className="h-2 w-2 rounded-full bg-[color:var(--c-8a8c91)] animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-[color:var(--c-333438)] p-3">
          <div className="flex items-end gap-2 bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] rounded-xl px-3 py-2 focus-within:border-primary transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask AI anything…"
              rows={1}
              className="flex-1 bg-transparent text-[13px] text-[color:var(--c-white)] placeholder-[color:var(--c-8a8c91)] outline-none resize-none max-h-[120px] leading-relaxed"
              style={{ minHeight: '24px' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = '24px';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary/85 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-[color:var(--c-8a8c91)] mt-1.5 text-center">
            AI may make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </>
  );
}

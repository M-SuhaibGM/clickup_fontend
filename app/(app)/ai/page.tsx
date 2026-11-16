'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Zap, Mic, Send, ChevronDown, MonitorPlay, Loader2, SquarePen } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAiChat } from '@/lib/useAiChat';

const SUGGESTIONS = [
  'Summarize my tasks for today',
  'What should I prioritize this week?',
  'Help me write a task description',
  'Draft a project update',
];

export default function AiPage() {
  const { messages, loading, send, clear } = useAiChat();
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'Ask' | 'Agents'>('Ask');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const hasChat = messages.length > 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [hasChat]);

  const submit = (text = input) => {
    if (!text.trim() || loading) return;
    setInput('');
    send(text);
  };

  const newChat = () => {
    clear();
    setInput('');
  };

  const composer = (
    <div className="w-full relative p-0.5 rounded-xl bg-linear-to-r from-blue-500 via-purple-500 to-orange-500 shadow-lg shadow-purple-500/20">
      <div className="bg-[#1e1f21] rounded-[10px] w-full flex flex-col overflow-hidden">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={hasChat ? 'Ask a follow-up…' : "Let's get you started"}
          className={`w-full bg-transparent p-4 text-white placeholder:text-[#8a8c91] outline-none resize-none text-sm ${
            hasChat ? 'h-16' : 'h-24'
          }`}
        />

        <div className="flex items-center justify-between px-3 py-2 bg-[#1e1f21] border-t border-[#333438]/50">
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-[#8a8c91] hover:text-white hover:bg-[#2a2b2e] rounded-md transition">
              <Plus className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 text-[#8a8c91] hover:text-white hover:bg-[#2a2b2e] rounded-md text-[13px] transition">
              <Zap className="h-3.5 w-3.5" /> Skills
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-[13px] font-medium text-[#8a8c91] hover:text-white transition">
              <Image src="/ai-icon.png" alt="Max" width={14} height={14} /> Max <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button className="p-1.5 text-[#8a8c91] hover:text-white rounded-md transition">
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={() => submit()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="p-1.5 bg-[#2c82f8] text-white rounded-md hover:bg-[#2570d4] disabled:bg-[#2a2b2e] disabled:text-[#8a8c91] disabled:cursor-not-allowed transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#1e1f21] relative overflow-hidden">
      {/* Background gradient glow at top */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Top right actions */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
        {hasChat && (
          <button
            onClick={newChat}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#2a2b2e] text-[#e5e5e5] text-sm font-medium transition"
          >
            <SquarePen className="h-4 w-4" /> New chat
          </button>
        )}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#2a2b2e] text-[#e5e5e5] text-sm font-medium transition">
          <MonitorPlay className="h-4 w-4" /> Memory
        </button>
      </div>

      {hasChat ? (
        /* ── Conversation Layout ─────────────────────────────────────── */
        <div className="relative flex flex-col h-full min-h-0">
          
          {/* Scrollable Message Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-16 pb-32">
            <div className="max-w-3xl mx-auto w-full px-4 space-y-5">
              {messages.map((msg) =>
                msg.role === 'user' ? (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#2c82f8] text-white px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex gap-3">
                    <Image src="/ai-icon.png" alt="AI" width={24} height={24} className="h-6 w-6 object-contain shrink-0 mt-0.5" />
                    <div
                      className={`min-w-0 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        msg.error
                          ? 'text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2'
                          : 'text-[#e5e5e5] pt-0.5'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex gap-3 items-center">
                  <Image src="/ai-icon.png" alt="AI" width={24} height={24} className="h-6 w-6 object-contain shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#8a8c91] animate-bounce [animation-delay:0ms]" />
                    <div className="h-2 w-2 rounded-full bg-[#8a8c91] animate-bounce [animation-delay:150ms]" />
                    <div className="h-2 w-2 rounded-full bg-[#8a8c91] animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>
          </div>

          {/* Fixed Composer at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1e1f21] via-[#1e1f21] to-transparent pt-6 pb-4">
            <div className="max-w-3xl mx-auto w-full px-4">
              {composer}
              <p className="text-[11px] text-[#8a8c91] mt-2 text-center">
                AI may make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Landing Layout ──────────────────────────────────────────── */
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center justify-start pt-20 px-4">
          <div className="max-w-3xl w-full flex flex-col items-center">
            
            {/* Brain Logo & Title */}
            <div className="flex items-center gap-3 mb-8">
              <Image src="/ai-icon.png" alt="Brain" width={40} height={40} className="w-10 h-10 object-contain" />
              <h1 className="text-4xl font-semibold text-white tracking-tight flex items-start">
                Brain<span className="text-sm mt-1 ml-0.5 text-[#8a8c91]">2</span>
              </h1>
            </div>

            {/* Custom Tab Switcher */}
            <div className="flex items-center gap-1 mb-2 w-full">
              <button
                onClick={() => setActiveTab('Ask')}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === 'Ask'
                    ? 'bg-[#1e1f21] text-white border-t border-l border-[#333438] relative z-10 -mb-[1px]'
                    : 'text-[#8a8c91] hover:text-white bg-[#2a2b2e]/50'
                }`}
              >
                <Image src="/ai-icon.png" alt="AI" width={16} height={16} /> Ask
              </button>
              <button
                onClick={() => setActiveTab('Agents')}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === 'Agents'
                    ? 'bg-[#1e1f21] text-white border-t border-l border-[#333438] relative z-10 -mb-[1px]'
                    : 'text-[#8a8c91] hover:text-white bg-[#2a2b2e]/50'
                }`}
              >
                <MonitorPlay className="h-4 w-4" /> Agents
              </button>
            </div>

            {composer}

            {/* Quick prompts */}
            <div className="w-full flex flex-wrap gap-2 mt-3 mb-8">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="px-3 py-1.5 rounded-full border border-[#333438] bg-[#2a2b2e] hover:bg-[#333438] text-[12px] text-[#c4c4c4] hover:text-white transition"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Promo Card */}
            <div className="w-full bg-[#1e1f21] border border-[#333438] rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <Image src="/ai-icon.png" alt="Icon" width={16} height={16} />
                <span className="text-lg leading-none">🧠</span>
                <span className="text-lg leading-none">✨</span>
                <span className="text-lg leading-none">🤖</span>
              </div>
              <h3 className="text-[15px] font-bold text-white">Unlock Brain AI, the AI that knows your work</h3>
              <p className="text-[13px] text-[#8a8c91]">
                Claude, GPT, and Gemini in one place, with context from your tasks, docs, and conversations. Included with Business.
              </p>
              <Link
                href="/upgrade"
                className="self-start mt-1 px-4 py-1.5 bg-white hover:bg-gray-200 text-black text-[13px] font-semibold rounded-md transition"
              >
                See upgrades
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
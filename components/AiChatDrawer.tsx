'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAiChat } from '@/lib/useAiChat';
import {
  Plus,
  Zap,
  Mic,
  Send,
  Loader2,
  Gem,
  ChevronDown,
  ChevronsRight,
  Maximize2,
  TriangleAlert,
  History,
  CalendarClock,
  Inbox,
  Search,
  FlaskConical,
  PlusCircle,
  Pencil,
  Activity,
  Flag,
  CalendarDays,
  FileText,
  FileBarChart,
  CircleUserRound,
  Bot,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

type Chip = { label: string; icon: LucideIcon; prompt: string };

const ACTION_CHIPS: Chip[] = [
  { label: 'Find', icon: Search, prompt: 'Find ' },
  { label: 'Research', icon: FlaskConical, prompt: 'Research ' },
  { label: 'Create', icon: PlusCircle, prompt: 'Create ' },
  { label: 'Edit', icon: Pencil, prompt: 'Edit ' },
  { label: 'Analyze', icon: Activity, prompt: 'Analyze ' },
  { label: 'Prioritize', icon: Flag, prompt: 'What should I prioritize this week?' },
  { label: 'Schedule', icon: CalendarDays, prompt: 'Schedule ' },
];

const QUICK_CHIPS: (Chip & { color: string })[] = [
  { label: 'Report', icon: FileBarChart, color: 'text-[color:var(--c-8a8c91)]', prompt: 'Draft a project update report' },
  { label: 'Doc', icon: FileText, color: 'text-blue-400', prompt: 'Help me write a doc about ' },
  { label: 'StandUp', icon: CircleUserRound, color: 'text-pink-400', prompt: 'Summarize my tasks for today as a standup update' },
  { label: 'Super Agent', icon: Bot, color: 'text-fuchsia-400', prompt: '' },
];

const HEADER_ICON_BTN =
  'p-1.5 rounded-md text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] transition';

export default function AiChatDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { messages, loading, send, clear } = useAiChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasChat = messages.length > 0;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const resizeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '24px';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  useEffect(resizeInput, [input]);

  const sendMessage = (text = input) => {
    const value = text.trim();
    if (!value || loading) return;
    setInput('');
    send(value);
  };

  const newChat = () => {
    clear();
    setInput('');
    inputRef.current?.focus();
  };

  const fillPrompt = (prompt: string) => {
    if (!prompt) return;
    setInput(prompt);
    inputRef.current?.focus();
  };

  const openFullPage = () => {
    onClose();
    router.push('/ai');
  };

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
        className={`fixed top-0 right-0 h-full w-full max-w-[520px] bg-[color:var(--c-1e1f21)] border-l border-[color:var(--c-333438)] z-[150] flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 shrink-0">
          <button
            onClick={newChat}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] hover:bg-[color:var(--c-333438)] text-[13px] font-medium text-[color:var(--c-white)] transition"
            title="Start a new chat"
          >
            New Chat
            <ChevronDown className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" />
          </button>

          <div className="flex items-center gap-0.5">
            <button className={`${HEADER_ICON_BTN} !text-red-500`} title="Notices">
              <TriangleAlert className="h-4 w-4" />
            </button>
            <button className={HEADER_ICON_BTN} title="Chat history">
              <History className="h-4 w-4" />
            </button>
            <button className={HEADER_ICON_BTN} title="Scheduled">
              <CalendarClock className="h-4 w-4" />
            </button>
            <button className={HEADER_ICON_BTN} title="Inbox">
              <Inbox className="h-4 w-4" />
            </button>
            <button onClick={openFullPage} className={HEADER_ICON_BTN} title="Open full page">
              <Maximize2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className={HEADER_ICON_BTN} title="Close">
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          {hasChat ? (
            <div className="px-4 py-4 space-y-5">
              {messages.map((msg) =>
                msg.role === 'user' ? (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-white px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex gap-2.5">
                    <Image
                      src="/ai-icon.png"
                      alt="AI"
                      width={24}
                      height={24}
                      className="h-6 w-6 object-contain shrink-0 mt-0.5"
                    />
                    <div
                      className={`min-w-0 text-[13px] leading-relaxed whitespace-pre-wrap break-words ${msg.error
                        ? 'text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2'
                        : 'text-[color:var(--c-e5e5e5)] pt-0.5'
                        }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex gap-2.5 items-center">
                  <Image
                    src="/ai-icon.png"
                    alt="AI"
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain shrink-0"
                  />
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[color:var(--c-8a8c91)] animate-bounce [animation-delay:0ms]" />
                    <div className="h-2 w-2 rounded-full bg-[color:var(--c-8a8c91)] animate-bounce [animation-delay:150ms]" />
                    <div className="h-2 w-2 rounded-full bg-[color:var(--c-8a8c91)] animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col min-h-full px-4 pb-4">
              {/* Create Skills card */}
              <button
                onClick={() => fillPrompt('Create a skill for Brain that ')}
                className="flex items-center gap-3 w-full text-left rounded-xl border border-[color:var(--c-333438)] hover:bg-[color:var(--c-2a2b2e)] px-3 py-2.5 transition"
              >
                <span className="h-9 w-9 shrink-0 rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] flex items-center justify-center">
                  <Gem className="h-4 w-4 text-sky-300" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-[color:var(--c-white)]">
                    Create Skills for Brain
                    <span className="px-1.5 py-px rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold leading-4">
                      New
                    </span>
                  </span>
                  <span className="block text-[12px] text-[color:var(--c-8a8c91)] truncate">
                    Package your expertise into a reusable skill
                  </span>
                </span>
              </button>

              {/* Brain logo + title + quick chips */}
              <div className="flex-1 flex flex-col items-center justify-center py-8">
                <Image src="/ai-icon.png" alt="Brain" width={56} height={56} className="h-14 w-14 object-contain" priority />
                <h2 className="mt-3 text-[28px] leading-none font-semibold text-[color:var(--c-white)] tracking-tight flex items-start">
                  Brain<span className="text-[13px] mt-0.5 ml-0.5 text-[color:var(--c-8a8c91)]">2</span>
                </h2>

                <div
                  className="mt-6 flex items-center justify-center gap-5 w-full overflow-hidden"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
                  }}
                >
                  {QUICK_CHIPS.map(({ label, icon: Icon, color, prompt }) => (
                    <button
                      key={label}
                      onClick={() => fillPrompt(prompt)}
                      className="flex items-center gap-1.5 text-[13px] text-[color:var(--c-e5e5e5)] hover:text-[color:var(--c-white)] whitespace-nowrap transition"
                    >
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action chips */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {ACTION_CHIPS.map(({ label, icon: Icon, prompt }) => (
                  <button
                    key={label}
                    onClick={() => fillPrompt(prompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[color:var(--c-333438)] hover:bg-[color:var(--c-2a2b2e)] text-[12px] text-[color:var(--c-e5e5e5)] transition"
                  >
                    <Icon className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Promo card */}
              <div className="rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)]/60 p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-1 mb-1">
                  {[
                    <Image key="a" src="/ai-icon.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />,
                    <Sparkles key="b" className="h-3.5 w-3.5 text-[color:var(--c-white)]" />,
                    <Sparkles key="c" className="h-3.5 w-3.5 text-orange-400" />,
                    <Sparkles key="d" className="h-3.5 w-3.5 text-blue-400" />,
                  ].map((icon, i) => (
                    <span
                      key={i}
                      className="h-6 w-6 rounded-full bg-[color:var(--c-1e1f21)] border border-[color:var(--c-333438)] flex items-center justify-center"
                    >
                      {icon}
                    </span>
                  ))}
                </div>
                <h3 className="text-[13px] font-semibold text-[color:var(--c-white)]">
                  Unlock Brain AI, the AI that knows your work
                </h3>
                <p className="text-[12px] leading-relaxed text-[color:var(--c-8a8c91)]">
                  Claude, GPT, and Gemini in one place, with context from your tasks, docs, and
                  conversations. Included with Business.
                </p>
                <Link
                  href="/upgrade"
                  onClick={onClose}
                  className="self-start mt-1.5 px-3 py-1 rounded-md bg-[color:var(--c-white)] hover:opacity-85 text-[color:var(--c-1e1f21)] text-[12px] font-semibold transition"
                >
                  See upgrades
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 px-4 pb-3 pt-1">
          <div className="p-0.5 rounded-xl bg-linear-to-r from-blue-500 via-purple-500 to-orange-500 shadow-lg shadow-purple-500/20">
            <div className="bg-[color:var(--c-1e1f21)] rounded-[10px] flex flex-col overflow-hidden">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={hasChat ? 'Ask a follow-up…' : "Let's get you started"}
                rows={1}
                className="w-full bg-transparent px-3.5 pt-3 pb-1 text-[13px] text-[color:var(--c-white)] placeholder:text-[color:var(--c-8a8c91)] outline-none resize-none leading-relaxed"
                style={{ minHeight: '24px' }}
              />

              <div className="flex items-center justify-between px-2.5 pb-2">
                <div className="flex items-center gap-1">
                  <button
                    className="p-1.5 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] rounded-md transition"
                    aria-label="Add"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button className="flex items-center gap-1.5 px-2 py-1 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] rounded-md text-[13px] transition">
                    <Zap className="h-3.5 w-3.5" /> Skills
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button className="flex items-center gap-1 text-[13px] font-medium text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition">
                    <Image src="/ai-icon.png" alt="Max" width={14} height={14} /> Max
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="p-1.5 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] rounded-md transition"
                    aria-label="Voice input"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    aria-label="Send message"
                    className="p-1.5 bg-primary text-white rounded-md hover:bg-primary/85 disabled:bg-[color:var(--c-2a2b2e)] disabled:text-[color:var(--c-8a8c91)] disabled:cursor-not-allowed transition"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-[color:var(--c-8a8c91)] mt-1.5 text-center">
            AI may make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </>
  );
}

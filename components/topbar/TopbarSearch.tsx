'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';

export default function TopbarSearch({ onAiChatClick }: { onAiChatClick?: () => void }) {
  const [shortcut, setShortcut] = useState('Ctrl K');
  useEffect(() => {
    if (/Mac|iPhone|iPad/i.test(navigator.platform)) setShortcut('⌘ K');
  }, []);

  const triggerSearch = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <div className="hidden md:flex flex-1 justify-center">
      <div
        onClick={triggerSearch}
        className="flex items-center w-full max-w-67.5 bg-(--c-2a2b2e) border border-(--c-333438) hover:border-(--c-444548) rounded-full h-7 pl-3 pr-0.5 transition-colors cursor-text"
      >
        <Search className="h-3.5 w-3.5 text-(--c-8a8c91) mr-1.5 shrink-0" />
        <span className="text-[13px] text-(--c-e5e5e5) shrink-0">Search</span>
        <span className="text-[11px] text-(--c-8a8c91) ml-1.5 flex-1 truncate">{shortcut}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onAiChatClick?.(); }}
          className="ai-gradient-btn flex items-center gap-1.5 px-2.5 bg-(--c-1e1f21) shrink-0 h-6"
        >
          <span className="text-[12px] font-medium text-(--c-e5e5e5)">AI Chats</span>
          <Image src="/ai-icon.png" alt="AI" width={16} height={16} className="ai-icon h-3.5 w-3.5 object-contain" />
        </button>
      </div>
    </div>
  );
}

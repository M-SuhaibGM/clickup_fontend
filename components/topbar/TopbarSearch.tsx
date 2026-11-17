'use client';

import Image from 'next/image';
import { Search } from 'lucide-react';

export default function TopbarSearch({ onAiChatClick }: { onAiChatClick?: () => void }) {
  const triggerSearch = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <div className="hidden md:flex flex-1 justify-center">
      <div onClick={triggerSearch} className="flex items-center w-full max-w-110 bg-(--c-2a2b2e) border border-(--c-333438) hover:border-(--c-444548) rounded-full h-8 pl-3 pr-1 transition-colors cursor-text group">
        <Search className="h-3.5 w-3.5 text-(--c-8a8c91) mr-2 shrink-0" />
        <span className="text-[13px] text-(--c-8a8c91) flex-1">Search</span>
        <kbd className="text-[10px] font-sans text-(--c-8a8c91) bg-transparent border border-(--c-333438) px-1.5 py-0.5 rounded mr-1 group-hover:border-(--c-444548) transition-colors">⌘ K</kbd>
        <button onClick={(e) => { e.stopPropagation(); onAiChatClick?.(); }} className="ai-gradient-btn flex items-center gap-1.5 px-2.5 py-0.5 bg-(--c-2a2b2e) text-white shrink-0 ml-1 h-6">
          <span className="text-[12px] font-medium tracking-wide text-(--c-e5e5e5)">AI Chats</span>
          <Image src="/ai-icon.png" alt="AI" width={16} height={16} className="ai-icon h-4 w-4 object-contain" />
        </button>
      </div>
    </div>
  );
}

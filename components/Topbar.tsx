'use client';

import { useAccentInit } from '@/lib/accent';
import WorkspaceSwitcher from './topbar/WorkspaceSwitcher';
import TopbarSearch from './topbar/TopbarSearch';
import TopbarActions from './topbar/TopbarActions';

export default function Topbar({ onMenuClick, onAiChatClick }: { onMenuClick?: () => void; onAiChatClick?: () => void }) {
  useAccentInit();

  return (
    <header className="h-9 shrink-0 bg-(--c-shell) flex items-center justify-between px-3 text-(--c-e5e5e5) select-none z-[100]">
      <WorkspaceSwitcher onMenuClick={onMenuClick} />
      <TopbarSearch onAiChatClick={onAiChatClick} />
      <TopbarActions />
    </header>
  );
}

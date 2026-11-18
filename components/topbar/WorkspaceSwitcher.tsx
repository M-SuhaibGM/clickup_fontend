'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, Settings, ChevronDown, Check, Plus, Users, Calendar } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { lazyOnOpen } from '../LazyMount';

import { getInitials } from './utils';

const NewWorkspaceModal = lazyOnOpen(() => import('../Newworkspacemodal'));

export default function WorkspaceSwitcher({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore();

  const [wsMenuOpen, setWsMenuOpen] = useState(false);
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const wsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wsMenuRef.current && !wsMenuRef.current.contains(e.target as Node)) {
        setWsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <>
      <div className="flex items-center gap-2 flex-1">
        <button onClick={onMenuClick} className="md:hidden p-1.5 bg-(--c-2a2b2e) rounded text-(--c-8a8c91) hover:text-(--c-white) transition">
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative" ref={wsMenuRef}>
          <button
            onClick={() => setWsMenuOpen(!wsMenuOpen)}
            className="flex items-center gap-2 bg-(--c-2a2b2e) hover:bg-(--c-333438) h-7 pl-1 pr-2 rounded-lg transition-colors"
          >
            <div className="h-5 w-5 rounded-md bg-[#1bb5a5] text-white flex items-center justify-center text-[11px] font-bold">
              {getInitials(activeWorkspace?.name)}
            </div>
            <span className="text-[13px] font-semibold text-(--c-white) hidden sm:block max-w-37.5 truncate">
              {activeWorkspace?.name || 'Select Workspace'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-(--c-8a8c91)" />
          </button>

          {wsMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-(--c-1e1f21) border border-(--c-333438) rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-4 pb-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-[#1bb5a5] text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {getInitials(activeWorkspace?.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-(--c-white) truncate leading-tight">
                      {activeWorkspace?.name}
                    </h3>
                    <p className="text-[11px] text-(--c-8a8c91) mt-0.5">
                      <Link href="/upgrade">
                        Free Forever · <span className="underline cursor-pointer hover:text-(--c-white) transition">Upgrade</span>
                      </Link>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/settings"
                    className="flex-1 flex items-center justify-center gap-2 h-8 bg-(--c-2a2b2e) hover:bg-(--c-333438) border border-(--c-333438) rounded-md text-[12px] font-medium transition text-(--c-e5e5e5)"
                  >
                    <Settings className="h-3.5 w-3.5 text-(--c-8a8c91)" /> Settings
                  </Link>
                  <Link
                    href="/members"
                    className="flex-1 flex items-center justify-center gap-2 h-8 bg-(--c-2a2b2e) hover:bg-(--c-333438) border border-(--c-333438) rounded-md text-[12px] font-medium transition text-(--c-e5e5e5)"
                  >
                    <Users className="h-3.5 w-3.5 text-(--c-8a8c91)" /> People
                  </Link>
                </div>
              </div>
              <div className="h-px bg-(--c-333438) w-full" />
              <div className="px-2 py-2">
                <p className="px-2 text-[10px] uppercase tracking-wider font-bold text-(--c-8a8c91) mb-1">Your Workspaces</p>
                <div className="max-h-40 overflow-y-auto">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => { setActiveWorkspace(ws); setWsMenuOpen(false); }}
                      className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-(--c-2a2b2e) rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-5 w-5 rounded bg-(--c-333438) text-(--c-white) flex items-center justify-center text-[9px] font-bold shrink-0">{getInitials(ws.name)}</div>
                        <span className="text-[13px] text-(--c-e5e5e5) truncate">{ws.name}</span>
                      </div>
                      {activeWorkspace?.id === ws.id && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-px bg-(--c-333438) w-full" />
              <div className="p-2">
                <button
                  onClick={() => { setWsMenuOpen(false); setWsModalOpen(true); }}
                  className="w-full flex items-center justify-center gap-2 h-9 bg-transparent hover:bg-(--c-2a2b2e) border border-(--c-333438) rounded-md text-[13px] font-medium text-(--c-e5e5e5) transition"
                >
                  <Plus className="h-4 w-4 text-(--c-8a8c91)" /> Create Workspace
                </button>
              </div>
            </div>
          )}
        </div>

        <Link
          href="/planner"
          className={`p-1.5 rounded-md transition-colors ${pathname === '/planner'
            ? 'bg-(--c-2a2b2e) text-(--c-white)'
            : 'text-(--c-8a8c91) hover:text-(--c-white) hover:bg-(--c-2a2b2e)'
            }`}
          title="Planner"
        >
          <Calendar className="h-4 w-4" />
        </Link>
      </div>

      <NewWorkspaceModal open={wsModalOpen} onClose={() => setWsModalOpen(false)} />
    </>
  );
}

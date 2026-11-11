'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { logout } from '@/lib/auth';
import Image from 'next/image';
import { ThemeToggle } from './theme-toggle';
import { Menu } from 'lucide-react';

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    useProjectStore.getState().clear();
    router.replace('/login');
  };

  return (
    <header className="h-14 shrink-0 border-b border-border bg-background flex items-center justify-between px-4 sm:px-6">
      {/* Mobile Menu Button */}
      <button onClick={onMenuClick} className="md:hidden p-2 hover:bg-accent rounded-lg text-foreground">
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
        <span>Workspace</span>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-foreground font-medium">Home</span>
      </div>

      {/* Right side: Theme Toggle + User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 hover:bg-muted px-2 sm:px-3 py-1.5 rounded-md border border-border transition-colors"
        >
          <span className="hidden sm:inline">Search...</span>
          <svg className="sm:hidden h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <kbd className="hidden sm:inline-flex font-sans pointer-events-none h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
        <ThemeToggle />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-full hover:bg-accent pl-1 pr-3 py-1 transition"
          >
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name || 'User avatar'}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full border border-border object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-foreground leading-tight">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{user?.email}</p>
            </div>
            <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { logout } from '@/lib/auth';

export default function Topbar() {
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
    <header className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="text-gray-400">Workspace</span>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">Home</span>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-full hover:bg-gray-50 pl-1 pr-3 py-1 transition"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full border border-gray-200" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{user?.email}</p>
          </div>
          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
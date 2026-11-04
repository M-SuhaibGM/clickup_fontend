'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { fetchCurrentUser } from '@/lib/auth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AppShellSkeleton from './AppShellSkeleton';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const me = user ?? (await fetchCurrentUser());
      if (!me) {
        router.replace('/login');
        return;
      }
      await fetchProjects();
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Suspense
        fallback={<aside className="w-64 shrink-0 border-r border-gray-200 bg-white" />}
      >
        <Sidebar />
      </Suspense>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto relative">
          {children}
          {!ready && (
            <div className="absolute inset-0 z-10">
              <AppShellSkeleton />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
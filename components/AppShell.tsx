'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore'; // ← Import
import { fetchCurrentUser } from '@/lib/auth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AppShellSkeleton from './AppShellSkeleton';
import { CommandPalette } from './command-palette';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  
  // Workspace state
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  
  const [ready, setReady] = useState(false);

  // 1. Initial Load: Fetch user and workspaces
  useEffect(() => {
    (async () => {
      const me = user ?? (await fetchCurrentUser());
      if (!me) {
        router.replace('/login');
        return;
      }
      await fetchWorkspaces();
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. When the Active Workspace changes, fetch its projects
  useEffect(() => {
    if (activeWorkspace) {
      fetchProjects(activeWorkspace.id);
    }
  }, [activeWorkspace, fetchProjects]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Suspense
        fallback={<aside className="w-64 shrink-0 border-r border-border bg-card" />}
      >
        <Sidebar />
      </Suspense>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto relative">
          {children}
          {!ready && (
            <div className="absolute inset-0 z-10 bg-background">
              <AppShellSkeleton />
            </div>
          )}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
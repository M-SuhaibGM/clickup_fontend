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
import NewProjectModal from './NewProjectModal';
import InviteMemberModal from './InviteMemberModal';
import NewWorkspaceModal from './Newworkspacemodal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  // Workspace state
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);

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
        fallback={<aside className="hidden md:w-64 md:shrink-0 md:border-r md:border-border md:bg-card" />}
      >
        {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}
        <div className={`fixed md:relative md:z-auto z-50 h-screen w-64 transform transition-transform md:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <Sidebar onClose={() => setSidebarOpen(false)} onCreateProject={() => setModalOpen(true)} onInvite={() => setInviteModalOpen(true)} onCreateWorkspace={() => setWorkspaceModalOpen(true)} />
        </div>
      </Suspense>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
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

      {/* Modals rendered at top level so they appear above sidebar */}
      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <InviteMemberModal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} />
      <NewWorkspaceModal open={workspaceModalOpen} onClose={() => setWorkspaceModalOpen(false)} />
    </div>
  );
}
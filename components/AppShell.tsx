'use client';

import { useEffect, useState, Suspense, lazy, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useSpaceStore } from '@/store/spaceStore';
import { useChannelStore } from '@/store/channelStore';
import { useTeamStore } from '@/store/teamStore';
import Sidebar from './Sidebar';
import SidebarDrawer from './SidebarDrawer';
import Topbar from './Topbar';
import AppRail from './AppRail';
import AppShellSkeleton from './AppShellSkeleton';
import { CommandPalette } from './command-palette';
import { lazyOnOpen } from './LazyMount';
import { useCreateModal } from '@/store/createModalStore';
import ReminderAlerts from './ReminderAlerts';
import DmProvider from './DmProvider';

// Heavy, on-demand UI: downloaded only when first used.
const AiChatDrawer = lazyOnOpen(() => import('./AiChatDrawer'), { slideIn: true });
const CreateModal = lazy(() => import('./CreateModal'));

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const fetchSpaces = useSpaceStore((s) => s.fetchSpaces);
  const fetchTeams = useTeamStore((s) => s.fetchTeams);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  const [ready, setReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const isCreateOpen = useCreateModal((s) => s.open);

  // Auto-close sidebar on mobile screens
  useEffect(() => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);
  
  // Drag state for the drawer
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    (async () => {
      await fetchWorkspaces();
      setReady(true);
    })();
  }, [hasHydrated, user, fetchWorkspaces, router]);

  useEffect(() => {
    if (activeWorkspace) {
      // Switching workspace: drop the previous workspace's spaces/projects/channels first
      useSpaceStore.getState().clear();
      useChannelStore.getState().reset();
      useTeamStore.getState().clear();
      fetchSpaces(activeWorkspace.id);
      fetchTeams(activeWorkspace.id);
      fetchProjects(activeWorkspace.id);
    }
  }, [activeWorkspace, fetchProjects, fetchSpaces, fetchTeams]);

  // Drag logic
  const startDragging = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sidebarRef.current) return;
    const sidebarLeft = sidebarRef.current.getBoundingClientRect().left;
    const newWidth = e.clientX - sidebarLeft;
    
    // Auto-close if dragged too far left
    if (newWidth < 150) {
      setIsSidebarOpen(false);
      setIsDragging(false);
    } else if (newWidth > 200 && newWidth < 450) {
      setSidebarWidth(newWidth);
    }
  }, [isDragging]);

  const stopDragging = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', stopDragging);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', stopDragging);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', stopDragging);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, onMouseMove, stopDragging]);

  return (
    <div className="flex flex-col h-screen bg-[color:var(--c-shell)] overflow-hidden">
      
      <Topbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} onAiChatClick={() => setIsAiChatOpen(true)} />

      <div className="relative flex flex-1 min-h-0 overflow-hidden pt-1 pb-2 px-2">

        {/* App Rail (Far Left) — visible on all screen sizes */}
        <AppRail
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Sidebar Drawer (Middle) */}
        <div
          ref={sidebarRef}
          style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px' }}
          className={`h-full shrink-0 transition-[width,opacity] duration-300 ease-in-out
            max-md:absolute max-md:top-1 max-md:bottom-2 max-md:left-[68px] max-md:z-40 max-md:max-w-[calc(100vw-84px)] max-md:h-auto max-md:shadow-2xl
            md:relative ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0 overflow-hidden'
          }`}
        >
          <SidebarDrawer
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            width={sidebarWidth}
            isDragging={isDragging}
            startDragging={startDragging}
          >
            <Sidebar onCollapse={() => setIsSidebarOpen(false)} />
          </SidebarDrawer>
        </div>

        {/* Main Content Area */}
        <main className={`flex-1 min-w-0 overflow-x-hidden overflow-y-auto relative max-md:rounded-lg bg-[color:var(--c-1e1f21)] border border-[color:var(--c-333438)] ${isSidebarOpen ? 'rounded-r-lg' : 'rounded-lg'}`}>
          {children}
          {!ready && (
            <div className="absolute inset-0 z-10 bg-[color:var(--c-1e1f21)] rounded-lg">
              <AppShellSkeleton />
            </div>
          )}
        </main>
      </div>

      <CommandPalette />
      {isCreateOpen && (
        <Suspense fallback={null}>
          <CreateModal />
        </Suspense>
      )}
      <ReminderAlerts />
      <DmProvider />
      <AiChatDrawer open={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} />
    </div>
  );
}
'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import Sidebar from './Sidebar';
import SidebarDrawer from './SidebarDrawer';
import Topbar from './Topbar';
import AppRail from './AppRail';
import AppShellSkeleton from './AppShellSkeleton';
import { CommandPalette } from './command-palette';
import AiChatDrawer from './AiChatDrawer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  const [ready, setReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

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
      fetchProjects(activeWorkspace.id);
    }
  }, [activeWorkspace, fetchProjects]);

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
    <div className="flex flex-col h-screen bg-[#1e1f21] overflow-hidden">
      
      <Topbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} onAiChatClick={() => setIsAiChatOpen(true)} />

      <div className="flex flex-1 overflow-hidden pt-1 pb-2 px-2 gap-2">
        
        {/* App Rail (Far Left) — visible on all screen sizes */}
        <AppRail
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Sidebar Drawer (Middle) */}
        <div
          ref={sidebarRef}
          style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px' }}
          className={`h-full shrink-0 relative transition-[width,opacity] duration-300 ease-in-out ${
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
        <main className="flex-1 overflow-y-auto relative bg-[#1e1f21] rounded-lg border border-[#333438]">
          {children}
          {!ready && (
            <div className="absolute inset-0 z-10 bg-[#1e1f21] rounded-lg">
              <AppShellSkeleton />
            </div>
          )}
        </main>
      </div>

      <CommandPalette />
      <AiChatDrawer open={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} />
    </div>
  );
}
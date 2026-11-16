'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ChevronsLeft, Home, Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import SidebarDrawer from './SidebarDrawer';
import Topbar from './Topbar';
import AppRail from './AppRail';
import AppShellSkeleton from './AppShellSkeleton';
import { CommandPalette } from './command-palette';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  const [ready, setReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
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
      
      <Topbar onMenuClick={() => setIsMobileDrawerOpen(true)} />

      <div className="flex flex-1 overflow-hidden pt-1 pb-2 px-2 gap-2">
        
        {/* App Rail (Far Left) */}
        <div className="hidden md:block">
          <AppRail 
            isSidebarOpen={isSidebarOpen} 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          />
        </div>

        {/* Sidebar Drawer (Middle) */}
        <div 
          ref={sidebarRef}
          style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px' }}
          className={`hidden md:flex h-full shrink-0 relative transition-[width,opacity] duration-300 ease-in-out ${
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
            <Sidebar />
          </SidebarDrawer>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative bg-[#1e1f21] rounded-lg border border-[#333438] pb-16 md:pb-0">
          {children}
          {!ready && (
            <div className="absolute inset-0 z-10 bg-[#1e1f21] rounded-lg">
              <AppShellSkeleton />
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile Sidebar Drawer Overlay ── */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
            isMobileDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileDrawerOpen(false)}
        />

        {/* Slide-in Drawer */}
        <div
          className={`fixed top-0 left-0 h-full w-[300px] bg-[#232426] border-r border-[#333438] z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
            isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header with Close Icon */}
          <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-[#333438]">
            <span className="text-[15px] font-semibold text-white">Menu</span>
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-1.5 text-[#8a8c91] hover:text-white rounded hover:bg-[#2a2b2e] transition"
            >
              <ChevronsLeft className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom App Rail ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#232426] border-t border-[#333438]">
        <div className="flex items-center justify-around h-14 px-6">
          {/* Home */}
          <button className="flex flex-col items-center gap-1 text-[#8a8c91] hover:text-white transition">
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          {/* Center – Drawer Toggle (shows << on hover/active) */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="group relative flex items-center justify-center h-10 w-10 rounded-full bg-[#2a2b2e] border border-[#333438] hover:border-[#555] active:bg-[#333438] transition"
          >
            <ChevronsLeft className="h-5 w-5 text-[#8a8c91] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity absolute" />
            <span className="text-[#8a8c91] text-lg leading-none group-hover:opacity-0 group-active:opacity-0 transition-opacity">···</span>
          </button>

          {/* Create */}
          <button className="flex flex-col items-center gap-1 text-[#8a8c91] hover:text-white transition">
            <Plus className="h-5 w-5" />
            <span className="text-[10px] font-medium">Create</span>
          </button>
        </div>
      </div>

      <CommandPalette />
    </div>
  );
}
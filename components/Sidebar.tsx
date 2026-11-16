'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import {
  ChevronRight,
  ChevronsLeft,
  Plus,
  Search,
  Inbox,
  CornerUpLeft,
  MessageSquare,
  FileText,
  Zap,
  Heart,
  Video,
  User,
  Calendar,
  CheckSquare,
  MoreHorizontal,
  Box,
  Network,
  Users,
  File,
  Settings,
  History,
  Bot,
  UserPlus,
} from 'lucide-react';

// Import your Modals
import NewProjectModal from './NewProjectModal';
import NewWorkspaceModal from './Newworkspacemodal';
import InviteMemberModal from './InviteMemberModal';

export default function Sidebar({ onCollapse }: { onCollapse?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  // Stores
  const projects = useProjectStore((s) => s.projects);
  const { workspaces, activeWorkspace } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);

  // Modal States
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // UI States
  const [query, setQuery] = useState('');
  const [expandedTeamSpace, setExpandedTeamSpace] = useState(true);

  // Check if admin (based on active workspace role)
  const isAdmin = activeWorkspace?.role === 'ADMIN';

  return (
    <>
      <div className="w-full h-full flex flex-col text-[color:var(--c-e5e5e5)] overflow-hidden">

        {/* 1. Header */}
        <div className="px-4 py-3 flex items-center justify-between shrink-0 group/header">
          <h2 className="text-[15px] font-semibold text-[color:var(--c-white)]">Home</h2>
          <div className="flex items-center gap-2">
            {onCollapse && (
              <button
                onClick={onCollapse}
                className="p-1 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] rounded hover:bg-[color:var(--c-2a2b2e)] opacity-0 group-hover/header:opacity-100 transition-all"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-[color:var(--c-white)] hover:opacity-85 text-[color:var(--c-1e1f21)] rounded-md text-[13px] font-semibold transition"
            >
              <Plus className="h-3.5 w-3.5" /> Create
            </button>
          </div>
        </div>

        {/* 2. Search */}
        <div className="px-3 pb-2 shrink-0">
          <div className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-transparent border border-[color:var(--c-333438)] text-[color:var(--c-8a8c91)] focus-within:border-[color:var(--c-444548)] transition">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-[color:var(--c-white)] placeholder:text-[color:var(--c-8a8c91)]"
            />
          </div>
        </div>

        {/* 3. Navigation Tree (Scrollable) */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 custom-scrollbar">

          {/* Top Nav Items */}
          <NavItem icon={FileText} label="New" href="/ai" />

          {/* My Tasks (Links to actual page) */}
          <NavItem icon={User} label="My Tasks" href="/my-tasks" active={pathname === '/my-tasks'} expandable />
          {/* --- ADMIN / WORKSPACE LINKS --- */}
          <div className="space-y-0.5">
            <NavItem
              icon={Users}
              label="Members"
              href="/members"
              active={pathname === '/members'}
            />
            <NavItem
              icon={History}
              label="History"
              href="/history"
              active={pathname === '/history'}
            />
            <NavItem
              icon={Bot}
              label="Automations"
              href="/workflows"
              active={pathname === '/workflows'}
            />
            <NavItem
              icon={Settings}
              label="Settings"
              href="/settings"
              active={pathname === '/settings'}
            />
          </div>

          <div className="my-2 border-t border-[color:var(--c-333438)]" />

          {/* --- SPACES SECTION --- */}
          <div className="mt-2">
            <div className="flex items-center justify-between px-2.5 mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[color:var(--c-8a8c91)]">Spaces</span>
              <button
                onClick={() => setWorkspaceModalOpen(true)}
                className="text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition"
                title="Create Workspace"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Team Space (Real Projects Data) */}
            <div className="mt-1">
              <div
                onClick={() => setExpandedTeamSpace(!expandedTeamSpace)}
                className="flex items-center justify-between px-2 py-1.5 hover:bg-[color:var(--c-2a2b2e)] rounded-md cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight className={`h-3.5 w-3.5 text-[color:var(--c-8a8c91)] transition-transform ${expandedTeamSpace ? 'rotate-90' : ''}`} />
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-[13px] text-[color:var(--c-white)] font-medium overflow-hidden">{activeWorkspace?.name}</span>
                </div>
                <Plus
                  onClick={(e) => { e.stopPropagation(); setProjectModalOpen(true); }}
                  className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)] opacity-0 group-hover:opacity-100 hover:text-[color:var(--c-white)] transition"
                />
              </div>


              {/* Real Projects mapped from DB */}
              {expandedTeamSpace && (
                <div className="ml-5 pl-3 border-l border-[color:var(--c-333438)] space-y-0.5 mt-1">
                  {projects.map(p => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${pathname === `/projects/${p.id}` ? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)] font-medium' : 'text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckSquare className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" />
                        <span className="text-[13px] truncate">{p.name}</span>
                      </div>
                      <span className="text-[10px] text-[color:var(--c-8a8c91)]">{p._count?.lists || 0}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {/* New Space Button */}
            <button
              onClick={() => setWorkspaceModalOpen(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 mt-2 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] rounded-md transition"
            >
              <Plus className="h-4 w-4" />
              <span className="text-[13px]">New Space</span>
            </button>

            {/* Invite Button (if admin) */}
            <button
              onClick={() => setInviteModalOpen(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 mt-1 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] rounded-md transition"
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-[13px]">Invite People</span>
            </button>
          </div>
        </nav>
      </div>

      {/* --- RENDER MODALS --- */}
      <NewProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
      />
      <NewWorkspaceModal
        open={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
      />
      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </>
  );
}

// Helper Component
function NavItem({ icon: Icon, label, href, active, expandable, small, rightText, iconColor }: any) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between w-full px-2.5 py-1.5 rounded-md transition-colors ${active ? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)] font-medium' : 'text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]'
        }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className={`shrink-0 ${small ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${iconColor || 'text-[color:var(--c-8a8c91)]'} group-hover:text-[color:var(--c-white)] transition-colors`} />
        <span className={`truncate ${small ? 'text-[12px]' : 'text-[13px]'}`}>{label}</span>
      </div>
      {expandable && <ChevronRight className="h-3 w-3 text-[color:var(--c-8a8c91)]" />}
      {rightText && <span className="text-[10px] text-[color:var(--c-8a8c91)] truncate max-w-[100px]">{rightText}</span>}
    </Link>
  );
}
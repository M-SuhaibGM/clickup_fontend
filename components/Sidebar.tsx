'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { useState, useMemo, Suspense } from 'react'
import { useDmStore } from '@/store/dmStore';
import UserAvatar from './UserAvatar';
import { useReminderStore, bucketOf } from '@/store/reminderStore';
import { useNow } from '@/lib/useNow';
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
  Bot,
  UserPlus,
  Megaphone,
  UserCheck,
} from 'lucide-react';

// Import your Modals
import { lazyOnOpen } from './LazyMount';
import CreateMenu from './CreateMenu';
import SpaceTree, { ChannelList } from './SpaceTree';
import { BrainLogo, SectionLabel } from './SidebarSection';

import TeamsSidebar from './sidebars/TeamsSidebar';
import PlannerSidebar from './sidebars/PlannerSidebar';
import SettingsSidebar from './sidebars/SettingsSidebar';

const NewProjectModal = lazyOnOpen(() => import('./NewProjectModal'));
const NewSpaceModal = lazyOnOpen(() => import('./NewSpaceModal'));
const InviteMemberModal = lazyOnOpen(() => import('./InviteMemberModal'));

/** Routes that show the "All settings" sidebar. */
const SETTINGS_ROUTES = ['/settings', '/labs', '/upgrade', '/audit-logs'];

/** The sidebar's content depends on the section: Teams, Planner and Settings/Labs have their own; everything else is Home. */
export default function Sidebar({ onCollapse }: { onCollapse?: () => void }) {
  const pathname = usePathname();
  if (pathname === '/teams' || pathname.startsWith('/teams/')) return <TeamsSidebar onCollapse={onCollapse} />;
  if (pathname === '/planner' || pathname.startsWith('/planner/')) return <PlannerSidebar onCollapse={onCollapse} />;
  if (SETTINGS_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) return <SettingsSidebar onCollapse={onCollapse} />;
  return <HomeSidebar onCollapse={onCollapse} />;
}

function HomeSidebar({ onCollapse }: { onCollapse?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  // Stores
  const { workspaces, activeWorkspace } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);

  // Modal States
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [spaceModalOpen, setSpaceModalOpen] = useState(false);
  const [projectSpaceId, setProjectSpaceId] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Inbox badge: reminders whose time has come and aren't cleared
  const reminders = useReminderStore((s) => s.reminders);
  const now = useNow(15000);
  const inboxCount = reminders.filter((r) => bucketOf(r, now) === 'primary').length;

  // UI States
  const [query, setQuery] = useState('');

  // Direct messages: every member of the active workspace
  const dmMembers = useDmStore((s) => s.members);
  const dmUnread = useDmStore((s) => s.unread);
  const dmLast = useDmStore((s) => s.lastMessageAt);
  const [expandedDms, setExpandedDms] = useState(true);
  const dmList = useMemo(() => {
    const others = dmMembers
      .filter((m) => m.id !== user?.id)
      .sort((a, b) => {
        const ta = dmLast[a.id] ? Date.parse(dmLast[a.id]) : 0;
        const tb = dmLast[b.id] ? Date.parse(dmLast[b.id]) : 0;
        return tb - ta || a.name.localeCompare(b.name);
      });
    const self = dmMembers.find((m) => m.id === user?.id);
    return self ? [self, ...others] : others; // "You" first, like ClickUp
  }, [dmMembers, dmLast, user?.id]);
  const dmTotalUnread = Object.values(dmUnread).reduce((a, b) => a + b, 0);

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
            <CreateMenu
              isAdmin={isAdmin}
              onCreateSpace={() => setSpaceModalOpen(true)}
              onCreateProject={() => { setProjectSpaceId(null); setProjectModalOpen(true); }}
            />
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
          <NavItem icon={Inbox} label="Inbox" href="/inbox" active={pathname === '/inbox'} badge={inboxCount} />
          <NavItem icon={UserCheck} label="Assigned Comments" href="/assigned-comments" active={pathname === '/assigned-comments'} />
          <NavItem icon={Megaphone} label="Posts" href="/posts" active={pathname === '/posts'} />

          {/* My Tasks (Links to actual page) */}
          <NavItem icon={User} label="My Tasks" href="/my-tasks" active={pathname === '/my-tasks'} expandable />
          {pathname === '/my-tasks' && (
            <div className="ml-4 space-y-0.5 border-l border-[color:var(--c-333438)] pl-1.5">
              <NavItem icon={UserCheck} label="Assigned to me" href="/my-tasks#card-assigned" small />
              <NavItem icon={Calendar} label="Today & Overdue" href="/my-tasks#card-today" small />
              <NavItem icon={CheckSquare} label="Personal List" href="/my-tasks#card-personal" small />
            </div>
          )}
          {/* --- ADMIN / WORKSPACE LINKS --- */}
          <div className="space-y-0.5">
            <NavItem
              icon={Users}
              label="People"
              href="/members"
              active={pathname === '/members'}
            />
            <NavItem
              icon={Bot}
              label="Automations"
              href="/workflows"
              active={pathname === '/workflows'}
            />
          </div>

          <div className="my-2 border-t border-[color:var(--c-333438)]" />

          {/* --- AGENTS --- */}
          <SectionLabel>Agents</SectionLabel>
          <div className="space-y-0.5">
            <Link
              href="/ai"
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                pathname === '/ai'
                  ? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)]'
                  : 'text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]'
              }`}
            >
              <BrainLogo size={20} />
              <span className="text-[14px]">Brain</span>
            </Link>
            <Link
              href="/ai"
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-[14px]">New Super Agent</span>
            </Link>
          </div>

          {/* --- SPACES (workspace → spaces → projects) and CHANNELS (one per project) --- */}
          <Suspense fallback={null}>
            <SpaceTree
              isAdmin={isAdmin}
              onCreateSpace={() => setSpaceModalOpen(true)}
              onCreateProject={(spaceId) => { setProjectSpaceId(spaceId); setProjectModalOpen(true); }}
            />
            <ChannelList />
          </Suspense>

          {/* Invite Button */}
          <button
            onClick={() => setInviteModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 mt-3 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] rounded-lg transition"
          >
            <UserPlus className="h-4 w-4" />
            <span className="text-[14px]">Invite People</span>
          </button>

          <div className="my-2 border-t border-[color:var(--c-333438)]" />

          {/* --- DIRECT MESSAGES --- */}
          <div className="mt-2 pb-2">
            <button
              onClick={() => setExpandedDms(!expandedDms)}
              className="w-full flex items-center justify-between px-2.5 mb-1 group"
            >
              <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[color:var(--c-8a8c91)]">
                <ChevronRight className={`h-3 w-3 transition-transform ${expandedDms ? 'rotate-90' : ''}`} />
                Direct Messages
              </span>
              {!expandedDms && dmTotalUnread > 0 && (
                <span className="min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">
                  {dmTotalUnread > 99 ? '99+' : dmTotalUnread}
                </span>
              )}
            </button>

            {expandedDms && (
              <div className="space-y-0.5">
                {dmList.map((m) => {
                  const href = `/messages/${m.id}`;
                  const active = pathname === href;
                  const unread = dmUnread[m.id] ?? 0;
                  const isSelf = m.id === user?.id;
                  return (
                    <Link
                      key={m.id}
                      href={href}
                      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        active
                          ? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)] font-medium'
                          : 'text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar name={m.name} src={m.avatar} size={20} />
                        <span className={`text-[13px] truncate ${unread > 0 ? 'font-semibold text-[color:var(--c-white)]' : ''}`}>
                          {m.name}
                          {isSelf && <span className="ml-1.5 font-normal text-[color:var(--c-8a8c91)]">— You</span>}
                        </span>
                      </div>
                      {unread > 0 && (
                        <span className="min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </Link>
                  );
                })}
                {dmList.length <= 1 && (
                  <button
                    onClick={() => setInviteModalOpen(true)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] rounded-md transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-[13px]">Invite someone to chat</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* --- RENDER MODALS --- */}
      <NewProjectModal
        open={projectModalOpen}
        defaultSpaceId={projectSpaceId}
        onClose={() => setProjectModalOpen(false)}
      />
      <NewSpaceModal
        open={spaceModalOpen}
        onClose={() => setSpaceModalOpen(false)}
      />
      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </>
  );
}

// Helper Component
function NavItem({ icon: Icon, label, href, active, expandable, small, rightText, iconColor, badge }: any) {
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
      {badge > 0 && (
        <span className="ml-2 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {expandable && <ChevronRight className="h-3 w-3 text-[color:var(--c-8a8c91)]" />}
      {rightText && <span className="text-[10px] text-[color:var(--c-8a8c91)] truncate max-w-[100px]">{rightText}</span>}
    </Link>
  );
}
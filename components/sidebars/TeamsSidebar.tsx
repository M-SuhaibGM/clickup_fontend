'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Contact, Network, Plus, Radio, Users, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { lazyOnOpen } from '../LazyMount';

import SpaceIcon from '../SpaceIcon';
import SidebarHeader from './SidebarHeader';

const NewTeamModal = lazyOnOpen(() => import('../NewTeamModal'));

const row = 'group flex items-center justify-between w-full px-2.5 py-1.5 rounded-md transition-colors';
const rowState = (active: boolean) =>
  active
    ? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)] font-medium'
    : 'text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]';

export default function TeamsSidebar({ onCollapse }: { onCollapse?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const teams = useTeamStore((s) => s.teams);
  const [modalOpen, setModalOpen] = useState(false);

  const isAdmin = activeWorkspace?.role === 'ADMIN';
  const myTeams = teams.filter((t) => t.members.some((m) => m.userId === userId));
  const peopleCount = activeWorkspace?._count?.members;

  const openCreate = () => {
    if (!isAdmin) return toast.error('Only workspace admins can create teams');
    setModalOpen(true);
  };

  return (
    <>
      <div className="w-full h-full flex flex-col text-[color:var(--c-e5e5e5)] overflow-hidden">
        <SidebarHeader
          title="Teams"
          onCollapse={onCollapse}
          action={
            <button
              onClick={openCreate}
              aria-label="Create team"
              title="Create team"
              className="h-7 w-8 flex items-center justify-center rounded-md border border-[color:var(--c-444548)] text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] transition"
            >
              <Plus className="h-4 w-4" />
            </button>
          }
        />

        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar">
          <TeamNavLink icon={Users} label="All Teams" href="/teams" active={pathname === '/teams'} count={teams.length} />
          <TeamNavLink icon={Contact} label="All People" href="/members" active={false} count={peopleCount} />
          <SoonItem icon={Network} label="Org Chart" />
          <SoonItem icon={Radio} label="Analytics" />

          <div className="my-2 border-t border-[color:var(--c-333438)]" />

          <p className="px-2.5 pt-1 pb-1.5 text-[12.5px] font-semibold text-[color:var(--c-8a8c91)]">My Teams</p>
          {myTeams.map((team) => {
            const href = `/teams/${team.id}`;
            return (
              <Link key={team.id} href={href} className={`${row} ${rowState(pathname === href)}`}>
                <span className="flex items-center gap-2.5 min-w-0">
                  <SpaceIcon name={team.name} icon={team.icon} color={team.color} size={20} className="rounded-full" />
                  <span className="text-[14px] truncate">{team.name}</span>
                </span>
              </Link>
            );
          })}
          {myTeams.length === 0 && (
            <p className="px-2.5 py-1 text-[12.5px] text-[color:var(--c-8a8c91)]">You are not in any team yet.</p>
          )}
        </nav>
      </div>

      <NewTeamModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={(t) => router.push(`/teams/${t.id}`)} />
    </>
  );
}

function TeamNavLink({ icon: Icon, label, href, active, count }: { icon: LucideIcon; label: string; href: string; active: boolean; count?: number }) {
  return (
    <Link href={href} className={`${row} ${rowState(active)}`}>
      <span className="flex items-center gap-2.5 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-[color:var(--c-8a8c91)] group-hover:text-[color:var(--c-white)] transition-colors" />
        <span className="text-[14px] truncate">{label}</span>
      </span>
      {count !== undefined && <span className="text-[12px] text-[color:var(--c-8a8c91)]">{count}</span>}
    </Link>
  );
}

function SoonItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button onClick={() => toast.info(`${label} is coming soon`)} className={`${row} ${rowState(false)}`}>
      <span className="flex items-center gap-2.5 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-[color:var(--c-8a8c91)] group-hover:text-[color:var(--c-white)] transition-colors" />
        <span className="text-[14px] truncate">{label}</span>
      </span>
    </button>
  );
}

// frontend/app/(app)/members/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { lazyOnOpen } from '@/components/LazyMount';

import { MembersSkeleton } from '@/components/skeletons';
import { Plus, Search, Trash2, ChevronDown, Upload, MoreHorizontal, Check } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const InviteMemberModal = lazyOnOpen(() => import('@/components/InviteMemberModal'));

const JOB_TITLES = [
  'Fullstack Developer', 'Frontend Developer', 'Backend Developer',
  'UI/UX Designer', 'Product Manager', 'Project Manager',
  'QA Engineer', 'DevOps Engineer', 'Data Scientist',
  'Marketing Manager', 'Sales Executive', 'BD Manager',
  'Content Writer', 'HR Manager', 'Finance Manager',
  'Support Specialist', 'Scrum Master', 'Technical Lead',
  'Growth Hacker', 'Intern',
];

type RoleFilter = 'ALL' | 'OWNER' | 'ADMIN' | 'MEMBER';

interface Member {
  id: string;
  role: string;
  jobTitle: string | null;
  createdAt?: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

const GRID = 'grid grid-cols-[minmax(240px,2fr)_minmax(220px,2fr)_110px_minmax(170px,1.5fr)_110px_48px] items-center gap-4 px-3';

const roleLabel = (role: string, isOwner: boolean) =>
  isOwner ? 'Owner' : role === 'ADMIN' ? 'Admin' : 'Member';

function Avatar({ name, src }: { name: string; src: string | null }) {
  return src ? (
    <Image
      src={src}
      alt={name}
      width={28}
      height={28}
      className="h-7 w-7 rounded-full object-cover flex-shrink-0"
      referrerPolicy="no-referrer"
    />
  ) : (
    <div className="h-7 w-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
      {name[0]?.toUpperCase()}
    </div>
  );
}

export default function MembersPage() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const currentUser = useAuthStore((s) => s.user);

  const [members, setMembers] = useState<Member[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  const fetchMembers = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ workspace: { ownerId?: string; members: Member[] } }>(
        `/workspaces/${activeWorkspace.id}`,
      );
      setMembers(data.workspace.members);
      setOwnerId(data.workspace.ownerId ?? null);
    } catch (err) {
      console.error('Failed to fetch members', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, [activeWorkspace]);

  const handleUpdate = async (memberId: string, patch: { role?: string; jobTitle?: string }) => {
    try {
      await api.patch(`/workspaces/${activeWorkspace!.id}/members/${memberId}`, patch);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...patch } : m)));
      toast.success('Member updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to update member');
    }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from this workspace?`)) return;
    try {
      await api.delete(`/workspaces/${activeWorkspace!.id}/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success('Member removed');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to remove member');
    }
  };

  const isOwnerMember = (m: Member) => !!ownerId && m.user.id === ownerId;

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const matchesSearch =
        !q ||
        m.user.name.toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q) ||
        (m.jobTitle ?? '').toLowerCase().includes(q);
      const matchesRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'OWNER' ? isOwnerMember(m) : !isOwnerMember(m) && m.role === roleFilter);
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter, ownerId]);

  const isAdmin = members.find((m) => m.user.id === currentUser?.id)?.role === 'ADMIN';

  const handleExport = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ['Name', 'Email', 'Role', 'Job title', 'Invited'],
      ...filteredMembers.map((m) => [
        m.user.name,
        m.user.email,
        roleLabel(m.role, isOwnerMember(m)),
        m.jobTitle ?? '',
        m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '',
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeWorkspace?.name ?? 'workspace'}-people.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <MembersSkeleton />;
  }

  const filterLabels: Record<RoleFilter, string> = {
    ALL: 'All Users',
    OWNER: 'Owners',
    ADMIN: 'Admins',
    MEMBER: 'Members',
  };
  const filterCount = filteredMembers.length;

  return (
    <div className="px-4 sm:px-8 pt-8 pb-10 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-bold text-foreground">Manage people</h1>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-md bg-muted/60 hover:bg-muted px-3 py-2 text-sm font-medium text-foreground transition"
        >
          <Upload className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      {/* Search / invite bar */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2 focus-within:border-muted-foreground/60 transition">
        <Search className="h-4 w-4 text-foreground flex-shrink-0" />
        <input
          type="text"
          placeholder="Search or invite by email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        {isAdmin && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3.5 py-2 text-sm font-semibold text-background hover:opacity-90 transition flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Invite people
          </button>
        )}
      </div>

      {/* Filter chip */}
      <div className="mt-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 hover:bg-muted px-3 py-1 text-xs font-semibold text-foreground outline-none transition">
            {filterLabels[roleFilter]} ({filterCount})
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {(Object.keys(filterLabels) as RoleFilter[]).map((key) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setRoleFilter(key)}
                className="text-xs cursor-pointer justify-between"
              >
                {filterLabels[key]}
                {roleFilter === key && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Column headers */}
          <div className={`${GRID} border-y border-border py-3 text-xs text-muted-foreground`}>
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Job title</div>
            <div>Invited</div>
            <div />
          </div>

          {/* Invite row */}
          {isAdmin && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className={`${GRID} w-full text-left py-3 border-b border-border hover:bg-accent/30 transition`}
            >
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-full bg-muted/70 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-3.5 w-3.5 text-foreground" />
                </span>
                <span className="text-sm font-semibold text-foreground">Invite people</span>
              </div>
            </button>
          )}

          {filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No people found matching your filters.
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isMe = member.user.id === currentUser?.id;
              const isOwner = isOwnerMember(member);
              const canEdit = isAdmin && !isOwner;
              const canRemove = isAdmin && !isMe && !isOwner;

              return (
                <div
                  key={member.id}
                  className={`${GRID} py-3 border-b border-border/60 hover:bg-accent/30 transition`}
                >
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={member.user.name} src={member.user.avatar} />
                    <span className="text-sm font-semibold text-foreground truncate">
                      {member.user.name}
                      {isMe && !isOwner && <span className="text-muted-foreground font-normal"> (You)</span>}
                    </span>
                    {isOwner && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-foreground flex-shrink-0">
                        Owner
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="text-sm text-foreground truncate">{member.user.email}</div>

                  {/* Role */}
                  <div className="text-xs text-foreground">
                    {canEdit && !isMe ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center gap-1 -ml-1.5 px-1.5 py-1 rounded hover:bg-muted outline-none">
                          {roleLabel(member.role, false)}
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-32">
                          {(['ADMIN', 'MEMBER'] as const).map((r) => (
                            <DropdownMenuItem
                              key={r}
                              onClick={() => handleUpdate(member.id, { role: r })}
                              className="text-xs cursor-pointer justify-between"
                            >
                              {roleLabel(r, false)}
                              {member.role === r && <Check className="h-3 w-3" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      roleLabel(member.role, isOwner)
                    )}
                  </div>

                  {/* Job title */}
                  <div className="min-w-0 text-xs text-foreground">
                    {isAdmin ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center gap-1 -ml-1.5 px-1.5 py-1 rounded hover:bg-muted outline-none max-w-full">
                          <span className="truncate">{member.jobTitle || 'Select title...'}</span>
                          <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto z-50">
                          {JOB_TITLES.map((title) => (
                            <DropdownMenuItem
                              key={title}
                              onClick={() => handleUpdate(member.id, { jobTitle: title })}
                              className="text-xs cursor-pointer"
                            >
                              {title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="truncate block">{member.jobTitle || '—'}</span>
                    )}
                  </div>

                  {/* Invited (joined date) */}
                  <div className="text-xs text-foreground">
                    {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '—'}
                  </div>

                  {/* Row actions */}
                  <div className="flex justify-end">
                    {canRemove && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted outline-none">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => handleRemove(member.id, member.user.name)}
                            className="text-xs cursor-pointer text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove from workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => { setInviteModalOpen(false); fetchMembers(); }}
      />
    </div>
  );
}

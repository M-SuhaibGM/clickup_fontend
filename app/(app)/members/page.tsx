// frontend/app/(app)/members/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import InviteMemberModal from '@/components/InviteMemberModal';
import { Users, Plus, Mail, Shield, User as UserIcon, Search, Trash2, ChevronDown, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const JOB_TITLES = [
  'Fullstack Developer', 'Frontend Developer', 'Backend Developer',
  'UI/UX Designer', 'Product Manager', 'Project Manager',
  'QA Engineer', 'DevOps Engineer', 'Data Scientist',
  'Marketing Manager', 'Sales Executive', 'BD Manager',
  'Content Writer', 'HR Manager', 'Finance Manager',
  'Support Specialist', 'Scrum Master', 'Technical Lead',
  'Growth Hacker', 'Intern',
];

interface Member {
  id: string;
  role: string;
  jobTitle: string | null;
  user: { id: string; name: string; email: string; avatar: string | null; };
}

export default function MembersPage() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const currentUser = useAuthStore((s) => s.user);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MEMBER'>('ALL');

  const fetchMembers = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ workspace: { members: Member[] } }>(`/workspaces/${activeWorkspace.id}`);
      setMembers(data.workspace.members);
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
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, ...patch } : m));
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

  // Filter logic
  const filteredMembers = members.filter((m) => {
    const matchesSearch = 
      m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.jobTitle ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Check if current user is an Admin
  const isAdmin = members.find((m) => m.user.id === currentUser?.id)?.role === 'ADMIN';

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 sm:h-6 w-5 sm:w-6 text-indigo-500" /> Members
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage who has access to <span className="font-semibold text-foreground">{activeWorkspace?.name}</span>
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Add Member
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 sm:py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="rounded-lg border border-input bg-background px-3 py-2.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-[160px]"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admins</option>
          <option value="MEMBER">Members</option>
        </select>
      </div>

      {/* Content Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Desktop Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-border bg-muted/50 px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          <div className="col-span-5">User</div>
          <div className="col-span-3">Job Title</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 sm:px-6 sm:py-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-muted-foreground text-sm">
            No members found matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredMembers.map((member) => {
              const isMe = member.user.id === currentUser?.id;

              return (
                <div key={member.id} className="p-4 sm:px-6 sm:py-4 hover:bg-accent/30 transition">
                  {/* MOBILE VIEW (Card Layout) */}
                  <div className="flex sm:hidden flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {member.user.avatar ? (
                          <Image src={member.user.avatar} alt={member.user.name} width={40} height={40} className="h-10 w-10 rounded-full border border-border object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                            {member.user.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate text-sm">
                            {member.user.name} {isMe && <span className="text-muted-foreground font-normal">(You)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3 flex-shrink-0" /> {member.user.email}
                          </p>
                        </div>
                      </div>

                      {isAdmin && !isMe ? (
                        <button
                          onClick={() => handleRemove(member.id, member.user.name)}
                          className="text-muted-foreground hover:text-red-600 p-2 rounded-lg bg-muted/40"
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      {/* Mobile Job Title Dropdown with Proper Alignment */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        {isAdmin ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 text-foreground hover:bg-muted px-2 py-1 rounded border border-border truncate max-w-[140px]">
                              <span className="truncate">{member.jobTitle || 'Select title...'}</span>
                              <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              side="bottom" 
                              align="start" 
                              className="w-48 max-h-60 overflow-y-auto z-50"
                            >
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
                          <span className="text-foreground truncate">{member.jobTitle || '—'}</span>
                        )}
                      </div>

                      {/* Role Selector (Mobile) */}
                      <div>
                        {isAdmin && !isMe ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdate(member.id, { role: e.target.value })}
                            className={`text-xs font-semibold rounded-full px-2.5 py-1 border-none outline-none cursor-pointer ${
                              member.role === 'ADMIN' 
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' 
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MEMBER">MEMBER</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            member.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-muted text-muted-foreground'
                          }`}>
                            {member.role === 'ADMIN' ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />} {member.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DESKTOP VIEW (Grid Row Layout) */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                    {/* User */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      {member.user.avatar ? (
                        <Image src={member.user.avatar} alt={member.user.name} width={40} height={40} className="h-10 w-10 rounded-full border border-border object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                          {member.user.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {member.user.name} {isMe && <span className="text-muted-foreground font-normal">(You)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><Mail className="h-3 w-3" /> {member.user.email}</p>
                      </div>
                    </div>

                    {/* Job Title Dropdown (Desktop) */}
                    <div className="col-span-3 min-w-0">
                      {isAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex items-center gap-1 text-xs text-foreground hover:bg-muted px-2 py-1 rounded border border-transparent hover:border-border transition max-w-full truncate">
                            <span className="truncate">{member.jobTitle || 'Select title...'}</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            side="bottom" 
                            align="start" 
                            className="w-48 max-h-60 overflow-y-auto z-50"
                          >
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
                        <span className="text-xs text-foreground truncate block">{member.jobTitle || '—'}</span>
                      )}
                    </div>

                    {/* Role Toggle */}
                    <div className="col-span-2">
                      {isAdmin && !isMe ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdate(member.id, { role: e.target.value })}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 border-none outline-none cursor-pointer ${
                            member.role === 'ADMIN' 
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="MEMBER">MEMBER</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          member.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-muted text-muted-foreground'
                        }`}>
                          {member.role === 'ADMIN' ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />} {member.role}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 text-right">
                      {isAdmin && !isMe ? (
                        <button
                          onClick={() => handleRemove(member.id, member.user.name)}
                          className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 p-1.5 rounded transition"
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <InviteMemberModal 
        open={inviteModalOpen} 
        onClose={() => { setInviteModalOpen(false); fetchMembers(); }} 
      />
    </div>
  );
}
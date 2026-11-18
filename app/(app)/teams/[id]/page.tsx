'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Bookmark, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiError } from '@/lib/apiError';
import { useTeamStore } from '@/store/teamStore';
import { useUserStore } from '@/store/userStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import SpaceIcon from '@/components/SpaceIcon';
import UserAvatar from '@/components/UserAvatar';
import { lazyOnOpen } from '@/components/LazyMount';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const InviteMemberModal = lazyOnOpen(() => import('@/components/InviteMemberModal'));

const TABS = ['Overview', 'Analytics', 'Priorities', 'Team', 'Team Chart', 'StandUp', 'Workload', 'Timesheet'];

const card = 'rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)]';

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const team = useTeamStore((s) => s.teams.find((t) => t.id === id));
  const loaded = useTeamStore((s) => s.loaded);
  const { updateTeam, deleteTeam, addMember, removeMember } = useTeamStore.getState();
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const users = useUserStore((s) => s.users);
  const usersLoading = useUserStore((s) => s.loading);
  const isAdmin = activeWorkspace?.role === 'ADMIN';

  const [description, setDescription] = useState<string | null>(null); // null = untouched, show saved value
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeWorkspace) useUserStore.getState().fetchUsers(activeWorkspace.id);
  }, [activeWorkspace]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [pickerOpen]);

  const addable = useMemo(() => {
    const inTeam = new Set(team?.members.map((m) => m.userId));
    return users.filter((u) => !inTeam.has(u.id));
  }, [users, team]);

  if (!team) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-[color:var(--c-8a8c91)]">
        {loaded ? (
          <div>
            <p className="text-[color:var(--c-white)] font-semibold mb-1">Team not found</p>
            <Link href="/teams" className="text-sm text-indigo-400 hover:underline">Back to all teams</Link>
          </div>
        ) : (
          <span className="text-sm">Loading…</span>
        )}
      </div>
    );
  }

  const handle = team.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const saved = team.description ?? '';

  const run = async (fn: () => Promise<unknown>, fallback: string) => {
    try {
      await fn();
      return true;
    } catch (err) {
      toast.error(apiError(err, fallback));
      return false;
    }
  };

  const saveDescription = async () => {
    const next = (description ?? saved).trim();
    if (next === saved) return setDescription(null);
    if (await run(() => updateTeam(team.id, { description: next || null }), 'Failed to save description')) setDescription(null);
  };

  const onDelete = async () => {
    setDeleting(true);
    const ok = await run(() => deleteTeam(team.id), 'Failed to delete team');
    setDeleting(false);
    if (ok) {
      toast.success(`Team "${team.name}" deleted`);
      router.push('/teams');
    }
  };

  return (
    <div className="min-h-full bg-[color:var(--c-121212)] text-[color:var(--c-white)]">
      {/* Header */}
      <div className="px-4 pt-3 border-b border-[color:var(--c-2a2b2e)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <SpaceIcon name={team.name} icon={team.icon} color={team.color} size={28} className="rounded-full" />
            <h1 className="text-[18px] font-bold truncate">{team.name}</h1>
            <span className="rounded bg-[color:var(--c-2a2b2e)] px-1.5 py-0.5 text-[12px] text-[color:var(--c-e5e5e5)]">@{handle}</span>
          </div>

          {isAdmin && (
            <div className="relative flex items-center gap-2" ref={pickerRef}>
              <button
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete team"
                title="Delete team"
                className="h-8 w-8 flex items-center justify-center rounded-md text-[color:var(--c-8a8c91)] hover:text-red-400 hover:bg-[color:var(--c-2a2b2e)] transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPickerOpen((v) => !v)}
                aria-expanded={pickerOpen}
                className="rounded-md bg-[color:var(--c-white)] px-3 py-1.5 text-[13px] font-semibold text-[color:var(--c-1e1f21)] hover:opacity-85 transition"
              >
                Add member
              </button>
              {pickerOpen && <MemberPicker users={addable} loading={usersLoading} onInvite={() => { setPickerOpen(false); setInviteOpen(true); }} onPick={async (uid) => { setPickerOpen(false); await run(() => addMember(team.id, uid), 'Failed to add member'); }} />}
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => tab !== 'Overview' && toast.info(`${tab} is coming soon`)}
              className={`shrink-0 px-2.5 py-2 text-[13px] font-medium border-b-2 transition ${
                tab === 'Overview'
                  ? 'border-[color:var(--c-white)] text-[color:var(--c-white)]'
                  : 'border-transparent text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div className="h-36" style={{ background: `linear-gradient(120deg, ${team.color}, #7c3aed 55%, #1e3a8a)` }} />

      <div className="-mt-20 px-4 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 max-w-6xl mx-auto">
        <div className="space-y-4 min-w-0">
          <div className={`${card} p-1`}>
            <textarea
              value={description ?? saved}
              readOnly={!isAdmin}
              maxLength={2000}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              placeholder={isAdmin ? 'Add Team description, information, and wiki' : 'No description yet'}
              className="w-full min-h-[88px] resize-y bg-transparent p-3 text-[13.5px] text-[color:var(--c-white)] placeholder:text-[color:var(--c-8a8c91)] outline-none"
            />
          </div>

          <div className={`${card} p-4`}>
            <h2 className="text-[15px] font-semibold mb-6">Bookmarks</h2>
            <div className="flex flex-col items-center text-center pb-4">
              <div className="mb-3 h-14 w-14 rounded-xl border border-[color:var(--c-333438)] flex items-center justify-center">
                <Bookmark className="h-6 w-6 text-[color:var(--c-8a8c91)]" />
              </div>
              <p className="text-[12.5px] text-[color:var(--c-8a8c91)] max-w-xs">
                Bookmarks make it easy to save items or any URL from around the web.
              </p>
              <button
                onClick={() => toast.info('Bookmarks are coming soon')}
                className="mt-3 rounded-md bg-[color:var(--c-white)] px-3 py-1.5 text-[12.5px] font-semibold text-[color:var(--c-1e1f21)] hover:opacity-85 transition"
              >
                Add Bookmark
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${card} p-4`}>
            <h2 className="text-[15px] font-semibold mb-3">
              Members <span className="text-[12px] font-normal text-[color:var(--c-8a8c91)]">{team.members.length}</span>
            </h2>
            <ul className="space-y-1">
              {team.members.map((m) => (
                <li key={m.id} className="group flex items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-[color:var(--c-2a2b2e)]">
                  <UserAvatar name={m.user.name} src={m.user.avatar} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] truncate">{m.user.name}</span>
                    <span className="block text-[11.5px] text-[color:var(--c-8a8c91)] truncate">{m.user.email}</span>
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => run(() => removeMember(team.id, m.userId), 'Failed to remove member')}
                      aria-label={`Remove ${m.user.name}`}
                      title="Remove from team"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-[color:var(--c-8a8c91)] hover:text-red-400 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <AlertDialog open={confirmDelete} onOpenChange={(o) => { if (!o && !deleting) setConfirmDelete(false); }}>
        <AlertDialogContent className="bg-[color:var(--c-232426)] border-[color:var(--c-333438)] text-[color:var(--c-white)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team</AlertDialogTitle>
            <AlertDialogDescription className="text-[color:var(--c-8a8c91)]">
              Delete <span className="font-semibold text-[color:var(--c-white)]">&quot;{team.name}&quot;</span>? Its members stay in the workspace; only the team is removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)] border-[color:var(--c-333438)] hover:bg-[color:var(--c-333438)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); onDelete(); }} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MemberPicker({ users, loading, onInvite, onPick }: { users: { id: string; name: string; email: string; avatar: string | null }[]; loading: boolean; onInvite: () => void; onPick: (id: string) => void }) {
  return (
    <div className="absolute right-0 top-10 z-20 w-64 max-h-72 overflow-y-auto rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] p-1.5 shadow-2xl custom-scrollbar">
      {users.length === 0 ? (
        loading ? (
          <p className="px-3 py-4 text-center text-[12.5px] text-[color:var(--c-8a8c91)]">Loading people…</p>
        ) : (
          <div className="px-3 py-4 text-center">
            <p className="text-[12.5px] text-[color:var(--c-8a8c91)]">Everyone in the workspace is already in this team.</p>
            <button
              onClick={onInvite}
              className="mt-3 rounded-md bg-[color:var(--c-2a2b2e)] px-3 py-1.5 text-[12.5px] font-medium text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)] transition"
            >
              Invite people to the workspace
            </button>
          </div>
        )
      ) : (
        users.map((u) => (
          <button
            key={u.id}
            onClick={() => onPick(u.id)}
            className="w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-[color:var(--c-2a2b2e)] transition"
          >
            <UserAvatar name={u.name} src={u.avatar} size={24} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] truncate">{u.name}</span>
              <span className="block text-[11px] text-[color:var(--c-8a8c91)] truncate">{u.email}</span>
            </span>
            <Plus className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" />
          </button>
        ))
      )}
    </div>
  );
}

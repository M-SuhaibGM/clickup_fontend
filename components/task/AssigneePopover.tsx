'use client';

import { useMemo, useState } from 'react';
import { Ban, Check, ChevronDown, ChevronRight, Loader2, UserPlus } from 'lucide-react';
import type { UserSummary } from '@/store/userStore';
import type { Team } from '@/types/team';
import SpaceIcon from '../SpaceIcon';
import UserAvatar from '../UserAvatar';
import { popoverCls, useDismiss } from './FieldRow';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const label = 'px-2.5 pb-1 pt-3 text-[12px] font-semibold text-[color:var(--c-8a8c91)]';
const row = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-[color:var(--c-white)] transition hover:bg-[color:var(--c-333438)]';

interface Props {
  users: UserSummary[];
  teams: Team[];
  me?: { id: string } | null;
  assigneeId: string | null;
  onPick: (user: UserSummary | null) => void;
  /** adds the person with this email to the workspace, then assigns them */
  onInviteEmail: (email: string) => Promise<void>;
  onClose: () => void;
}

/** Assignee picker: People, then Teams (a team expands to its members). */
export default function AssigneePopover({ users, teams, me, assigneeId, onPick, onInviteEmail, onClose }: Props) {
  const ref = useDismiss<HTMLDivElement>(true, onClose);
  const [query, setQuery] = useState('');
  const [openTeam, setOpenTeam] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const q = query.trim().toLowerCase();
  const typedEmail = EMAIL.test(query.trim()) ? query.trim() : null;
  const emailKnown = !!typedEmail && users.some((u) => u.email.toLowerCase() === typedEmail.toLowerCase());

  const myself = users.find((u) => u.id === me?.id);
  const people = useMemo(
    () => users.filter((u) => u.id !== me?.id && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q))),
    [users, me?.id, q]
  );
  const showMe = !!myself && (!q || 'me'.includes(q) || `${myself.name} ${myself.email}`.toLowerCase().includes(q));

  // A team shows when its name matches, or (while searching) when one of its members does
  const visibleTeams = useMemo(
    () => teams.filter((t) => !q || t.name.toLowerCase().includes(q) || t.members.some((m) => `${m.user.name} ${m.user.email}`.toLowerCase().includes(q))),
    [teams, q]
  );

  const personRow = (u: UserSummary, name = u.name, indent = false) => (
    <button key={`${indent ? 't-' : ''}${u.id}`} onClick={() => onPick(u)} className={`${row} ${indent ? 'pl-9' : ''}`}>
      <UserAvatar name={u.name} src={u.avatar} size={24} />
      <span className="flex-1 truncate">{name}</span>
      {u.id === assigneeId && <Check className="h-4 w-4 text-indigo-400" />}
    </button>
  );

  return (
    <div ref={ref} className={`${popoverCls} w-[290px] p-2`}>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search or enter email..."
        className="w-full rounded-lg border border-[color:var(--c-555660)] bg-[color:var(--c-1e1f21)] px-3 py-2 text-[13.5px] text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)] focus:border-indigo-500"
      />

      <div className="max-h-[340px] overflow-y-auto pb-1">
        <p className={label}>People</p>
        {assigneeId && !q && (
          <button onClick={() => onPick(null)} className={`${row} !text-red-400`}>
            <Ban className="h-4 w-4" /> Unassign
          </button>
        )}
        {showMe && myself && personRow(myself, 'Me')}
        {people.map((u) => personRow(u))}
        {!showMe && people.length === 0 && !typedEmail && (
          <p className="px-2.5 py-2 text-[13px] text-[color:var(--c-8a8c91)]">No people match &quot;{query}&quot;</p>
        )}

        {typedEmail && !emailKnown ? (
          <button
            disabled={inviting}
            onClick={async () => {
              setInviting(true);
              try { await onInviteEmail(typedEmail); } finally { setInviting(false); }
            }}
            className={`${row} bg-[color:var(--c-333438)]`}
          >
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            <span className="truncate">Add {typedEmail} and assign</span>
          </button>
        ) : (
          !q && (
            <div className={`${row} cursor-default bg-[color:var(--c-333438)]/60 !text-[color:var(--c-e5e5e5)] hover:!bg-[color:var(--c-333438)]/60`}>
              <UserPlus className="h-4 w-4" /> Keep typing a full email to invite
            </div>
          )
        )}

        {visibleTeams.length > 0 && <p className={label}>Teams</p>}
        {visibleTeams.map((t) => {
          const expanded = openTeam === t.id || (!!q && !t.name.toLowerCase().includes(q));
          return (
            <div key={t.id}>
              <button onClick={() => setOpenTeam(expanded && openTeam === t.id ? null : t.id)} className={row} aria-expanded={expanded}>
                <SpaceIcon name={t.name} icon={t.icon} color={t.color} size={24} className="rounded-full" />
                <span className="flex-1 truncate">{t.name}</span>
                <span className="text-[12px] text-[color:var(--c-8a8c91)]">{t.members.length} {t.members.length === 1 ? 'person' : 'people'}</span>
                {expanded ? <ChevronDown className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" /> : <ChevronRight className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" />}
              </button>
              {expanded && (
                t.members.length === 0 ? (
                  <p className="py-1 pl-9 text-[12.5px] text-[color:var(--c-8a8c91)]">No members yet</p>
                ) : (
                  t.members
                    .filter((m) => !q || t.name.toLowerCase().includes(q) || `${m.user.name} ${m.user.email}`.toLowerCase().includes(q))
                    .map((m) => personRow(m.user, m.userId === me?.id ? 'Me' : m.user.name, true))
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

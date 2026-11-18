'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Asterisk, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiError } from '@/lib/apiError';
import { useSpaceStore } from '@/store/spaceStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Space } from '@/types/space';
import type { Project } from '@/types/project';
import SpaceIcon from './SpaceIcon';
import { SectionAddButton, SectionLabel } from './SidebarSection';
import { lazyOnOpen } from './LazyMount';

const DeleteSpaceDialog = lazyOnOpen(() => import('./DeleteSpaceDialog'), { slideIn: true });

const EMPTY_PROJECTS: Project[] = [];
const iconBtn =
  'p-1 rounded text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)] transition';
const rowBase = 'flex items-center justify-between gap-2 rounded-lg transition-colors';
const rowState = (active: boolean) =>
  active
    ? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)]'
    : 'text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]';

interface Props {
  isAdmin: boolean;
  onCreateProject: (spaceId: string | null) => void;
  onCreateSpace: () => void;
}

/** Spaces → projects (flat rows with their list count). Channels live in their own section. */
export default function SpaceTree({ isAdmin, onCreateProject, onCreateSpace }: Props) {
  const spaces = useSpaceStore((s) => s.spaces);
  const projects = useProjectStore((s) => s.projects);
  const workspaceName = useWorkspaceStore((s) => s.activeWorkspace?.name);
  const pathname = usePathname();
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [deleting, setDeleting] = useState(false);

  const bySpace = useMemo(() => {
    const map: Record<string, Project[]> = {};
    for (const p of projects) (map[p.spaceId ?? ''] ??= []).push(p);
    return map;
  }, [projects]);
  const orphans = bySpace[''] ?? EMPTY_PROJECTS; // projects not yet backfilled into a space

  const confirmDelete = async () => {
    if (!spaceToDelete) return;
    setDeleting(true);
    try {
      await useSpaceStore.getState().deleteSpace(spaceToDelete.id);
      toast.success(`Space "${spaceToDelete.name}" deleted`);
      setSpaceToDelete(null);
    } catch (err) {
      toast.error(apiError(err, 'Failed to delete space'));
    } finally {
      setDeleting(false);
    }
  };

  const doomedProjects = spaceToDelete ? (bySpace[spaceToDelete.id]?.length ?? 0) : 0;

  return (
    <>
      <SectionLabel action={isAdmin ? <SectionAddButton onClick={onCreateSpace} title="New Space" /> : undefined}>
        Spaces
      </SectionLabel>

      <div className="space-y-0.5">
        <Link
          href="/dashboard"
          className={`${rowBase} px-2.5 py-1.5 ${rowState(pathname === '/dashboard')}`}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="h-5 w-5 shrink-0 rounded-md bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] flex items-center justify-center">
              <Asterisk className="h-3.5 w-3.5 text-[color:var(--c-e5e5e5)]" />
            </span>
            <span className="text-[14px] truncate">
              All Tasks
              {workspaceName && <span className="text-[12px] text-[color:var(--c-8a8c91)]"> - {workspaceName}</span>}
            </span>
          </span>
        </Link>

        {spaces.map((space) => (
          <SpaceRow
            key={space.id}
            space={space}
            projects={bySpace[space.id] ?? EMPTY_PROJECTS}
            isAdmin={isAdmin}
            onCreateProject={() => onCreateProject(space.id)}
            onDelete={() => setSpaceToDelete(space)}
          />
        ))}

        {orphans.length > 0 && (
          <div className="pt-1">
            <p className="px-2.5 py-1 text-[12px] text-[color:var(--c-8a8c91)]">Not in a space yet</p>
            {orphans.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
          </div>
        )}

        {isAdmin && (
          <button
            onClick={onCreateSpace}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            <span className="text-[14px]">New Space</span>
          </button>
        )}
      </div>

      <DeleteSpaceDialog
        open={!!spaceToDelete}
        spaceName={spaceToDelete?.name}
        doomedProjects={doomedProjects}
        deleting={deleting}
        onOpenChange={(open) => { if (!open && !deleting) setSpaceToDelete(null); }}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function SpaceRow({
  space, projects, isAdmin, onCreateProject, onDelete,
}: {
  space: Space;
  projects: Project[];
  isAdmin: boolean;
  onCreateProject: () => void;
  onDelete: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(space.name);

  // The space holding the open project is always expanded and highlighted
  const holdsActive = projects.some((p) => pathname === `/projects/${p.id}`);
  const expanded = open || holdsActive;

  const commitRename = async () => {
    const name = draft.trim();
    setRenaming(false);
    if (!name || name === space.name) return setDraft(space.name);
    try {
      await useSpaceStore.getState().updateSpace(space.id, { name });
    } catch (err) {
      setDraft(space.name);
      toast.error(apiError(err, 'Failed to rename space'));
    }
  };

  return (
    <div>
      <div
        onClick={() => !renaming && setOpen((v) => !v)}
        className={`${rowBase} px-2.5 py-1.5 cursor-pointer group ${rowState(holdsActive)}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <SpaceIcon name={space.name} icon={space.icon} color={space.color} size={20} className="rounded-md" />
          {renaming ? (
            <input
              autoFocus
              value={draft}
              maxLength={50}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') { setDraft(space.name); setRenaming(false); }
              }}
              className="min-w-0 flex-1 bg-[color:var(--c-232426)] border border-[color:var(--c-444548)] rounded px-1 text-[14px] text-[color:var(--c-white)] outline-none"
            />
          ) : (
            <span className="text-[14px] text-[color:var(--c-white)] truncate">{space.name}</span>
          )}
        </div>
        {isAdmin && !renaming && (
          <div
            className={`flex items-center gap-0.5 shrink-0 transition ${holdsActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={iconBtn} title="Rename space" onClick={() => { setDraft(space.name); setRenaming(true); }}>
              <Pencil className="h-3 w-3" />
            </button>
            <button className={iconBtn} title="Delete space" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </button>
            <button className={iconBtn} title="New project in this space" onClick={onCreateProject}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
          {projects.length === 0 && (
            <p className="pl-9 pr-2.5 py-1 text-[13px] text-[color:var(--c-8a8c91)]">
              {isAdmin ? (
                <button onClick={onCreateProject} className="hover:text-[color:var(--c-white)] transition">+ Add a project</button>
              ) : (
                'No projects'
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const pathname = usePathname();
  const tab = useSearchParams().get('tab');
  const active = pathname === `/projects/${project.id}` && tab !== 'channel';

  return (
    <Link
      href={`/projects/${project.id}`}
      className={`${rowBase} pl-9 pr-2.5 py-1.5 ${rowState(active)}`}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <ListChecks className="h-4 w-4 shrink-0 text-[color:var(--c-8a8c91)]" />
        <span className="text-[14px] truncate">{project.name}</span>
      </span>
      <span className="text-[12px] text-[color:var(--c-8a8c91)]">{project._count?.lists || 0}</span>
    </Link>
  );
}

/** One channel per project, named after it — a section of its own, below Spaces. */
export function ChannelList() {
  const projects = useProjectStore((s) => s.projects);
  const pathname = usePathname();
  const tab = useSearchParams().get('tab');

  return (
    <>
      <SectionLabel>Channels</SectionLabel>
      <div className="space-y-0.5">
        {projects.map((p) => {
          const active = pathname === `/projects/${p.id}` && tab === 'channel';
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}?tab=channel`}
              className={`${rowBase} px-2.5 py-1.5 ${rowState(active)}`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <ListChecks className="h-4 w-4 shrink-0 text-[color:var(--c-8a8c91)]" />
                <span className="text-[14px] truncate">{p.channel?.name ?? p.name}</span>
              </span>
            </Link>
          );
        })}
        {projects.length === 0 && (
          <p className="px-2.5 py-1 text-[13px] text-[color:var(--c-8a8c91)]">A channel is created with each project</p>
        )}
      </div>
    </>
  );
}

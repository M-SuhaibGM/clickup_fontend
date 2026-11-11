// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Check,
  Plus,
  Users,
  Search,
  X,
  ChevronRight,
  LogOut,
  List as ListIcon,
  Workflow,
  User as UserIcon,
  CheckSquare,
  Settings,
  History,
} from 'lucide-react';
import NewProjectModal from './NewProjectModal';
import InviteMemberModal from './InviteMemberModal';
import NewWorkspaceModal from './Newworkspacemodal';

// ───────── DEBUG: set to false to silence all [Sidebar] logs ─────────
const DEBUG = false;
const dbg = (...args: any[]) => {
  if (DEBUG) console.log('%c[Sidebar]', 'color:#6366f1;font-weight:bold', ...args);
};

// Shared tree row styles
const treeRow =
  'flex items-center gap-2 px-2.5 py-1.5 text-[13px] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50';
const treeRowIdle = 'text-muted-foreground hover:bg-muted hover:text-foreground';
const treeRowActive =
  'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-500/10 dark:text-indigo-300';

function RoleBadge({ owner }: { owner: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
        owner
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
      }`}
    >
      {owner ? 'Owner' : 'Shared'}
    </span>
  );
}

export default function Sidebar({
  onClose,
  onCreateProject,
  onInvite,
  onCreateWorkspace
}: {
  onClose?: () => void;
  onCreateProject?: () => void;
  onInvite?: () => void;
  onCreateWorkspace?: () => void;
}) {
  const pathname = usePathname();
  const projects = useProjectStore((s) => s.projects);
  const listsByProject = useProjectStore((s) => s.listsByProject);
  const fetchProjectLists = useProjectStore((s) => s.fetchProjectLists);
  const user = useAuthStore((s) => s.user);

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Track expansion states
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({});
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // The one owned workspace currently shown in the tree (picked from the top dropdown)
  const [selectedOwnedId, setSelectedOwnedId] = useState<string | null>(null);

  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    pendingTaskCount,
    fetchPendingTaskCount,
  } = useWorkspaceStore();

  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Owned = I'm the workspace's owner (Workspace.ownerId). Everything else I belong to is shared.
  const isOwner = (ws: any) => !!ws && !!user && ws.ownerId === user.id;

  // Admin-only actions (invite) depend on my membership role in the active workspace.
  const isAdmin = activeWorkspace?.role === 'ADMIN';

  const ownedWorkspaces = useMemo(
    () => workspaces.filter((w: any) => !!user && w.ownerId === user.id),
    [workspaces, user]
  );
  const sharedWorkspaces = useMemo(
    () => workspaces.filter((w: any) => !user || w.ownerId !== user.id),
    [workspaces, user]
  );

  const selectedOwned =
    ownedWorkspaces.find((w) => w.id === selectedOwnedId) ??
    (activeWorkspace && isOwner(activeWorkspace) ? activeWorkspace : ownedWorkspaces[0]);

  // Tree shows: the one selected owned workspace + every shared workspace
  const treeWorkspaces = [...(selectedOwned ? [selectedOwned] : []), ...sharedWorkspaces];

  // Keep the selected owned workspace in sync, and auto-expand whatever becomes active
  useEffect(() => {
    if (!activeWorkspace) return;
    if (isOwner(activeWorkspace)) setSelectedOwnedId(activeWorkspace.id);
    setExpandedWorkspaces((prev) => ({ ...prev, [activeWorkspace.id]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id, user?.id]);

  // Refresh pending task count whenever the active workspace changes
  useEffect(() => {
    if (activeWorkspace) {
      fetchPendingTaskCount(activeWorkspace.id);
    }
  }, [activeWorkspace, fetchPendingTaskCount]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node))
        setWorkspaceMenuOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setWorkspaceMenuOpen(false);
        setUserMenuOpen(false);
      }
      // ⌘K / Ctrl+K focuses the search box
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const toggleProject = async (projectId: string) => {
    const isExpanding = !expandedProjects[projectId];
    setExpandedProjects((prev) => ({ ...prev, [projectId]: isExpanding }));

    // Fetch lists if expanding for the first time
    if (isExpanding && !listsByProject[projectId]) {
      await fetchProjectLists(projectId);
    }
  };

  // Select a workspace: make it active, and if it's an owned one, show it in the tree
  const selectWorkspace = (ws: any) => {
    dbg('selectWorkspace:', { id: ws.id, name: ws.name, ownerId: ws.ownerId, isOwner: isOwner(ws) });
    setActiveWorkspace(ws);
    if (isOwner(ws)) setSelectedOwnedId(ws.id);
    setExpandedWorkspaces((prev) => ({ ...prev, [ws.id]: true }));
  };

  // Clicking a workspace header: activate it if needed, otherwise collapse/expand it
  const handleWorkspaceClick = (ws: any) => {
    dbg('workspace header clicked:', ws.name, '| currently active?', activeWorkspace?.id === ws.id);
    if (activeWorkspace?.id !== ws.id) {
      selectWorkspace(ws);
    } else {
      setExpandedWorkspaces((prev) => ({ ...prev, [ws.id]: !prev[ws.id] }));
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'W';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const trimmedQuery = query.trim().toLowerCase();
  const searchResults = trimmedQuery
    ? workspaces.filter((w) => w.name.toLowerCase().includes(trimmedQuery))
    : [];

  useEffect(() => {
    if (trimmedQuery) dbg(`search "${trimmedQuery}" →`, searchResults.map((w) => w.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedQuery]);

  const renderWorkspace = (ws: any) => {
    const owner = isOwner(ws);
    const isWsExpanded = !!expandedWorkspaces[ws.id];
    const isActiveWs = activeWorkspace?.id === ws.id;
    const canManage = owner || (isActiveWs && isAdmin);

    return (
      <div key={ws.id}>
        {/* Workspace Header */}
        <button
          type="button"
          aria-expanded={isWsExpanded}
          onClick={() => handleWorkspaceClick(ws)}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
            isActiveWs ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : 'hover:bg-muted'
          }`}
        >
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
              isWsExpanded && isActiveWs ? 'rotate-90' : ''
            }`}
          />
          <span
            className={`text-sm font-semibold flex-1 truncate ${
              isActiveWs ? 'text-indigo-700 dark:text-indigo-300' : 'text-foreground'
            }`}
          >
            {ws.name}
          </span>
          <RoleBadge owner={owner} />
        </button>

        {/* Expanded Workspace Contents */}
        {isWsExpanded && isActiveWs && (
          <div className="ml-4 mt-1 mb-2 pl-3 space-y-0.5 border-l border-border/60">
            <Link
              href="/members"
              onClick={onClose}
              className={`${treeRow} ${pathname === '/members' ? treeRowActive : treeRowIdle}`}
            >
              <UserIcon className="h-4 w-4 shrink-0" /> Members
            </Link>
            <Link
              href="/workflows"
              onClick={onClose}
              className={`${treeRow} ${pathname === '/workflows' ? treeRowActive : treeRowIdle}`}
            >
              <Workflow className="h-4 w-4 shrink-0" /> Workflows
            </Link>
            <Link
              href="/my-tasks"
              onClick={onClose}
              className={`${treeRow} ${pathname === '/my-tasks' ? treeRowActive : treeRowIdle} justify-between`}
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 shrink-0" /> My Tasks
              </div>
              {pendingTaskCount > 0 && (
                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                  {pendingTaskCount}
                </span>
              )}
            </Link>
            {canManage && (
              <Link
                href="/settings"
                onClick={onClose}
                className={`${treeRow} ${pathname === '/settings' ? treeRowActive : treeRowIdle}`}
              >
                <Settings className="h-4 w-4 shrink-0" /> Settings
              </Link>
            )}
            {isAdmin && isActiveWs && (
              <Link
                href="/history"
                onClick={onClose}
                className={`${treeRow} ${pathname === '/history' ? treeRowActive : treeRowIdle}`}
              >
                <History className="h-4 w-4 shrink-0" /> History
              </Link>
            )}

            {/* Projects inside Workspace */}
            <div className="pt-3">
              <div className="flex items-center justify-between px-2.5 mb-1 min-h-6">
                <span className="text-[13px] font-medium text-muted-foreground">Projects</span>
                {owner && (
                  <button
                    type="button"
                    aria-label="New project"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateProject?.();
                    }}
                    className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-indigo-600 hover:bg-muted transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>

              {projects.length === 0 && (
                <p className="px-2.5 py-1.5 text-[13px] text-muted-foreground italic">
                  No projects yet
                </p>
              )}

              {projects.map((p) => {
                const isProjExpanded = !!expandedProjects[p.id];
                const isActiveProj = pathname === `/projects/${p.id}`;

                return (
                  <div key={p.id}>
                    <div
                      className={`flex items-center gap-1 pl-1 pr-2 rounded-lg transition-colors ${
                        isActiveProj ? treeRowActive : 'hover:bg-muted'
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={isProjExpanded ? 'Collapse project' : 'Expand project'}
                        aria-expanded={isProjExpanded}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProject(p.id);
                        }}
                        className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform ${
                            isProjExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      <Link
                        href={`/projects/${p.id}`}
                        onClick={onClose}
                        className={`flex-1 flex items-center gap-2 min-w-0 py-1.5 text-[13px] ${
                          isActiveProj ? '' : 'text-foreground/80 hover:text-foreground'
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: p.color || '#6366f1' }}
                        />
                        <span className="truncate">{p.name}</span>
                      </Link>
                    </div>

                    {/* Expanded Project Contents (Lists) */}
                    {isProjExpanded && (
                      <div className="ml-4 mt-0.5 mb-1 pl-3 space-y-0.5 border-l border-border/60">
                        {listsByProject[p.id] ? (
                          listsByProject[p.id].length > 0 ? (
                            listsByProject[p.id].map((list) => (
                              <Link
                                key={list.id}
                                href={`/projects/${p.id}?listId=${list.id}`}
                                onClick={onClose}
                                className={`${treeRow} ${treeRowIdle}`}
                              >
                                <ListIcon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{list.name}</span>
                              </Link>
                            ))
                          ) : (
                            <p className="px-2.5 py-1.5 text-[13px] text-muted-foreground italic">
                              No lists yet
                            </p>
                          )
                        ) : (
                          <p className="px-2.5 py-1.5 text-[13px] text-muted-foreground">
                            Loading lists…
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar container */}
      <aside className="w-64 shrink-0 border-r border-border/80 bg-card/60 backdrop-blur-md flex flex-col h-screen select-none overflow-y-auto">
        {/* 1. Workspace Switcher (Top) */}
        <div className="p-3 border-b border-border/60 relative" ref={workspaceMenuRef}>
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            aria-haspopup="menu"
            aria-expanded={workspaceMenuOpen}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 transition text-left group border border-transparent hover:border-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-sm tracking-wider">
                {getInitials(selectedOwned?.name)}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-foreground leading-snug truncate">
                  {selectedOwned?.name || 'No workspace yet'}
                </p>
                <p className="text-[13px] text-muted-foreground truncate">
                  {selectedOwned ? 'Your workspace' : 'Create one to get started'}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform ${
                workspaceMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {workspaceMenuOpen && (
            <div
              role="menu"
              className="absolute top-[calc(100%+4px)] left-3 right-3 bg-popover border border-border rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in-80 zoom-in-95"
            >
              <div className="px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground">
                Your workspaces
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5 mb-1">
                {ownedWorkspaces.length === 0 && (
                  <p className="px-2.5 py-2 text-sm text-muted-foreground italic">
                    You don’t own a workspace yet
                  </p>
                )}
                {ownedWorkspaces.map((ws) => (
                  <button
                    key={ws.id}
                    role="menuitem"
                    onClick={() => {
                      selectWorkspace(ws);
                      setWorkspaceMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 text-sm rounded-lg transition flex items-center justify-between ${
                      selectedOwned?.id === ws.id
                        ? 'bg-indigo-50/80 text-indigo-950 font-semibold dark:bg-indigo-950/50 dark:text-indigo-200'
                        : 'text-foreground/80 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-[11px] font-bold shrink-0">
                        {getInitials(ws.name)}
                      </span>
                      <span className="truncate">{ws.name}</span>
                    </div>
                    {selectedOwned?.id === ws.id && (
                      <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-border/60 pt-1 space-y-0.5">
                <button
                  role="menuitem"
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    onCreateWorkspace?.();
                  }}
                  className="w-full text-left px-2.5 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 rounded-lg transition flex items-center gap-2 font-medium"
                >
                  <Plus className="h-4 w-4" /> Create workspace
                </button>
                {activeWorkspace && isAdmin && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      setInviteModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 rounded-lg transition flex items-center gap-2 font-medium"
                  >
                    <Users className="h-4 w-4" /> Invite members
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Search Bar */}
        <div className="px-3 pt-3 pb-1">
          <label className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-muted-foreground hover:border-border transition focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/30 cursor-text">
            <Search className="h-4 w-4 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setQuery('');
                  e.currentTarget.blur();
                }
                if (e.key === 'Enter' && searchResults.length > 0) {
                  selectWorkspace(searchResults[0]);
                  setQuery('');
                }
              }}
              placeholder="Search workspaces…"
              aria-label="Search workspaces"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground select-text"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="text-[11px] bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                ⌘K
              </kbd>
            )}
          </label>
        </div>

        {/* 3. Navigation Tree */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Workspaces">
          {trimmedQuery ? (
            searchResults.length > 0 ? (
              <>
                <p className="px-2.5 pb-1 text-[13px] font-medium text-muted-foreground">
                  {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                </p>
                {searchResults.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      selectWorkspace(ws);
                      setQuery('');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  >
                    <span className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-[11px] font-bold shrink-0">
                      {getInitials(ws.name)}
                    </span>
                    <span className="text-sm font-medium flex-1 truncate">{ws.name}</span>
                    <RoleBadge owner={isOwner(ws)} />
                  </button>
                ))}
              </>
            ) : (
              <p className="px-2.5 py-2 text-sm text-muted-foreground">
                No workspaces match “{query.trim()}”
              </p>
            )
          ) : (
            treeWorkspaces.map((ws) => renderWorkspace(ws))
          )}
        </nav>

        {/* 4. User Profile Footer */}
        <div className="p-3 border-t border-border/60 relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 transition text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-full border border-border object-cover shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-[13px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                userMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              className="absolute bottom-[calc(100%+4px)] left-3 right-3 bg-popover border border-border rounded-xl shadow-xl z-50 p-1.5"
            >
              <button
                role="menuitem"
                className="w-full text-left px-2.5 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition flex items-center gap-2 font-medium"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        // onInvite={onInvite}
      />
    </>
  );
}
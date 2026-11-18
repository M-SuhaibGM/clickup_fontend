'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { AuditLogsSkeleton } from '@/components/skeletons';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityName: string;
  metadata?: unknown;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

interface WorkspaceResponse {
  workspace: { ownerId?: string; members: { userId: string; role: string }[] };
}

const PAGE_SIZES = [10, 25, 50, 100];

/** Colour of the uppercase action label, by what the action does. */
const ACTION_STYLES: Record<string, string> = {
  created: 'text-emerald-600 dark:text-emerald-400',
  added: 'text-emerald-600 dark:text-emerald-400',
  updated: 'text-blue-600 dark:text-blue-400',
  renamed: 'text-blue-600 dark:text-blue-400',
  deleted: 'text-red-600 dark:text-red-400',
  removed: 'text-red-600 dark:text-red-400',
};
const actionStyle = (action: string) => ACTION_STYLES[action] ?? 'text-amber-600 dark:text-amber-400';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

// Shared by the header and every row so the columns line up.
const GRID = 'grid grid-cols-[minmax(170px,1.5fr)_minmax(120px,1.2fr)_minmax(90px,0.8fr)_minmax(80px,0.8fr)_minmax(110px,1fr)] gap-x-4 items-center px-4';

function Avatar({ name, src }: { name: string; src: string | null }) {
  return src ? (
    <Image
      src={src}
      alt={name}
      width={36}
      height={36}
      className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
      referrerPolicy="no-referrer"
    />
  ) : (
    <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function AuditLogsPage() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  // Which workspace the data on screen belongs to; loading until it matches the active one.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Activity | null>(null);

  const workspaceId = activeWorkspace?.id;

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    (async () => {
      try {
        // The activities endpoint is admin-only (403 otherwise); the workspace call only supplies roles.
        const [{ data }, ws] = await Promise.all([
          api.get<{ activities: Activity[] }>(`/workspaces/${workspaceId}/activities`),
          api.get<WorkspaceResponse>(`/workspaces/${workspaceId}`).catch(() => null),
        ]);
        if (cancelled) return;
        const ownerId = ws?.data.workspace.ownerId;
        const map: Record<string, string> = {};
        for (const m of ws?.data.workspace.members ?? []) {
          map[m.userId] = m.userId === ownerId ? 'Owner' : m.role === 'ADMIN' ? 'Admin' : 'Member';
        }
        setRoles(map);
        setActivities(data.activities);
        setIsAdmin(true);
      } catch (err) {
        if (cancelled) return;
        if ((err as { response?: { status?: number } })?.response?.status === 403) setIsAdmin(false);
        else toast.error('Failed to load audit logs');
      } finally {
        if (!cancelled) setLoadedFor(workspaceId);
      }
    })();

    // Live updates
    const socket = connectSocket();
    // Rooms don't survive a reconnect (or a failed join) — join again every time the socket (re)connects
    const join = () => socket.emit('join:workspace', workspaceId);
    join();
    socket.on('connect', join);
    const onLogged = (a: Activity) =>
      setActivities((prev) => (prev.some((p) => p.id === a.id) ? prev : [a, ...prev]));
    socket.on('activity:logged', onLogged);

    return () => {
      cancelled = true;
      socket.off('connect', join);
      socket.emit('leave:workspace', workspaceId);
      socket.off('activity:logged', onLogged);
    };
  }, [workspaceId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activities;
    return activities.filter((a) =>
      [a.user.name, a.entityName, a.action, a.entityType, roles[a.user.id] ?? ''].some((v) => v.toLowerCase().includes(q)),
    );
  }, [activities, query, roles]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  if (loadedFor !== workspaceId) return <AuditLogsSkeleton />;

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-8 max-w-xl mx-auto text-center space-y-4 mt-16 sm:mt-20">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">Only workspace admins can view audit logs.</p>
      </div>
    );
  }

  const prevDisabled = current <= 1;
  const nextDisabled = current >= pageCount;

  return (
    <div className="px-4 sm:px-8 py-8 max-w-[1100px] mx-auto w-full">
      <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Monitor any changes made to <span className="font-semibold text-foreground">{activeWorkspace?.name}</span>, its
        spaces, projects and tasks with audit logs.
      </p>

      {/* Filter */}
      <div className="mt-6 flex w-full max-w-xl items-center gap-2 rounded-md border border-border bg-card px-3 py-2 focus-within:border-muted-foreground/70 transition">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Filter"
          aria-label="Filter audit logs"
          className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {/* Table */}
      <div className="mt-6 rounded-lg border border-border bg-card overflow-x-auto">
        <div className="min-w-[760px]">
          <div className={`${GRID} h-10 bg-muted/40 border-b border-border text-xs text-muted-foreground`}>
            <span>User</span>
            <span>Entity</span>
            <span>Action</span>
            <span>Type</span>
            <span>Timestamp</span>
          </div>

          {rows.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <p className="text-sm font-semibold text-foreground">
                {activities.length === 0 ? 'No activity yet' : 'No logs match your filter'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activities.length === 0 ? 'Changes will appear here as they happen.' : 'Try a different search.'}
              </p>
            </div>
          ) : (
            rows.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelected(a)}
                className={`${GRID} group py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-indigo-500/5 transition-colors`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={a.user.name} src={a.user.avatar} />
                  <div className="min-w-0">
                    <p className="text-[13px] text-foreground truncate">{a.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{roles[a.user.id] ?? 'Member'}</p>
                  </div>
                </div>

                <span className="min-w-0">
                  <span className="inline-block max-w-full truncate rounded bg-muted px-2 py-0.5 align-middle text-xs text-muted-foreground" title={a.entityName}>
                    {a.entityName}
                  </span>
                </span>

                <span className={`text-xs font-semibold uppercase tracking-wider ${actionStyle(a.action)}`}>{a.action}</span>

                <span className="text-[13px] text-foreground">{capitalize(a.entityType)}</span>

                <div className="text-[13px]">
                  <div className="group-hover:hidden">
                    <p className="text-foreground">{formatDate(a.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(a.createdAt)}</p>
                  </div>
                  <span className="hidden group-hover:inline text-indigo-500 dark:text-indigo-400">View detail</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer: count, pagination, page size */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <span>{filtered.length} items</span>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setPage(current - 1)}
            disabled={prevDisabled}
            className="text-indigo-500 dark:text-indigo-400 disabled:text-muted-foreground/50 disabled:cursor-not-allowed hover:underline disabled:no-underline"
          >
            Previous
          </button>
          <span className="flex items-center gap-2">
            Page
            <input
              type="number"
              min={1}
              max={pageCount}
              value={current}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) setPage(Math.min(Math.max(n, 1), pageCount));
              }}
              aria-label="Page number"
              className="h-9 w-12 rounded-md border border-border bg-card text-center text-foreground outline-none focus:border-muted-foreground/70 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            of {pageCount}
          </span>
          <button
            onClick={() => setPage(current + 1)}
            disabled={nextDisabled}
            className="text-indigo-500 dark:text-indigo-400 disabled:text-muted-foreground/50 disabled:cursor-not-allowed hover:underline disabled:no-underline"
          >
            Next
          </button>
        </div>

        <label className="flex items-center gap-2">
          Show
          <span className="relative">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-9 appearance-none rounded-md border border-border bg-card pl-3 pr-8 text-foreground outline-none focus:border-muted-foreground/70"
            >
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
          </span>
        </label>
      </div>

      {/* Detail */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Log detail</DialogTitle>
                <DialogDescription>
                  <span className={`font-semibold uppercase ${actionStyle(selected.action)}`}>{selected.action}</span>{' '}
                  {selected.entityType} “{selected.entityName}”
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
                <dt className="text-muted-foreground">User</dt>
                <dd className="text-foreground">{selected.user.name} <span className="text-muted-foreground">· {roles[selected.user.id] ?? 'Member'}</span></dd>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="text-foreground">{capitalize(selected.entityType)}</dd>
                <dt className="text-muted-foreground">Entity</dt>
                <dd className="text-foreground break-words">{selected.entityName}</dd>
                <dt className="text-muted-foreground">Timestamp</dt>
                <dd className="text-foreground">{formatDate(selected.createdAt)} {formatTime(selected.createdAt)}</dd>
                <dt className="text-muted-foreground">Log ID</dt>
                <dd className="text-foreground font-mono text-xs break-all">{selected.id}</dd>
                {selected.metadata != null && (
                  <>
                    <dt className="text-muted-foreground">Metadata</dt>
                    <dd>
                      <pre className="max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs text-foreground">
                        {JSON.stringify(selected.metadata, null, 2)}
                      </pre>
                    </dd>
                  </>
                )}
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

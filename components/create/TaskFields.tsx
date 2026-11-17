'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDashed,
  FileText,
  Flag,
  ListChecks,
  Loader2,
  Plus,
  Search,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useProjectStore } from '@/store/projectStore';
import { useListStore } from '@/store/listStore';
import { useUserStore } from '@/store/userStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

export const STATUSES = [
  { value: 'TODO', label: 'TO DO', icon: Circle, color: '#8a8c91' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS', icon: CircleDashed, color: '#7c3aed' },
  { value: 'DONE', label: 'COMPLETE', icon: CheckCircle2, color: '#22c55e' },
];

export const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: '#8a8c91' },
  { value: 'NORMAL', label: 'Normal', color: '#3b82f6' },
  { value: 'HIGH', label: 'High', color: '#f59e0b' },
  { value: 'URGENT', label: 'Urgent', color: '#ef4444' },
];

export interface TaskDraft {
  listId: string | null;
  status: string;
  priority: string | null; // null = not set → backend default (NORMAL)
  assigneeId: string;
  dueDate: Date | null;
  attachments: { url: string; name: string }[];
}

export const emptyDraft = (listId: string | null): TaskDraft => ({
  listId,
  status: 'TODO',
  priority: null,
  assigneeId: '',
  dueDate: null,
  attachments: [],
});

const RECENT_KEY = 'create:recent-lists';
export function readRecents(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
export function pushRecent(listId: string) {
  try {
    const next = [listId, ...readRecents().filter((id) => id !== listId)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

/** click-outside + toggle helper for a dropdown */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);
  return { open, setOpen, ref };
}

const topChip =
  'flex items-center gap-1.5 rounded-md border border-(--c-333438) px-2.5 py-1 text-[12px] font-medium text-(--c-e5e5e5) transition hover:bg-(--c-2a2b2e)';
const fieldChip =
  'flex items-center gap-1.5 rounded-md border border-(--c-333438) px-2 py-1 text-[12px] font-medium text-(--c-e5e5e5) transition hover:bg-(--c-2a2b2e)';
const menuCls =
  'absolute left-0 top-full z-[320] mt-1 rounded-lg border border-(--c-333438) bg-(--c-1e1f21) shadow-2xl animate-in fade-in duration-100';

function Avatar({ name, avatar, size = 18 }: { name?: string; avatar?: string | null; size?: number }) {
  return avatar ? (
    <Image
      src={avatar}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
      referrerPolicy="no-referrer"
    />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size / 2) }}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </span>
  );
}

// ───────────────────────── List picker ─────────────────────────
function ListPicker({ draft, setDraft }: { draft: TaskDraft; setDraft: (f: (d: TaskDraft) => TaskDraft) => void }) {
  const { open, setOpen, ref } = useDropdown();
  const projects = useProjectStore((s) => s.projects);
  const listsByProject = useProjectStore((s) => s.listsByProject);
  const fetchProjectLists = useProjectStore((s) => s.fetchProjectLists);
  const createList = useListStore((s) => s.createList);
  const workspaceName = useWorkspaceStore((s) => s.activeWorkspace?.name) ?? 'Workspace';

  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [recents, setRecents] = useState<string[]>([]);

  const all = useMemo(
    () =>
      projects.flatMap((p) =>
        (listsByProject[p.id] ?? []).map((l) => ({ id: l.id, name: l.name, projectId: p.id, projectName: p.name, color: p.color })),
      ),
    [projects, listsByProject],
  );
  const selected = all.find((l) => l.id === draft.listId);

  const openMenu = () => {
    setRecents(readRecents());
    setQuery('');
    setAddingIn(null);
    if (selected) setExpanded((e) => ({ ...e, [selected.projectId]: true }));
    setOpen(!open);
  };

  const choose = (id: string) => {
    setDraft((d) => ({ ...d, listId: id }));
    setOpen(false);
  };

  const submitNewList = async (projectId: string) => {
    const name = newListName.trim();
    if (!name) return setAddingIn(null);
    try {
      const list = await createList(projectId, name);
      await fetchProjectLists(projectId);
      setNewListName('');
      setAddingIn(null);
      choose(list.id);
    } catch {
      toast.error('Failed to create list (admins only)');
    }
  };

  const q = query.trim().toLowerCase();
  const searchHits = q
    ? all.filter((l) => l.name.toLowerCase().includes(q) || l.projectName.toLowerCase().includes(q))
    : [];
  const recentLists = recents.map((id) => all.find((l) => l.id === id)).filter(Boolean).slice(0, 2) as typeof all;

  const Row = ({ id, label, sub }: { id: string; label: string; sub?: string }) => (
    <button
      type="button"
      onClick={() => choose(id)}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-(--c-2a2b2e) ${
        draft.listId === id ? 'bg-(--c-2a2b2e)' : ''
      }`}
    >
      <ListChecks className="h-4 w-4 shrink-0 text-(--c-8a8c91)" />
      <span className="flex-1 truncate text-[13px] text-(--c-white)">{label}</span>
      {sub && <span className="truncate text-[11px] text-(--c-8a8c91)">{sub}</span>}
      {draft.listId === id && <Check className="h-4 w-4 shrink-0 text-(--c-white)" />}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={openMenu} className={topChip}>
        <ListChecks className="h-3.5 w-3.5 text-(--c-8a8c91)" />
        <span className="max-w-[200px] truncate">{selected ? selected.name : 'Select List'}</span>
        <ChevronDown className={`h-3 w-3 text-(--c-8a8c91) transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`${menuCls} w-[300px] p-2`}>
          <div className="flex items-center gap-2 rounded-md border border-(--c-white)/80 px-2.5 py-1.5 focus-within:border-(--c-white)">
            <Search className="h-3.5 w-3.5 shrink-0 text-(--c-8a8c91)" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-[13px] text-(--c-white) outline-none placeholder:text-(--c-8a8c91)"
            />
          </div>

          <div className="custom-scrollbar mt-2 max-h-[300px] overflow-y-auto pr-0.5">
            {q ? (
              searchHits.length ? (
                searchHits.map((l) => <Row key={l.id} id={l.id} label={l.name} sub={l.projectName} />)
              ) : (
                <p className="px-2.5 py-3 text-[12px] text-(--c-8a8c91)">No lists found</p>
              )
            ) : (
              <>
                {recentLists.length > 0 && (
                  <>
                    <p className="px-2.5 pt-1.5 pb-1 text-[12px] text-(--c-8a8c91)">Recents</p>
                    {recentLists.map((l) => (
                      <Row key={`r-${l.id}`} id={l.id} label={l.name} sub={l.projectName} />
                    ))}
                  </>
                )}

                <p className="px-2.5 pt-3 pb-1 text-[12px] text-(--c-8a8c91)">Browse</p>
                <div className="flex items-center gap-2.5 px-2.5 py-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-500 text-white">
                    <Users className="h-3 w-3" />
                  </span>
                  <span className="truncate text-[13px] text-(--c-white)">{workspaceName}</span>
                </div>
                <div className="ml-[18px] space-y-0.5 border-l border-(--c-333438) pl-2">
                  {projects.length === 0 && (
                    <p className="px-2.5 py-2 text-[12px] text-(--c-8a8c91)">No projects yet</p>
                  )}
                  {projects.map((p) => {
                    const lists = listsByProject[p.id] ?? [];
                    const isOpen = !!expanded[p.id];
                    return (
                      <div key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setExpanded((e) => ({ ...e, [p.id]: !isOpen }));
                            if (!listsByProject[p.id]) fetchProjectLists(p.id);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-(--c-2a2b2e)"
                        >
                          <ChevronRight className={`h-3 w-3 shrink-0 text-(--c-8a8c91) transition ${isOpen ? 'rotate-90' : ''}`} />
                          <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ background: p.color || '#6366f1' }} />
                          <span className="flex-1 truncate text-[13px] text-(--c-white)">{p.name}</span>
                          <span className="text-[11px] text-(--c-8a8c91)">{lists.length}</span>
                        </button>
                        {isOpen && (
                          <div className="ml-[14px] space-y-0.5 border-l border-(--c-333438) pl-2">
                            {lists.map((l) => (
                              <Row key={l.id} id={l.id} label={l.name} />
                            ))}
                            {lists.length === 0 && addingIn !== p.id && (
                              <p className="px-2.5 py-1 text-[11px] text-(--c-8a8c91)">No lists yet</p>
                            )}
                            {addingIn === p.id ? (
                              <input
                                autoFocus
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                onBlur={() => submitNewList(p.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') submitNewList(p.id);
                                  if (e.key === 'Escape') {
                                    e.stopPropagation();
                                    setNewListName('');
                                    setAddingIn(null);
                                  }
                                }}
                                placeholder="List name"
                                className="my-0.5 w-full rounded-md border border-(--c-333438) bg-transparent px-2 py-1 text-[12px] text-(--c-white) outline-none focus:border-(--c-444548)"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingIn(p.id);
                                  setNewListName('');
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-(--c-8a8c91) hover:bg-(--c-2a2b2e) hover:text-(--c-white)"
                              >
                                <Plus className="h-3.5 w-3.5" /> New list
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Task type (only "Task" exists) ─────────────────────────
function TypeChip() {
  const { open, setOpen, ref } = useDropdown();
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className={topChip}>
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-(--c-8a8c91)">
          <span className="h-1.5 w-1.5 rounded-full bg-(--c-8a8c91)" />
        </span>
        Task
        <ChevronDown className={`h-3 w-3 text-(--c-8a8c91) transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`${menuCls} w-40 p-1`}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-(--c-white) hover:bg-(--c-2a2b2e)"
          >
            Task <Check className="ml-auto h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Status / Assignee / Due / Priority ─────────────────────────
function StatusChip({ draft, setDraft }: { draft: TaskDraft; setDraft: (f: (d: TaskDraft) => TaskDraft) => void }) {
  const { open, setOpen, ref } = useDropdown();
  const cur = STATUSES.find((s) => s.value === draft.status) ?? STATUSES[0];
  const Icon = cur.icon;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md bg-(--c-2a2b2e) px-2.5 py-1 text-[11px] font-bold tracking-wide text-(--c-white) transition hover:bg-(--c-333438)"
      >
        <Icon className="h-3.5 w-3.5" style={{ color: cur.color }} />
        {cur.label}
      </button>
      {open && (
        <div className={`${menuCls} w-44 bg-(--c-2a2b2e) py-1`}>
          {STATUSES.map((s) => {
            const I = s.icon;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, status: s.value }));
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-(--c-white) transition hover:bg-(--c-333438)"
              >
                <I className="h-3.5 w-3.5" style={{ color: s.color }} />
                {s.label}
                {s.value === draft.status && <Check className="ml-auto h-3 w-3 text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssigneeChip({ draft, setDraft }: { draft: TaskDraft; setDraft: (f: (d: TaskDraft) => TaskDraft) => void }) {
  const { open, setOpen, ref } = useDropdown();
  const users = useUserStore((s) => s.users);
  const [search, setSearch] = useState('');
  const selected = users.find((u) => u.id === draft.assigneeId);
  const filtered = users.filter(
    (u) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()),
  );
  const pick = (id: string) => {
    setDraft((d) => ({ ...d, assigneeId: id }));
    setOpen(false);
  };
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setSearch('');
          setOpen(!open);
        }}
        className={fieldChip}
      >
        {selected ? (
          <>
            <Avatar name={selected.name} avatar={selected.avatar} size={16} />
            <span className="max-w-[110px] truncate text-(--c-white)">{selected.name}</span>
          </>
        ) : (
          <>
            <UserRound className="h-3.5 w-3.5 text-(--c-8a8c91)" /> Assignee
          </>
        )}
      </button>
      {open && (
        <div className={`${menuCls} w-56 bg-(--c-2a2b2e) p-2`}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="mb-1.5 w-full rounded border border-(--c-333438) bg-(--c-1e1f21) px-2 py-1 text-xs text-(--c-white) outline-none"
          />
          <div className="custom-scrollbar max-h-36 space-y-0.5 overflow-y-auto">
            <button
              type="button"
              onClick={() => pick('')}
              className="w-full rounded px-2 py-1.5 text-left text-xs text-(--c-8a8c91) transition hover:bg-(--c-333438) hover:text-(--c-white)"
            >
              Unassigned
            </button>
            {filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => pick(u.id)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-(--c-white) transition hover:bg-(--c-333438)"
              >
                <Avatar name={u.name} avatar={u.avatar} />
                <span className="truncate">{u.name}</span>
                {u.id === draft.assigneeId && <Check className="ml-auto h-3 w-3 text-indigo-400" />}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-2 py-1.5 text-xs text-(--c-8a8c91)">No members found</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function quickDates() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = today.getDay();
  const add = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };
  const weekend = add(dow === 6 ? 7 : 6 - dow);
  const nextWeek = add(dow === 1 ? 7 : (8 - dow) % 7);
  const nextWeekend = new Date(weekend);
  nextWeekend.setDate(nextWeekend.getDate() + 7);
  const dayName = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateFmt = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return [
    { label: 'Today', hint: dayName(today), date: today },
    { label: 'Tomorrow', hint: dayName(add(1)), date: add(1) },
    { label: 'This weekend', hint: dayName(weekend), date: weekend },
    { label: 'Next week', hint: dateFmt(nextWeek), date: nextWeek },
    { label: 'Next weekend', hint: dateFmt(nextWeekend), date: nextWeekend },
    { label: '2 weeks', hint: dateFmt(add(14)), date: add(14) },
    { label: '4 weeks', hint: dateFmt(add(28)), date: add(28) },
  ];
}

function calendarDays(year: number, month: number) {
  const startDow = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const prevLast = new Date(year, month, 0).getDate();
  const days: { day: number; current: boolean }[] = [];
  for (let i = startDow - 1; i >= 0; i--) days.push({ day: prevLast - i, current: false });
  for (let d = 1; d <= total; d++) days.push({ day: d, current: true });
  for (let d = 1; days.length < 42; d++) days.push({ day: d, current: false });
  return days;
}

function DueChip({ draft, setDraft }: { draft: TaskDraft; setDraft: (f: (d: TaskDraft) => TaskDraft) => void }) {
  const { open, setOpen, ref } = useDropdown();
  const base = draft.dueDate ?? new Date();
  const [calMonth, setCalMonth] = useState(base.getMonth());
  const [calYear, setCalYear] = useState(base.getFullYear());

  const select = (d: Date | null) => {
    setDraft((x) => ({ ...x, dueDate: d }));
    setOpen(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sel = draft.dueDate ? new Date(draft.dueDate) : null;
  sel?.setHours(0, 0, 0, 0);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          const b = draft.dueDate ?? new Date();
          setCalMonth(b.getMonth());
          setCalYear(b.getFullYear());
          setOpen(!open);
        }}
        className={fieldChip}
      >
        <Calendar className="h-3.5 w-3.5 text-(--c-8a8c91)" />
        {draft.dueDate ? (
          <span className="text-(--c-white)">
            {draft.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        ) : (
          'Due date'
        )}
      </button>

      {open && (
        <div
          className={`${menuCls} w-[460px] max-w-[calc(100vw-32px)] overflow-hidden bg-(--c-2a2b2e)`}
        >
          <div className="flex border-b border-(--c-333438)">
            <div className="flex flex-1 items-center justify-center gap-1.5 border-b-2 border-indigo-500 px-3 py-2 text-xs font-semibold text-(--c-white)">
              <Calendar className="h-3.5 w-3.5" /> Due date
            </div>
          </div>
          <div className="flex">
            <div className="w-[190px] border-r border-(--c-333438) py-1">
              {quickDates().map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => select(o.date)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-(--c-white) transition hover:bg-(--c-333438)"
                >
                  <span>{o.label}</span>
                  <span className="text-[10px] text-(--c-8a8c91)">{o.hint}</span>
                </button>
              ))}
              {sel && (
                <button
                  type="button"
                  onClick={() => select(null)}
                  className="mt-1 flex w-full items-center gap-1.5 border-t border-(--c-333438) px-3 py-1.5 text-xs text-red-400 transition hover:bg-(--c-333438)"
                >
                  <Ban className="h-3 w-3" /> Clear date
                </button>
              )}
            </div>
            <div className="flex-1 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-(--c-white)">
                  {new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalMonth(11);
                        setCalYear(calYear - 1);
                      } else setCalMonth(calMonth - 1);
                    }}
                    className="rounded p-1 text-(--c-8a8c91) transition hover:bg-(--c-333438) hover:text-(--c-white)"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const n = new Date();
                      setCalMonth(n.getMonth());
                      setCalYear(n.getFullYear());
                    }}
                    className="px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalMonth(0);
                        setCalYear(calYear + 1);
                      } else setCalMonth(calMonth + 1);
                    }}
                    className="rounded p-1 text-(--c-8a8c91) transition hover:bg-(--c-333438) hover:text-(--c-white)"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mb-1 grid grid-cols-7">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <div key={d} className="py-1 text-center text-[10px] font-semibold text-(--c-8a8c91)">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays(calYear, calMonth).map((d, i) => {
                  const isToday =
                    d.current && d.day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                  const isSel =
                    d.current && sel && d.day === sel.getDate() && calMonth === sel.getMonth() && calYear === sel.getFullYear();
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!d.current}
                      onClick={() => select(new Date(calYear, calMonth, d.day))}
                      className={[
                        'mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] transition',
                        !d.current ? 'text-(--c-333438)' : 'text-(--c-e5e5e5) hover:bg-(--c-444548)',
                        isToday ? 'bg-indigo-600 font-bold text-white hover:bg-indigo-600' : '',
                        isSel && !isToday ? 'bg-indigo-500/30 font-bold text-indigo-300 ring-1 ring-indigo-500' : '',
                      ].join(' ')}
                    >
                      {d.day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityChip({ draft, setDraft }: { draft: TaskDraft; setDraft: (f: (d: TaskDraft) => TaskDraft) => void }) {
  const { open, setOpen, ref } = useDropdown();
  const cur = PRIORITIES.find((p) => p.value === draft.priority);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={fieldChip}
        style={cur ? { color: cur.color } : undefined}
      >
        <Flag className={`h-3.5 w-3.5 ${cur ? '' : 'text-(--c-8a8c91)'}`} />
        {cur ? cur.label : 'Priority'}
      </button>
      {open && (
        <div className={`${menuCls} w-36 bg-(--c-2a2b2e) py-1`}>
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                setDraft((d) => ({ ...d, priority: p.value }));
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs transition hover:bg-(--c-333438)"
              style={{ color: p.color }}
            >
              <Flag className="h-3.5 w-3.5" />
              {p.label}
              {p.value === draft.priority && <Check className="ml-auto h-3 w-3 text-indigo-400" />}
            </button>
          ))}
          {draft.priority && (
            <button
              type="button"
              onClick={() => {
                setDraft((d) => ({ ...d, priority: null }));
                setOpen(false);
              }}
              className="mt-1 flex w-full items-center gap-2 border-t border-(--c-333438) px-3 py-1.5 text-xs text-red-400 transition hover:bg-(--c-333438)"
            >
              <Ban className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Main ─────────────────────────
export default function TaskFields({
  draft,
  setDraft,
  title,
  setTitle,
  description,
  setDescription,
  titleRef,
  onSubmit,
  uploading,
}: {
  draft: TaskDraft;
  setDraft: (f: (d: TaskDraft) => TaskDraft) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  titleRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: () => void;
  uploading: boolean;
}) {
  const [aiLoading, setAiLoading] = useState(false);

  const writeWithAi = async () => {
    if (aiLoading) return;
    if (!title.trim()) {
      toast.error('Enter a task name first');
      titleRef.current?.focus();
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await api.post<{ reply: string }>('/ai/chat', {
        message: `Write a concise description (2-4 short sentences, plain text, no markdown headings) for a task titled "${title.trim()}". Reply with only the description.`,
        history: [],
      });
      setDescription(data.reply.trim());
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="px-6 pt-5 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <ListPicker draft={draft} setDraft={setDraft} />
        <TypeChip />
      </div>

      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Task Name"
        className="mt-5 w-full bg-transparent text-[22px] font-semibold text-(--c-white) outline-none placeholder:text-(--c-8a8c91)/70"
      />

      <div className="relative mt-4 min-h-[96px]">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="relative z-0 w-full resize-none bg-transparent text-[15px] text-(--c-e5e5e5) outline-none"
        />
        {!description && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-start gap-1.5 text-[15px] text-(--c-8a8c91)">
            <span>Add description, or write with</span>
            <button
              type="button"
              onClick={writeWithAi}
              disabled={aiLoading}
              className="pointer-events-auto flex items-center gap-1 text-(--c-8a8c91) transition hover:text-violet-400"
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              AI
            </button>
          </div>
        )}
        {description && (
          <button
            type="button"
            onClick={writeWithAi}
            disabled={aiLoading}
            className="absolute right-0 bottom-0 z-10 flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-(--c-8a8c91) transition hover:text-violet-400"
          >
            {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Rewrite with AI
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusChip draft={draft} setDraft={setDraft} />
        <AssigneeChip draft={draft} setDraft={setDraft} />
        <DueChip draft={draft} setDraft={setDraft} />
        <PriorityChip draft={draft} setDraft={setDraft} />
      </div>

      {(draft.attachments.length > 0 || uploading) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {draft.attachments.map((a) => (
            <div
              key={a.url}
              className="group flex max-w-[220px] items-center gap-1.5 rounded-md border border-(--c-333438) bg-(--c-232426) px-2 py-1 text-[12px] text-(--c-e5e5e5)"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-(--c-8a8c91)" />
              <span className="truncate">{a.name}</span>
              <button
                type="button"
                aria-label={`Remove ${a.name}`}
                onClick={() => setDraft((d) => ({ ...d, attachments: d.attachments.filter((x) => x.url !== a.url) }))}
                className="text-(--c-8a8c91) hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {uploading && (
            <div className="flex items-center gap-1.5 rounded-md border border-(--c-333438) px-2 py-1 text-[12px] text-(--c-8a8c91)">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
            </div>
          )}
        </div>
      )}
    </div>
  );
}


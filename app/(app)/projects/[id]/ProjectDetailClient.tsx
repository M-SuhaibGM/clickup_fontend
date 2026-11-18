'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { pushRecent } from '@/lib/recents';
import { useListStore } from '@/store/listStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import type { Project } from '@/types/project';
import type { List } from '@/types/list';
import { toast } from 'sonner';
import {
  List as ListIcon,
  LayoutGrid,
  Plus,
  FolderKanban,
  X,
  Share2,
  Trash2,
  Loader2,
  Sparkles,
  Hash,
  Calendar as CalendarIcon,
  GanttChart,
  Table as TableIcon,
  Star,
  ChevronDown,
  Check,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { lazyOnOpen } from '@/components/LazyMount';
import TaskList from '@/components/TaskList';
import BoardView from '@/components/BoardView';

import SpaceIcon from '@/components/SpaceIcon';
import ChannelView from '@/components/ChannelView';
import SocketProvider from '@/components/SocketProvider';
import AppShellSkeleton from '@/components/AppShellSkeleton';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AiDraftModal = lazyOnOpen(() => import('@/components/AiDraftModal'));
const TaskDetailModal = lazyOnOpen(() => import('@/components/TaskDetailModal'));

const EMPTY_LISTS: never[] = [];

type Tab = 'list' | 'board' | 'channel' | 'calendar' | 'gantt' | 'table';
const VIEW_TABS: { id: Tab; label: string; icon: LucideIcon; color: string }[] = [
  { id: 'channel', label: 'Channel', icon: Hash, color: 'bg-indigo-500' },
  { id: 'list', label: 'List', icon: ListIcon, color: 'bg-slate-500' },
  { id: 'board', label: 'Board', icon: LayoutGrid, color: 'bg-blue-500' },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon, color: 'bg-orange-500' },
  { id: 'gantt', label: 'Gantt', icon: GanttChart, color: 'bg-red-500' },
  { id: 'table', label: 'Table', icon: TableIcon, color: 'bg-emerald-500' },
];
const FAV_KEY = 'favorite-projects';

/* ── Sortable Tab ─────────────────────────────────────────── */
function SortableListTab({
  list,
  active,
  onSelect,
  onDelete,
  isAdmin,
}: {
  list: List;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`group relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium cursor-grab active:cursor-grabbing transition-all select-none border ${
        active
          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 shadow-xs dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200'
          : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      }`}
    >
      <ListIcon
        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
          active ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'
        }`}
      />
      <span className="truncate max-w-[140px]">{list.name}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          active
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {list._count?.tasks ?? 0}
      </span>
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded p-0.5 transition"
          title="Delete list"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export default function ProjectDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(searchParams.get('tab') === 'channel' ? 'channel' : 'list');

  // Role & Settings
  const currentUser = useAuthStore((s) => s.user);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [updatingProject, setUpdatingProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  // Favorite star (per browser) and project switcher
  const [favorite, setFavorite] = useState(() => {
    try {
      return (JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as string[]).includes(id);
    } catch {
      return false; // storage unavailable (or server render — the star isn't shown until the project loads)
    }
  });
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const allProjects = useProjectStore((s) => s.projects);
  const siblingProjects = useMemo(() => {
    const spaceId = project?.spaceId ?? null;
    const same = allProjects.filter((p) => p.spaceId === spaceId);
    return same.length ? same : allProjects;
  }, [allProjects, project?.spaceId]);

  useEffect(() => {
    if (!switcherOpen) return;
    const onDown = (e: MouseEvent) => !switcherRef.current?.contains(e.target as Node) && setSwitcherOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSwitcherOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [switcherOpen]);

  const toggleFavorite = () => {
    const next = !favorite;
    setFavorite(next);
    try {
      const set = new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as string[]);
      if (next) set.add(id); else set.delete(id);
      localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
    } catch { /* storage unavailable */ }
    toast.success(next ? 'Added to favorites' : 'Removed from favorites');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/projects/${id}`);
      toast.success('Project link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const lists = useListStore((s) => s.listsByProject[id] ?? EMPTY_LISTS);
  const fetchLists = useListStore((s) => s.fetchLists);
  const createList = useListStore((s) => s.createList);
  const deleteList = useListStore((s) => s.deleteList);
  const reorderLists = useListStore((s) => s.reorderLists);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingList, setSavingList] = useState(false);
  const [listToDelete, setListToDelete] = useState<List | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [orderedLists, setOrderedLists] = useState<List[]>([]);

  useEffect(() => {
    setOrderedLists(lists);
  }, [lists]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    })
  );

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ project: Project }>(`/projects/${id}`);
        setProject(data.project);
        pushRecent({ kind: 'project', id: data.project.id, title: data.project.name, context: data.project.space?.name });
        setProjectName(data.project.name);
        setProjectDesc(data.project.description || '');
        await fetchLists(id);
      } catch (err: any) {
        setError(err?.response?.status === 404 ? 'Project not found' : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    async function checkRole() {
      if (!activeWorkspace || !currentUser) return;
      try {
        const { data } = await api.get<{ workspace: { members: any[] } }>(`/workspaces/${activeWorkspace.id}`);
        const me = data.workspace.members.find((m) => m.userId === currentUser.id);
        setIsAdmin(me?.role === 'ADMIN');
      } catch (err) {
        console.error('Role check failed', err);
      }
    }
    checkRole();
  }, [activeWorkspace, currentUser]);

  // Sidebar links: ?tab=channel opens the channel, ?listId=… opens that list
  const tabParam = searchParams.get('tab');
  const listParam = searchParams.get('listId');
  useEffect(() => {
    if (tabParam === 'channel') {
      setActiveTab('channel');
      return;
    }
    setActiveTab((t) => (t === 'channel' ? 'list' : t));
    if (listParam) setActiveListId(listParam);
  }, [tabParam, listParam]);

  // Keep the URL in step with the page so the sidebar highlights the right row
  const syncUrl = (params: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    router.replace(`/projects/${id}${q ? `?${q}` : ''}`, { scroll: false });
  };
  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'channel') syncUrl({ tab: 'channel' });
    else if (activeTab === 'channel') syncUrl(activeListId ? { listId: activeListId } : {});
  };
  const selectList = (listId: string) => {
    setActiveListId(listId);
    setActiveTab((t) => (t === 'channel' ? 'list' : t));
    syncUrl({ listId });
  };

  useEffect(() => {
    if (!activeListId && orderedLists.length > 0) setActiveListId(orderedLists[0].id);
  }, [orderedLists, activeListId]);

  const handleAddList = async () => {
    if (!newName.trim() || savingList) return;
    setSavingList(true);
    try {
      const list = await createList(id, newName.trim());
      setNewName('');
      setAdding(false);
      setActiveListId(list.id);
      toast.success(`List "${list.name}" created`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to create list');
    } finally {
      setSavingList(false);
    }
  };

  const confirmDeleteList = async () => {
    if (!listToDelete) return;
    setDeleting(true);
    try {
      await deleteList(id, listToDelete.id);
      if (activeListId === listToDelete.id) setActiveListId(null);
      toast.success(`List "${listToDelete.name}" deleted`);
      setListToDelete(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to delete list');
    } finally {
      setDeleting(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isAdmin) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedLists.findIndex((l) => l.id === active.id);
    const newIndex = orderedLists.findIndex((l) => l.id === over.id);
    const newLists = arrayMove(orderedLists, oldIndex, newIndex);
    setOrderedLists(newLists);
    reorderLists(id, newLists);
  };

  const handleUpdateProject = async () => {
    setUpdatingProject(true);
    try {
      const updated = await updateProject(id, { name: projectName, description: projectDesc });
      setProject(updated);
      toast.success('Project updated');
      setShowSettings(false);
    } catch {
      toast.error('Failed to update project');
    } finally {
      setUpdatingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure? This will delete all lists and tasks in this project permanently.')) return;
    setDeletingProject(true);
    try {
      await deleteProject(id);
      toast.success('Project deleted');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to delete project');
      setDeletingProject(false);
    }
  };

  // A task link (/tasks/<id> → ?task=<id>&listId=<id>) opens that task straight away
  const taskParam = searchParams.get('task');
  const [selectedTask, setSelectedTask] = useState<{ id: string; listId: string } | null>(
    taskParam ? { id: taskParam, listId: searchParams.get('listId') ?? '' } : null
  );

  const handleTaskClick = (task: { id: string; listId?: string }) => {
    setSelectedTask({ id: task.id, listId: (task as any).listId ?? activeListId ?? '' });
  };

  if (loading) return <AppShellSkeleton />;

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <p className="text-base font-semibold text-foreground">{error ?? 'Project not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[color:var(--c-1e1f21)] text-[color:var(--c-e5e5e5)] px-3 sm:px-5 pt-3 pb-6 max-w-[100vw] overflow-x-hidden space-y-3">
      <SocketProvider projectId={id} />

      {/* Header: breadcrumb + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[13px] text-[color:var(--c-8a8c91)] min-w-0">
          <span className="flex items-center gap-1.5 shrink-0">
            {project.space && (
              <SpaceIcon name={project.space.name} icon={project.space.icon} color={project.space.color} size={16} className="rounded-md" />
            )}
            {project.space?.name ?? 'No space'}
          </span>
          <span>/</span>

          <div className="relative min-w-0" ref={switcherRef}>
            <button
              onClick={() => setSwitcherOpen((v) => !v)}
              aria-expanded={switcherOpen}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[color:var(--c-white)] font-semibold hover:bg-[color:var(--c-2a2b2e)] transition min-w-0"
            >
              <FolderKanban className="h-4 w-4 shrink-0 text-indigo-400" />
              <span className="truncate">{project.name}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[color:var(--c-8a8c91)]" />
            </button>
            {switcherOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-64 max-h-72 overflow-y-auto rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] p-1 shadow-2xl custom-scrollbar">
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#777]">Projects</p>
                {siblingProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSwitcherOpen(false); if (p.id !== id) router.push(`/projects/${p.id}`); }}
                    className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)] transition"
                  >
                    <FolderKanban className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.id === id && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleFavorite}
            aria-pressed={favorite}
            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            className="rounded-md p-1 hover:bg-[color:var(--c-2a2b2e)] transition"
          >
            <Star className={`h-4 w-4 ${favorite ? 'fill-yellow-400 text-yellow-400' : 'text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'}`} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => router.push('/workflows')}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)] transition"
          >
            <Zap className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" /> Automate
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowAiDraft(true)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)] transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Ask AI
            </button>
          )}
          <button
            onClick={copyLink}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)] transition"
          >
            <Share2 className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" /> Share
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-md border border-[color:var(--c-444548)] px-3 py-1 text-[13px] font-medium text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] transition"
            >
              Manage
            </button>
          )}
        </div>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-[color:var(--c-333438)] text-[13px]">
        {VIEW_TABS.map(({ id: tab, label, icon: Icon, color }) => {
          const on = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => selectTab(tab)}
              className={`flex shrink-0 items-center gap-1.5 px-2.5 py-2 -mb-px border-b-2 font-medium transition ${
                on ? 'border-[color:var(--c-white)] text-[color:var(--c-white)]' : 'border-transparent text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'
              }`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded ${color}`}>
                <Icon className="h-2.5 w-2.5 text-white" />
              </span>
              {label}
            </button>
          );
        })}
        <button
          onClick={() => toast.info('Custom views are coming soon')}
          className="flex shrink-0 items-center gap-1 px-2.5 py-2 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] font-medium transition"
        >
          <Plus className="h-3.5 w-3.5" /> View
        </button>
      </div>

      {/* Lists Horizontal Sub-bar (not relevant inside the channel) */}
      <div className={`items-center gap-2 overflow-x-auto py-1 ${activeTab === 'channel' ? 'hidden' : 'flex'}`}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedLists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
            {orderedLists.map((l) => (
              <SortableListTab key={l.id} list={l} active={l.id === activeListId} onSelect={() => selectList(l.id)} onDelete={() => setListToDelete(l)} isAdmin={isAdmin} />
            ))}
          </SortableContext>
        </DndContext>

        {isAdmin && (
          adding ? (
            <div className="flex items-center gap-1.5 pl-1">
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') { setAdding(false); setNewName(''); } }} placeholder="List name..." disabled={savingList} className="h-7 rounded border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] px-2 text-xs outline-none text-[color:var(--c-white)] focus:border-indigo-500" />
              <button onClick={handleAddList} disabled={savingList || !newName.trim()} className="h-7 bg-indigo-600 text-white px-2.5 rounded text-xs hover:bg-indigo-500 disabled:opacity-50">
                {savingList ? 'Adding…' : 'Add'}
              </button>
              <button onClick={() => { setAdding(false); setNewName(''); }} className="p-1 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-2a2b2e)] transition border border-dashed border-[color:var(--c-333438)]">
              <Plus className="h-3.5 w-3.5" /> New List
            </button>
          )
        )}
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'list' && activeListId ? (
        <TaskList key={activeListId} listId={activeListId} onTaskClick={handleTaskClick} isAdmin={isAdmin} />
      ) : activeTab === 'board' && activeListId ? (
        <BoardView key={activeListId} listId={activeListId} onTaskClick={handleTaskClick} isAdmin={isAdmin} />
      ) : activeTab === 'channel' ? (
        <ChannelView projectId={id} projectName={project.name} />
      ) : (
        <div className="p-12 text-center text-[color:var(--c-8a8c91)] bg-[color:var(--c-232426)] rounded-lg border border-[color:var(--c-333438)]">
          <p className="text-sm font-semibold text-[color:var(--c-white)]">Coming Soon</p>
          <p className="text-xs mt-1">The {activeTab} view is currently under development.</p>
        </div>
      )}

      {/* Manage project */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !updatingProject && setShowSettings(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Manage project"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[color:var(--c-white)]">Manage project</h2>
              <button onClick={() => setShowSettings(false)} aria-label="Close" className="text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mb-1 block text-xs font-semibold text-[color:var(--c-8a8c91)]">Name</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mb-3 w-full rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] px-3 py-2 text-sm text-[color:var(--c-white)] outline-none focus:border-indigo-500"
            />
            <label className="mb-1 block text-xs font-semibold text-[color:var(--c-8a8c91)]">Description</label>
            <textarea
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] px-3 py-2 text-sm text-[color:var(--c-white)] outline-none focus:border-indigo-500"
            />
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={handleDeleteProject}
                disabled={deletingProject || updatingProject}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition"
              >
                {deletingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete project
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSettings(false)} className="rounded-md px-3 py-1.5 text-[13px] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">Cancel</button>
                <button
                  onClick={handleUpdateProject}
                  disabled={updatingProject || !projectName.trim()}
                  className="rounded-md bg-[color:var(--c-white)] px-4 py-1.5 text-[13px] font-semibold text-[color:var(--c-1e1f21)] hover:opacity-85 disabled:opacity-50 transition"
                >
                  {updatingProject ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Dialogs */}
      <AiDraftModal
        open={showAiDraft}
        onClose={() => setShowAiDraft(false)}
        projectId={id}
        lists={orderedLists}
        defaultListId={activeListId}
        onDone={(listId) => setActiveListId(listId)}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTask?.id ?? ''}
        listId={selectedTask?.listId ?? ''}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        isAdmin={isAdmin}
      />

      <AlertDialog open={!!listToDelete} onOpenChange={(open) => { if (!open && !deleting) setListToDelete(null); }}>
        <AlertDialogContent className="bg-[color:var(--c-232426)] border-[color:var(--c-333438)] text-[color:var(--c-white)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete list</AlertDialogTitle>
            <AlertDialogDescription className="text-[color:var(--c-8a8c91)]">Are you sure you want to delete <span className="font-semibold text-[color:var(--c-white)]">"{listToDelete?.name}"</span>? All tasks inside will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)] border-[color:var(--c-333438)] hover:bg-[color:var(--c-333438)]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDeleteList(); }} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">{deleting ? 'Deleting…' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
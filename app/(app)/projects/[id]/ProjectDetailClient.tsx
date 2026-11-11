'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
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
  ListFilter,
  Plus,
  FolderKanban,
  X,
  Share2,
  Settings,
  Trash2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import AiDraftModal from '@/components/AiDraftModal';
import TaskList from '@/components/TaskList';
import BoardView from '@/components/BoardView';
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

const EMPTY_LISTS: never[] = [];

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
      className={`group relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium cursor-grab active:cursor-grabbing transition-all select-none border ${active
          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 shadow-xs dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200'
          : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        }`}
    >
      <ListIcon
        className={`h-3.5 w-3.5 shrink-0 transition-colors ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'
          }`}
      />
      <span className="truncate max-w-[140px]">{list.name}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active
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

  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

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

  // ← Helper: Navigate to Task Page
  const handleTaskClick = (task: { id: string }) => {
    router.push(`/tasks/${task.id}`);
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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <SocketProvider projectId={id} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-border/60 pb-4 sm:pb-6">
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <div className="h-8 sm:h-10 w-8 sm:w-10 rounded-xl shrink-0 flex items-center justify-center shadow-xs border border-white/20" style={{ backgroundColor: project.color || '#6366f1' }}>
            <FolderKanban className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight truncate">{project.name}</h1>
            {project.description && <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-xl mt-0.5">{project.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={() => setShowAiDraft(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 transition shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">AI Plan</span>
            </button>
          )}
          <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent transition">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          {isAdmin && (
            <button onClick={() => setShowSettings(true)} className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground rounded-md border border-input bg-background hover:bg-accent transition">
              <Settings className="h-4 sm:h-3.5 w-4 sm:w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedLists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
              {orderedLists.map((l) => (
                <SortableListTab key={l.id} list={l} active={l.id === activeListId} onSelect={() => setActiveListId(l.id)} onDelete={() => setListToDelete(l)} isAdmin={isAdmin} />
              ))}
            </SortableContext>
          </DndContext>

          {isAdmin && (
            adding ? (
              <div className="flex items-center gap-1.5 pl-1">
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') { setAdding(false); setNewName(''); } }} placeholder="List name..." disabled={savingList} className="h-8 rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:border-indigo-500" />
                <button onClick={handleAddList} disabled={savingList || !newName.trim()} className="h-8 inline-flex items-center bg-indigo-600 text-white px-2.5 rounded-md text-xs hover:bg-indigo-500 disabled:opacity-50">
                  {savingList ? 'Adding…' : 'Add'}
                </button>
                <button onClick={() => { setAdding(false); setNewName(''); }} className="p-1.5 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition border border-dashed border-border/80">
                <Plus className="h-3.5 w-3.5" /> New List
              </button>
            )
          )}
        </div>

        {activeListId && (
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60">
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md ${viewMode === 'list' ? 'bg-background shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
              <ListFilter className="h-3.5 w-3.5" /> List
            </button>
            <button onClick={() => setViewMode('board')} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md ${viewMode === 'board' ? 'bg-background shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutGrid className="h-3.5 w-3.5" /> Board
            </button>
          </div>
        )}
      </div>

      {/* Task Area */}
      {activeListId ? (
        <div className="mt-2">
          {viewMode === 'list' ? (
            <TaskList listId={activeListId} onTaskClick={handleTaskClick} isAdmin={isAdmin} />
          ) : (
            <BoardView listId={activeListId} onTaskClick={handleTaskClick} isAdmin={isAdmin} />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <p className="text-sm font-semibold text-foreground">No lists found</p>
          {isAdmin && (
            <button onClick={() => setAdding(true)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500">
              <Plus className="h-3.5 w-3.5" /> Create list
            </button>
          )}
        </div>
      )}

      {/* AI Task Planner */}
      <AiDraftModal
        open={showAiDraft}
        onClose={() => setShowAiDraft(false)}
        projectId={id}
        lists={orderedLists}
        defaultListId={activeListId}
        onDone={(listId) => setActiveListId(listId)}
      />

      {/* Delete List Confirmation */}
      <AlertDialog open={!!listToDelete} onOpenChange={(open) => { if (!open && !deleting) setListToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete list</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <span className="font-semibold">"{listToDelete?.name}"</span>? All tasks inside will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDeleteList(); }} disabled={deleting} className="bg-red-600 hover:bg-red-700">{deleting ? 'Deleting…' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Settings Modal (Admin Only) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSettings(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-foreground">Project Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Project Name</label>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Description</label>
              <textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 outline-none resize-none" />
            </div>

            <div className="pt-4 border-t border-border/60 flex items-center justify-between">
              <button onClick={handleDeleteProject} disabled={deletingProject} className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center gap-1">
                {deletingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete Project
              </button>
              <button onClick={handleUpdateProject} disabled={updatingProject || !projectName.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {updatingProject ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
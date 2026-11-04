'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useListStore } from '@/store/listStore';
import type { Project } from '@/types/project';
import type { List } from '@/types/list';
import { toast } from 'sonner';
import { List as ListIcon } from 'lucide-react';
import TaskList from '@/components/TaskList';
import TaskDetailDrawer from '@/components/TaskDetailDrawer';
import type { Task } from '@/types/task';
import BoardView from '@/components/BoardView';
import {
  DndContext,
  closestCenter,
  PointerSensor,
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
import AppShellSkeleton from '@/components/AppShellSkeleton';

const EMPTY_LISTS: never[] = [];

/* ── Sortable Tab ─────────────────────────────────────────── */
function SortableListTab({
  list,
  active,
  onSelect,
  onDelete,
}: {
  list: List;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap cursor-grab active:cursor-grabbing transition ${active
        ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
        : 'text-gray-500 hover:text-gray-800'
        }`}
      onClick={onSelect}
    >
      <ListIcon
        className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'
          }`}
        strokeWidth={2}
      />

      {list.name}
      <span className="text-[10px] text-gray-400">{list._count?.tasks ?? 0}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition text-base leading-none"
        title="Delete list"
      >
        ×
      </button>
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
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  const lists = useListStore((s) => s.listsByProject[id] ?? EMPTY_LISTS);
  const fetchLists = useListStore((s) => s.fetchLists);
  const createList = useListStore((s) => s.createList);
  const deleteList = useListStore((s) => s.deleteList);
  const reorderLists = useListStore((s) => s.reorderLists);


  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingList, setSavingList] = useState(false);

  // Delete confirmation state
  const [listToDelete, setListToDelete] = useState<List | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [orderedLists, setOrderedLists] = useState<List[]>([]);
  useEffect(() => {
    setOrderedLists(lists);
  }, [lists]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );


  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ project: Project }>(`/projects/${id}`);
        setProject(data.project);
        await fetchLists(id);
      } catch (err: any) {
        setError(err?.response?.status === 404 ? 'Project not found' : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  // Opens the dialog instead of calling confirm()
  const requestDeleteList = (list: List) => {
    setListToDelete(list);
  };

  // Runs when user confirms in the dialog
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
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedLists.findIndex((l) => l.id === active.id);
    const newIndex = orderedLists.findIndex((l) => l.id === over.id);

    const newLists = arrayMove(orderedLists, oldIndex, newIndex);

    // Update UI instantly and save to DB
    setOrderedLists(newLists);
    reorderLists(id, newLists);
  };


  if (loading) {
    return (
      <AppShellSkeleton />
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">{error ?? 'Project not found'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 text-sm text-indigo-600 hover:underline"
        >
          ← Back to overview
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <span className="h-10 w-10 rounded-xl shrink-0" style={{ backgroundColor: project.color }} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
      </div>

      {/* List tabs (drag-and-drop) */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedLists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
            {orderedLists.map((l) => (
              <SortableListTab
                key={l.id}
                list={l}
                active={l.id === activeListId}
                onSelect={() => setActiveListId(l.id)}
                onDelete={() => requestDeleteList(l)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {adding ? (
          <div className="flex items-center gap-1 px-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddList();
                if (e.key === 'Escape') {
                  setAdding(false);
                  setNewName('');
                }
              }}
              placeholder="List name"
              disabled={savingList}
              className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              onClick={handleAddList}
              disabled={savingList || !newName.trim()}
              className="inline-flex items-center gap-1.5 text-indigo-600 text-sm font-medium px-2 py-1 rounded hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {savingList ? (
                <>
                  <span className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  Adding…
                </>
              ) : (
                'Add'
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-indigo-600 whitespace-nowrap transition"
          >
            + Add list
          </button>
        )}
      </div>

      {/* Task area */}
      {/* Task area */}
      {activeListId ? (
        <div>
          {/* View Toggle */}
          <div className="flex items-center gap-1 mb-4 bg-gray-100/50 p-1 w-fit rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${viewMode === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Board
            </button>
          </div>

          {/* Render List or Board */}
          {viewMode === 'list' ? (
            <TaskList listId={activeListId} onTaskClick={(t) => setOpenTask(t)} />
          ) : (
            <BoardView listId={activeListId} onTaskClick={(t) => setOpenTask(t)} />
          )}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white/50 p-12 text-center">
          <p className="text-sm text-gray-500">No lists yet. Click "+ Add list" to start.</p>
        </div>
      )}

      {/* Task detail drawer */}
      <TaskDetailDrawer
        task={openTask}
        listId={activeListId ?? ''}
        open={!!openTask}
        onClose={() => setOpenTask(null)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!listToDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setListToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this list?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-gray-900">"{listToDelete?.name}"</span> and
              all of its tasks will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteList();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
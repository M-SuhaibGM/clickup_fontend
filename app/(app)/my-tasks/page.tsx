'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { RefreshCw, RotateCcw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { apiError } from '@/lib/apiError';
import { useApi } from '@/lib/useApi';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { useNow } from '@/lib/useNow';
import RecentsCard from '@/components/mytasks/RecentsCard';
import AgendaCard from '@/components/mytasks/AgendaCard';
import { lazyOnOpen } from '@/components/LazyMount';

import MyCard from '@/components/mytasks/MyCard';
import ManageCardsDialog from '@/components/mytasks/ManageCardsDialog';
import PersonalListCard from '@/components/mytasks/PersonalListCard';
import AssignedCommentsCard from '@/components/mytasks/AssignedCommentsCard';
import TimeTrackedCard from '@/components/mytasks/TimeTrackedCard';
import { AssignedCard, TodayOverdueCard, bucketTasks } from '@/components/mytasks/TaskCards';
import { CARDS, type CardId, type MyTask } from '@/components/mytasks/types';
import { Skeleton } from '@/components/ui/skeleton';

const TaskDetailModal = lazyOnOpen(() => import('@/components/TaskDetailModal'));

// ── Layout (card order / hidden / wide), kept in this browser ──
const LAYOUT_KEY = 'my-tasks-layout-v2';
const LAYOUT_EVENT = 'my-tasks-layout-change';
const IDS = CARDS.map((c) => c.id);

interface Layout { order: CardId[]; hidden: CardId[]; wide: CardId[] }
const DEFAULT_LAYOUT: Layout = { order: IDS, hidden: [], wide: [] };

function parseLayout(raw: string): Layout {
  try {
    const v = JSON.parse(raw) as Partial<Layout>;
    const known = (list: unknown): CardId[] => (Array.isArray(list) ? list.filter((x): x is CardId => IDS.includes(x as CardId)) : []);
    const order = known(v.order);
    return { order: [...order, ...IDS.filter((id) => !order.includes(id))], hidden: known(v.hidden), wide: known(v.wide) };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

const layoutStore = {
  subscribe(cb: () => void) {
    window.addEventListener(LAYOUT_EVENT, cb);
    window.addEventListener('storage', cb);
    return () => {
      window.removeEventListener(LAYOUT_EVENT, cb);
      window.removeEventListener('storage', cb);
    };
  },
  snapshot() {
    try { return localStorage.getItem(LAYOUT_KEY) ?? ''; } catch { return ''; }
  },
};
const writeLayout = (next: Layout) => {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(LAYOUT_EVENT));
};

export default function MyTasksPage() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const workspaceId = activeWorkspace?.id ?? null;
  const isAdmin = activeWorkspace?.role === 'ADMIN';
  const userName = useAuthStore((s) => s.user?.name);
  const now = useNow(60_000);
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = userName?.trim().split(/\s+/)[0];

  // useSyncExternalStore: the server (and first client render) use the default layout, so there's no hydration mismatch
  const rawLayout = useSyncExternalStore(layoutStore.subscribe, layoutStore.snapshot, () => '');
  const layout = useMemo(() => (rawLayout ? parseLayout(rawLayout) : DEFAULT_LAYOUT), [rawLayout]);

  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const [manageOpen, setManageOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [selected, setSelected] = useState<{ id: string; listId: string } | null>(null);
  const gearRef = useRef<HTMLDivElement>(null);

  const { data, loading, error, mutate } = useApi<{ tasks: MyTask[] }>(workspaceId ? `/workspaces/${workspaceId}/my-tasks` : null, undefined, reloadKey);
  const tasks = useMemo(() => data?.tasks ?? [], [data]);

  useEffect(() => {
    if (!gearOpen) return;
    const onDown = (e: MouseEvent) => !gearRef.current?.contains(e.target as Node) && setGearOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [gearOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const visible = layout.order.filter((id) => !layout.hidden.includes(id));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = visible.indexOf(active.id as CardId);
    const to = visible.indexOf(over.id as CardId);
    if (from === -1 || to === -1) return;
    // reorder the visible cards, keeping hidden ones where they were
    const moved = arrayMove(visible, from, to);
    let i = 0;
    writeLayout({ ...layout, order: layout.order.map((id) => (layout.hidden.includes(id) ? id : moved[i++])) });
  };
  const toggleIn = (list: CardId[], id: CardId) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  // ── Task actions ──
  const openTask = (t: MyTask) => setSelected({ id: t.id, listId: t.list.id });
  const toggleDone = async (t: MyTask) => {
    const status = t.status === 'DONE' ? 'TODO' : 'DONE';
    mutate((d) => ({ tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, status } : x)) }));
    try {
      await api.patch(`/tasks/${t.id}`, { status });
    } catch (err) {
      mutate((d) => ({ tasks: d.tasks.map((x) => (x.id === t.id ? t : x)) }));
      toast.error(apiError(err, 'Failed to update the task'));
    }
  };
  const closeModal = useCallback(() => {
    setSelected(null);
    refresh(); // the task may have changed in the modal
  }, [refresh]);

  const buckets = useMemo(() => bucketTasks(tasks), [tasks]);
  const counts: Partial<Record<CardId, number>> = {
    today: buckets.overdue.length + buckets.today.length,
    assigned: buckets.upcoming.length + buckets.noDate.length,
  };

  const renderCard = (id: CardId) => {
    if (!workspaceId) return null;
    const def = CARDS.find((c) => c.id === id)!;
    const wide = layout.wide.includes(id);
    const body =
      id === 'recents' ? <RecentsCard onOpenTask={setSelected} />
      : id === 'agenda' ? <AgendaCard tasks={tasks} now={now} onOpen={openTask} onToggle={toggleDone} />
      : id === 'today' ? <TodayOverdueCard tasks={tasks} onOpen={openTask} onToggle={toggleDone} />
      : id === 'assigned' ? <AssignedCard tasks={tasks} onOpen={openTask} onToggle={toggleDone} />
      : id === 'personal' ? <PersonalListCard workspaceId={workspaceId} reloadKey={reloadKey} />
      : id === 'comments' ? <AssignedCommentsCard workspaceId={workspaceId} reloadKey={reloadKey} onOpenTask={setSelected} />
      : <TimeTrackedCard workspaceId={workspaceId} reloadKey={reloadKey} />;
    return (
      <MyCard
        key={id}
        id={id}
        title={def.title}
        count={counts[id]}
        wide={wide}
        onToggleWide={() => writeLayout({ ...layout, wide: toggleIn(layout.wide, id) })}
        onHide={() => writeLayout({ ...layout, hidden: [...layout.hidden, id] })}
        onRefresh={refresh}
      >
        {body}
      </MyCard>
    );
  };

  const loadingFirst = !workspaceId || (loading && !data);

  return (
    <div className="mytasks-scope flex h-full min-h-0 flex-col bg-[color:var(--mt-page)]">
      <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--mt-border)] px-5 py-3">
        <h1 className="text-[15px] font-semibold text-[color:var(--c-white)]">My Tasks</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setManageOpen(true)} className="rounded-md bg-[color:var(--c-white)] px-3 py-1.5 text-[13px] font-semibold text-[color:var(--c-1e1f21)] transition hover:opacity-85">
            Manage cards
          </button>
          <div className="relative" ref={gearRef}>
            <button onClick={() => setGearOpen((v) => !v)} aria-label="Page options" aria-expanded={gearOpen} className="rounded-md p-1.5 text-[color:var(--c-8a8c91)] transition hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)]">
              <Settings className="h-4 w-4" />
            </button>
            {gearOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] p-1 shadow-2xl">
                <button onClick={() => { setGearOpen(false); refresh(); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)]">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh everything
                </button>
                <button onClick={() => { setGearOpen(false); writeLayout(DEFAULT_LAYOUT); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)]">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset layout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
        {error && !data && (
          <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">
            Couldn&apos;t load your tasks. <button onClick={refresh} className="underline">Try again</button>
          </p>
        )}

        {loadingFirst ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[420px] rounded-2xl" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[15px] font-semibold text-[color:var(--c-white)]">All cards are hidden</p>
            <p className="mt-1 text-[13px] text-[color:var(--c-8a8c91)]">Pick what you want to see on this page.</p>
            <button onClick={() => setManageOpen(true)} className="mt-4 rounded-md bg-[color:var(--c-white)] px-3 py-1.5 text-[13px] font-semibold text-[color:var(--c-1e1f21)] hover:opacity-85">Manage cards</button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={visible} strategy={rectSortingStrategy}>
              <div className="mx-auto max-w-[1400px]">
                <h2 className="mb-4 px-1 text-[22px] font-bold text-[color:var(--c-white)]">{greeting}{firstName ? `, ${firstName}` : ''}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{visible.map(renderCard)}</div>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {manageOpen && (
        <ManageCardsDialog
          hidden={layout.hidden}
          onToggle={(id) => writeLayout({ ...layout, hidden: toggleIn(layout.hidden, id) })}
          onReset={() => writeLayout(DEFAULT_LAYOUT)}
          onClose={() => setManageOpen(false)}
        />
      )}

      <TaskDetailModal taskId={selected?.id ?? ''} listId={selected?.listId ?? ''} open={!!selected} onClose={closeModal} isAdmin={isAdmin} />
    </div>
  );
}

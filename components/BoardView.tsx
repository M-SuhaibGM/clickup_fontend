'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/types/task';
import TaskCard from './TaskCard';
import BoardColumn from './BoardColumn';
import {
    DndContext,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';

const COLUMNS = [
    { id: 'TODO', label: 'To Do', color: 'bg-muted-foreground/40' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-400' },
    { id: 'DONE', label: 'Done', color: 'bg-emerald-500' },
];

const EMPTY_TASKS: never[] = [];

export default function BoardView({
    listId,
    onTaskClick,
    isAdmin, // ← ADD
}: {
    listId: string;
    onTaskClick: (task: Task) => void;
    isAdmin: boolean; // ← ADD
}) {
    const tasks = useTaskStore((s) => s.tasksByList[listId] ?? EMPTY_TASKS);
    const fetchTasks = useTaskStore((s) => s.fetchTasks);
    const updateTask = useTaskStore((s) => s.updateTask);
    const setTasks = useTaskStore((s) => s.setTasks);
    const reorderTasks = useTaskStore((s) => s.reorderTasks);

    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    useEffect(() => {
        if (tasks.length === 0) fetchTasks(listId);
    }, [listId, fetchTasks, tasks.length]);

    const tasksByColumn = useMemo(() => {
        const mainTasks = tasks.filter((t) => !t.parentId);

        return {
            TODO: mainTasks.filter((t) => t.status === 'TODO'),
            IN_PROGRESS: mainTasks.filter((t) => t.status === 'IN_PROGRESS'),
            DONE: mainTasks.filter((t) => t.status === 'DONE'),
        };
    }, [tasks]);

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find((t) => t.id === event.active.id);
        if (task) setActiveTask(task);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        const activeTask = tasks.find((t) => t.id === taskId);
        if (!activeTask) return;

        // Filter out subtasks for reordering logic
        const mainTasks = tasks.filter((t) => !t.parentId);

        let newStatus = activeTask.status;
        if (COLUMNS.some((c) => c.id === overId)) {
            newStatus = overId as any;
        } else {
            const overTask = tasks.find((t) => t.id === overId);
            if (overTask) newStatus = overTask.status;
        }

        const oldIndex = mainTasks.findIndex((t) => t.id === taskId);
        const newIndex = mainTasks.findIndex((t) => t.id === overId);

        // Optimistic UI Update
        if (oldIndex !== -1 && newIndex !== -1 && newStatus === activeTask.status) {
            // Reordering within the same column requires Admin permissions
            if (!isAdmin) {
                toast.error('Only admins can reorder tasks within a column');
                return;
            }
            const newTasks = arrayMove(mainTasks, oldIndex, newIndex);
            const subtasks = tasks.filter((t) => t.parentId);
            setTasks(listId, [...newTasks, ...subtasks]);
        } else if (newStatus !== activeTask.status) {
            // Moving to a new column (status change) — allowed for all members
            const updatedTasks = tasks.map((t) =>
                t.id === taskId ? { ...t, status: newStatus } : t
            );
            setTasks(listId, updatedTasks);
        }

        // API Call
        if (newStatus !== activeTask.status) {
            try {
                await updateTask(taskId, listId, { status: newStatus });
                toast.success(`Moved to ${COLUMNS.find((c) => c.id === newStatus)?.label}`);
            } catch {
                toast.error('Failed to move task');
                fetchTasks(listId);
            }
        } else if (oldIndex !== -1 && newIndex !== -1 && isAdmin) {
            const newTasks = arrayMove(mainTasks, oldIndex, newIndex);
            const subtasks = tasks.filter((t) => t.parentId);
            reorderTasks(listId, [...newTasks, ...subtasks]);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 items-start">
                {COLUMNS.map((col) => (
                    <BoardColumn
                        key={col.id}
                        id={col.id}
                        label={col.label}
                        color={col.color}
                        tasks={tasksByColumn[col.id as keyof typeof tasksByColumn]}
                        onTaskClick={onTaskClick}
                    />
                ))}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeTask ? (
                    <div className="opacity-90 scale-105 cursor-grabbing">
                        <TaskCard task={activeTask} onClick={() => { }} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
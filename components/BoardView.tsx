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
    { id: 'TODO', label: 'To Do', color: 'bg-gray-400' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-400' },
    { id: 'DONE', label: 'Done', color: 'bg-emerald-500' },
];

const EMPTY_TASKS: never[] = [];

export default function BoardView({
    listId,
    onTaskClick,
}: {
    listId: string;
    onTaskClick: (task: Task) => void;
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
        return {
            TODO: tasks.filter((t) => t.status === 'TODO'),
            IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
            DONE: tasks.filter((t) => t.status === 'DONE'),
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

        // 1. Determine the new status
        let newStatus = activeTask.status;

        // If dropped directly on a column (e.g., empty "Done" column)
        if (COLUMNS.some((c) => c.id === overId)) {
            newStatus = overId as any;
        } else {
            // If dropped on another task, use THAT task's status
            const overTask = tasks.find((t) => t.id === overId);
            if (overTask) newStatus = overTask.status;
        }

        // 2. Reorder logic (if dropping within the same column)
        const oldIndex = tasks.findIndex((t) => t.id === taskId);
        const newIndex = tasks.findIndex((t) => t.id === overId);

        // Optimistic UI Update
        if (oldIndex !== -1 && newIndex !== -1 && newStatus === activeTask.status) {
            // Reordering within same column
            setTasks(listId, arrayMove(tasks, oldIndex, newIndex));
        } else if (newStatus !== activeTask.status) {
            // Moving to a new column
            const updatedTasks = tasks.map((t) =>
                t.id === taskId ? { ...t, status: newStatus } : t
            );
            setTasks(listId, updatedTasks);
        }

        // 3. API Call
        if (newStatus !== activeTask.status) {
            try {
                await updateTask(taskId, listId, { status: newStatus });
                toast.success(`Moved to ${COLUMNS.find((c) => c.id === newStatus)?.label}`);
            } catch {
                toast.error('Failed to move task');
                fetchTasks(listId); // Revert by re-fetching
            }
        }
        if (oldIndex !== -1 && newIndex !== -1 && newStatus === activeTask.status) {
            // Reordering within same column
            const newTasks = arrayMove(tasks, oldIndex, newIndex);
            reorderTasks(listId, newTasks);
        } else if (newStatus !== activeTask.status) {
            // Moving to a new column
            const updatedTasks = tasks.map((t) =>
                t.id === taskId ? { ...t, status: newStatus } : t
            );
            setTasks(listId, updatedTasks);
            // Note: If you want to persist the new order when moving columns, 
            // you would also call reorderTasks(listId, updatedTasks) here.
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
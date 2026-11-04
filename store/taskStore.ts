import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Task } from '@/types/task';
import { useListStore } from './listStore';

interface TaskState {
  tasksByList: Record<string, Task[]>;
  loadingLists: Record<string, boolean>;

  fetchTasks: (listId: string) => Promise<void>;
  createTask: (listId: string, input: { title: string }) => Promise<Task>;
  updateTask: (taskId: string, listId: string, patch: Partial<Task>) => Promise<Task>;
  deleteTask: (taskId: string, listId: string) => Promise<void>;
  reorderTasks: (listId: string, newTasks: Task[]) => Promise<void>;

  setTasks: (listId: string, tasks: Task[]) => void; // ← ADD THIS

  clear: () => void;
}


export const useTaskStore = create<TaskState>((set, get) => ({
  tasksByList: {},
  loadingLists: {},

  fetchTasks: async (listId) => {
    set((s) => ({ loadingLists: { ...s.loadingLists, [listId]: true } }));
    try {
      const { data } = await api.get<{ tasks: Task[] }>(`/lists/${listId}/tasks`);
      set((s) => ({
        tasksByList: { ...s.tasksByList, [listId]: data.tasks },
      }));
    } finally {
      set((s) => ({ loadingLists: { ...s.loadingLists, [listId]: false } }));
    }
  },

  createTask: async (listId, input) => {
    const { data } = await api.post<{ task: Task }>(`/lists/${listId}/tasks`, input);

    // Update tasks
    set((s) => ({
      tasksByList: {
        ...s.tasksByList,
        [listId]: [data.task, ...(s.tasksByList[listId] ?? [])],
      },
    }));

    // Update the list count in the sidebar
    useListStore.getState().incrementTaskCount(listId, 1); // ← ADD THIS

    return data.task;
  },



  reorderTasks: async (listId, newTasks) => {
    // Optimistic update
    set((s) => ({
      tasksByList: {
        ...s.tasksByList,
        [listId]: newTasks,
      },
    }));

    try {
      const taskIds = newTasks.map((t) => t.id);
      await api.patch('/tasks/reorder', { taskIds });
    } catch (err) {
      console.error('Failed to save task order', err);
    }
  },

  updateTask: async (taskId, listId, patch) => {
    const { data } = await api.patch<{ task: Task }>(`/tasks/${taskId}`, patch);
    set((s) => ({
      tasksByList: {
        ...s.tasksByList,
        [listId]: (s.tasksByList[listId] ?? []).map((t) =>
          t.id === taskId ? data.task : t
        ),
      },
    }));
    return data.task;
  },

  deleteTask: async (taskId, listId) => {
    await api.delete(`/tasks/${taskId}`);

    // Update tasks
    set((s) => ({
      tasksByList: {
        ...s.tasksByList,
        [listId]: (s.tasksByList[listId] ?? []).filter((t) => t.id !== taskId),
      },
    }));

    // Update the list count in the sidebar
    useListStore.getState().incrementTaskCount(listId, -1); // ← ADD THIS
  },
  // ← ADD THIS IMPLEMENTATION
  setTasks: (listId, tasks) => {
    set((s) => ({
      tasksByList: {
        ...s.tasksByList,
        [listId]: tasks,
      },
    }));
  },

  clear: () => set({ tasksByList: {}, loadingLists: {} }),
}));
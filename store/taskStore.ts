// frontend/store/taskStore.ts
import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Task } from '@/types/task';
import { useListStore } from './listStore';
import { toast } from 'sonner'; // ← Import toast

interface TaskState {
  tasksByList: Record<string, Task[]>;
  loadingLists: Record<string, boolean>;

  fetchTasks: (listId: string) => Promise<void>;
  createTask: (listId: string, input: { title: string }) => Promise<Task>;
  updateTask: (taskId: string, listId: string, patch: Partial<Task>) => Promise<Task>;
  deleteTask: (taskId: string, listId: string) => Promise<void>;
  reorderTasks: (listId: string, newTasks: Task[]) => Promise<void>;
  setTasks: (listId: string, tasks: Task[]) => void;
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
    } catch (err: any) {
      console.error('Failed to fetch tasks', err);
      // Silent fail — loading state will handle the UI
      if (err?.response?.status !== 401) {
        toast.error('Failed to load tasks');
      }
    } finally {
      set((s) => ({ loadingLists: { ...s.loadingLists, [listId]: false } }));
    }
  },

  createTask: async (listId, input) => {
    try {
      const { data } = await api.post<{ task: Task }>(`/lists/${listId}/tasks`, input);

      const currentTasks = get().tasksByList[listId] ?? [];
      
      // Check if it's already there (from the socket)
      if (!currentTasks.some((t) => t.id === data.task.id)) {
        get().setTasks(listId, [data.task, ...currentTasks]);
      }

      // Update the list count in the sidebar
      useListStore.getState().incrementTaskCount(listId, 1);
      toast.success('Task created');

      return data.task;
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to create task');
      throw err;
    }
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
    } catch (err: any) {
      console.error('Failed to save task order', err);
      toast.error('Failed to save task order');
    }
  },

  updateTask: async (taskId, listId, patch) => {
    try {
      const { data } = await api.patch<{ task: Task }>(`/tasks/${taskId}`, patch);
      set((s) => ({
        tasksByList: {
          ...s.tasksByList,
          [listId]: (s.tasksByList[listId] ?? []).map((t) =>
            t.id === taskId ? data.task : t
          ),
        },
      }));
      // toast.success('Task updated');
      return data.task;
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to update task');
      throw err;
    }
  },

  deleteTask: async (taskId, listId) => {
    try {
      await api.delete(`/tasks/${taskId}`);

      set((s) => ({
        tasksByList: {
          ...s.tasksByList,
          [listId]: (s.tasksByList[listId] ?? []).filter((t) => t.id !== taskId),
        },
      }));

      useListStore.getState().incrementTaskCount(listId, -1);
      toast.success('Task deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to delete task');
      throw err;
    }
  },

  setTasks: (listId, tasks) => {
    set((s) => {
      const uniqueTasks = Array.from(
        new Map(tasks.map((t) => [t.id, t])).values()
      );
      return {
        tasksByList: {
          ...s.tasksByList,
          [listId]: uniqueTasks,
        },
      };
    });
  },

  clear: () => set({ tasksByList: {}, loadingLists: {} }),
}));
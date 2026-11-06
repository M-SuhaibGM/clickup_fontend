'use client';

import { useEffect } from 'react';
import { connectSocket } from '@/lib/socket';
import { useTaskStore } from '@/store/taskStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { toast } from 'sonner';

export default function SocketProvider({ projectId }: { projectId: string }) {
  useEffect(() => {
    const socket = connectSocket();
    socket.emit('join:project', projectId);

    // Helper: refresh the pending task count using the CURRENT workspace
    const refreshCount = () => {
      const wsId = useWorkspaceStore.getState().activeWorkspace?.id;
      if (wsId) useWorkspaceStore.getState().fetchPendingTaskCount(wsId);
    };

    socket.on('task:created', (newTask) => {
      const { tasksByList, setTasks } = useTaskStore.getState();
      const currentTasks = tasksByList[newTask.listId] ?? [];
      if (currentTasks.some((t) => t.id === newTask.id)) return;
      
      setTasks(newTask.listId, [newTask, ...currentTasks]);
      refreshCount();
    });

    socket.on('task:updated', (updatedTask) => {
      const { tasksByList, setTasks } = useTaskStore.getState();
      const currentTasks = tasksByList[updatedTask.listId] ?? [];

      const newTasks = currentTasks.map((t) =>
        t.id === updatedTask.id ? updatedTask : t
      );
      setTasks(updatedTask.listId, newTasks);
      refreshCount();
    });

    socket.on('task:deleted', ({ id, listId }) => {
      const { tasksByList, setTasks } = useTaskStore.getState();
      const currentTasks = tasksByList[listId] ?? [];
      
      setTasks(listId, currentTasks.filter((t) => t.id !== id));
      refreshCount();
    });

    return () => {
      socket.emit('leave:project', projectId);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [projectId]);

  return null;
}
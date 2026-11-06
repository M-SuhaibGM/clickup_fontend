'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // ← Add useRouter
import { useWorkspaceStore } from '@/store/workspaceStore';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, CheckSquare, ListTodo, MessageSquare, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  list: {
    id: string;
    name: string;
    project: { id: string; name: string; color: string };
  };
  subtasks: { id: string; title: string; status: string }[];
  _count?: { comments: number };
}

export default function MyTasksPage() {
  const router = useRouter(); // ← Add
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTasks = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ tasks: Task[] }>(`/workspaces/${activeWorkspace.id}/my-tasks`);
      setTasks(data.tasks);
    } catch (err) {
      console.error('Failed to fetch my tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace]);

  const handleProgressChange = async (taskId: string, newStatus: string) => {
    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
      fetchMyTasks();
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-4 w-1/3 mb-4" />
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-indigo-500" /> My Tasks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          All tasks assigned to you in <span className="font-semibold text-foreground">{activeWorkspace?.name}</span>
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-7 w-7 text-indigo-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">You're all caught up!</h2>
          <p className="text-sm text-muted-foreground">You have no tasks assigned to you in this workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const isDone = task.status === 'DONE';
            const subtaskProgress = task.subtasks?.filter(st => st.status === 'DONE').length ?? 0;
            const totalSubtasks = task.subtasks?.length ?? 0;
            const due = task.dueDate ? new Date(task.dueDate) : null;
            const overdue = due && due < new Date() && !isDone;

            return (
              <div
                key={task.id}
                onClick={() => router.push(`/tasks/${task.id}`)} // ← Redirect to Task Page
                className="group flex flex-col bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all cursor-pointer overflow-hidden"
              >
                {/* Card Header - Project Name */}
                <div className="px-4 py-2 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.list.project.color }} />
                  <span className="text-[11px] font-semibold text-muted-foreground truncate uppercase tracking-wider">
                    {task.list.project.name} / {task.list.name}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-3">
                  {/* Title & Priority */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold text-sm line-clamp-2 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </h3>
                    {task.priority && (
                      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        task.priority === 'URGENT' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' :
                        task.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' :
                        'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        {task.priority}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-auto pt-2">
                    {totalSubtasks > 0 && (
                      <div className="flex items-center gap-1">
                        <ListTodo className="h-3.5 w-3.5" />
                        <span>{subtaskProgress}/{totalSubtasks}</span>
                      </div>
                    )}
                    {task._count?.comments && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{task._count.comments}</span>
                      </div>
                    )}
                    {due && (
                      <div className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-semibold' : ''}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer - Status Dropdown */}
                <div className="px-4 py-3 border-t border-border/50 bg-muted/10">
                  <select
                    value={task.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleProgressChange(task.id, e.target.value)}
                    className="w-full text-xs font-semibold bg-background border border-input rounded-md px-2 py-1.5 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
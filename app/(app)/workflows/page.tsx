'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Workflow,
  Plus,
  Trash2,
  ShieldAlert,
  Loader2,
  Zap,
  Play,
  Bell,
  UserPlus,
  CheckSquare,
  X
} from 'lucide-react';

interface Automation {
  id: string;
  trigger: string;
  action: string;
  actionValue: string | null;
  isActive: boolean;
  createdAt: string;
}

const TRIGGERS = [
  { value: 'TASK_CREATED', label: 'When a task is created' },
  { value: 'STATUS_DONE', label: 'When a task is marked Done' },
  { value: 'PRIORITY_URGENT', label: 'When a task is marked Urgent' },
];

const ACTIONS = [
  { value: 'ASSIGN_TO_ADMIN', label: 'Assign it to the Admin' },
  { value: 'SEND_EMAIL', label: 'Notify the assignee via email' },
  { value: 'CREATE_SUBTASK', label: 'Create a follow-up subtask' },
];

export default function WorkflowsPage() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const currentUser = useAuthStore((s) => s.user);

  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [trigger, setTrigger] = useState(TRIGGERS[0].value);
  const [action, setAction] = useState(ACTIONS[0].value);
  const [creating, setCreating] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<Automation | null>(null);

  const fetchAutomations = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      // 1. Verify Admin status
      const wsData = await api.get<{ workspace: { members: any[] } }>(`/workspaces/${activeWorkspace.id}`);
      const me = wsData.data.workspace.members.find((m) => m.userId === currentUser?.id);
      setIsAdmin(me?.role === 'ADMIN');

      // 2. Fetch automations
      const { data } = await api.get<{ automations: Automation[] }>(`/workspaces/${activeWorkspace.id}/automations`);
      setAutomations(data.automations);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setIsAdmin(false);
      } else {
        toast.error('Failed to load workflows');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setCreating(true);
    try {
      const { data } = await api.post<{ automation: Automation }>(`/workspaces/${activeWorkspace.id}/automations`, {
        trigger,
        action,
      });
      setAutomations((prev) => [data.automation, ...prev]);
      toast.success('Workflow created');
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to create workflow');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!automationToDelete || !activeWorkspace) return;
    try {
      await api.delete(`/workspaces/${activeWorkspace.id}/automations/${automationToDelete.id}`);
      setAutomations((prev) => prev.filter((a) => a.id !== automationToDelete.id));
      toast.success('Workflow deleted');
    } catch {
      toast.error('Failed to delete workflow');
    } finally {
      setAutomationToDelete(null);
    }
  };

  const getTriggerLabel = (val: string) => TRIGGERS.find((t) => t.value === val)?.label ?? val;
  const getActionLabel = (val: string) => ACTIONS.find((a) => a.value === val)?.label ?? val;

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 mt-20">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">Only workspace admins can manage workflows.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Workflow className="h-6 w-6 text-indigo-500" /> Workflows
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automate actions when things happen in <span className="font-semibold text-foreground">{activeWorkspace?.name}</span>.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" /> New Workflow
        </button>
      </div>

      {automations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
            <Zap className="h-7 w-7 text-indigo-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">No workflows yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Automate repetitive tasks by creating a rule. For example: "When a task is marked Done, assign it to the Admin."
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all"
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">When</span>
                    <span className="text-sm font-medium text-foreground">{getTriggerLabel(auto.trigger)}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">→ Then</span>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{getActionLabel(auto.action)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Created {new Date(auto.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAutomationToDelete(auto)}
                className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-lg transition shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">New Workflow</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Automate a repetitive task with a simple rule.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Play className="h-3 w-3 text-indigo-500" /> Trigger
                </label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Bell className="h-3 w-3 text-amber-500" /> Action
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                >
                  {ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-input py-2.5 text-sm font-medium text-foreground hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {creating ? 'Creating...' : 'Create Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!automationToDelete} onOpenChange={(open) => !open && setAutomationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This workflow will be permanently removed. Tasks will no longer be affected by it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
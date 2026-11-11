// frontend/app/(app)/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Settings, Save, Trash2, Loader2, ShieldAlert } from 'lucide-react';
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

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const { activeWorkspace, workspaces, setActiveWorkspace, fetchWorkspaces } = useWorkspaceStore();
  const currentUser = useAuthStore((s) => s.user);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Admin & Loading state
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
      // @ts-ignore - Description safety fallback
      setDescription(activeWorkspace.description || '');
    }
  }, [activeWorkspace]);

  useEffect(() => {
    async function checkAdmin() {
      if (!activeWorkspace || !currentUser) {
        setCheckingAdmin(false);
        return;
      }
      setCheckingAdmin(true);
      try {
        const { data } = await api.get<{ workspace: { members: any[] } }>(`/workspaces/${activeWorkspace.id}`);
        const myMembership = data.workspace.members.find((m) => m.userId === currentUser.id);
        setIsAdmin(myMembership?.role === 'ADMIN');
      } catch (err) {
        console.error('Failed to check admin status', err);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    }
    checkAdmin();
  }, [activeWorkspace, currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setSaving(true);
    try {
      await api.patch(`/workspaces/${activeWorkspace.id}`, { name, description });
      await fetchWorkspaces();
      toast.success('Workspace updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeWorkspace) return;
    setDeleting(true);
    try {
      await api.delete(`/workspaces/${activeWorkspace.id}`);
      await fetchWorkspaces();
      
      const remaining = workspaces.filter((w) => w.id !== activeWorkspace.id);
      if (remaining.length > 0) {
        setActiveWorkspace(remaining[0]);
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
      toast.success('Workspace deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to delete workspace');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // 1. Skeleton Loading State (prevents flash of Access Denied)
  if (checkingAdmin) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6 w-full">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 sm:w-64" />
          <Skeleton className="h-4 w-72 sm:w-96" />
        </div>
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-full sm:w-32" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  // 2. No Active Workspace Fallback
  if (!activeWorkspace) {
    return <div className="p-8 text-center text-muted-foreground text-sm">No workspace selected.</div>;
  }

  // 3. Access Denied (Only renders after checkingAdmin complete)
  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-8 max-w-xl mx-auto text-center space-y-4 mt-16 sm:mt-20">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You must be an Admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 sm:h-6 w-5 sm:w-6 text-indigo-500" /> Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Manage your workspace's name, description, and danger zone.
        </p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* General Settings */}
        <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 sm:py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this workspace about?"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 sm:py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition resize-none"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition active:scale-[0.98]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
          <p className="text-xs sm:text-sm text-red-600/80 dark:text-red-400/80 mt-1 mb-4">
            Deleting this workspace will permanently remove all its projects, lists, tasks, and member associations. This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white hover:bg-red-700 transition active:scale-[0.98]"
          >
            <Trash2 className="h-4 w-4" /> Delete Workspace
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              This will permanently delete the <strong>{activeWorkspace.name}</strong> workspace and all of its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={deleting} className="mt-0 w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              {deleting ? 'Deleting...' : 'Delete Workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
// frontend/app/(app)/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Settings, Save, Trash2, Loader2, ShieldAlert } from 'lucide-react';
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
  const { activeWorkspace, workspaces, setActiveWorkspace, fetchWorkspaces, clear: clearWorkspaces } = useWorkspaceStore();
  const currentUser = useAuthStore((s) => s.user);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
      // @ts-ignore - We added description to the schema, but the type might be strict
      setDescription(activeWorkspace.description || '');
    }
  }, [activeWorkspace]);

  useEffect(() => {
    async function checkAdmin() {
      if (!activeWorkspace || !currentUser) return;
      try {
        const { data } = await api.get<{ workspace: { members: any[] } }>(`/workspaces/${activeWorkspace.id}`);
        const myMembership = data.workspace.members.find((m) => m.userId === currentUser.id);
        setIsAdmin(myMembership?.role === 'ADMIN');
      } catch (err) {
        console.error('Failed to check admin status', err);
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
      await fetchWorkspaces(); // Refresh global list
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
      await fetchWorkspaces(); // Refresh global list
      
      // Find another workspace to switch to, or clear the active one
      const remaining = workspaces.filter(w => w.id !== activeWorkspace.id);
      if (remaining.length > 0) {
        setActiveWorkspace(remaining[0]);
        router.push('/dashboard');
      } else {
        // No workspaces left, redirect to onboarding
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

  if (!activeWorkspace) {
    return <div className="p-8 text-center text-muted-foreground">No workspace selected.</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 mt-20">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You must be an Admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-500" /> Workspace Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your workspace's name, description, and danger zone.
        </p>
      </div>

      <div className="space-y-8">
        {/* General Settings */}
        <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this workspace about?"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition resize-none"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
          <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1 mb-4">
            Deleting this workspace will permanently remove all its projects, lists, tasks, and member associations. This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
          >
            <Trash2 className="h-4 w-4" /> Delete Workspace
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the <strong>{activeWorkspace.name}</strong> workspace and all of its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete Workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
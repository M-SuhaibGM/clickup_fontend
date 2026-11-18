// frontend/app/(app)/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Loader2, ShieldAlert } from 'lucide-react';
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

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setName(activeWorkspace.name); return; }
    if (trimmed === activeWorkspace.name) return;
    setSaving(true);
    try {
      await api.patch(`/workspaces/${activeWorkspace.id}`, { name: trimmed, description });
      await fetchWorkspaces();
      toast.success('Workspace updated successfully');
    } catch (err: any) {
      setName(activeWorkspace.name);
      toast.error(err?.response?.data?.error ?? 'Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const card = 'rounded-xl border border-border bg-card overflow-hidden divide-y divide-border';
  const sectionTitle = 'text-sm font-semibold text-foreground mb-3 flex items-center gap-2';

  const Toggle = ({ disabled }: { disabled?: boolean }) => (
    <button
      type="button"
      role="switch"
      aria-checked={false}
      disabled={disabled}
      className="relative h-5 w-9 rounded-full bg-muted-foreground/40 flex-shrink-0 cursor-not-allowed"
    >
      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
    </button>
  );

  const AddButton = () => (
    <button
      type="button"
      disabled
      className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-muted-foreground cursor-not-allowed"
    >
      Add
    </button>
  );

  const brandingRows = [
    { title: 'Round logo', desc: 'We recommend a 72 × 72 px PNG file. This logo is used in-app as your Workspace avatar.' },
    { title: 'Rectangle logo', desc: 'We recommend a 232 × 48 px PNG file. This logo appears on emails, your login screen, and public links to items like Forms, Docs, Dashboards, and tasks.' },
    { title: 'Social media graphic', desc: 'We recommend a 500 × 260 px PNG file. This graphic serves as the preview image when links are shared.' },
  ];
  const swatches = ['#4b4c52', '#6f5bd1', '#1f7fb5', '#d0508a', '#9b4fc4', '#5b64d6', '#e0721f', '#1d9488', '#9a8070', '#2f9e6b'];

  return (
    <div className="px-3 sm:px-8 py-5 sm:py-8 w-full min-w-0">
      <div className="max-w-[720px] mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8">Workspace Settings</h1>

        {/* General */}
        <h2 className={sectionTitle}>General</h2>
        <div className={card}>
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-sm font-semibold text-foreground">Avatar</span>
            <div className="h-7 w-7 rounded-md bg-teal-500 text-white text-xs font-bold flex items-center justify-center">
              {activeWorkspace.name[0]?.toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 px-4 py-4">
            <label htmlFor="ws-name" className="text-sm font-semibold text-foreground">Name</label>
            <div className="relative w-full sm:max-w-[240px]">
              <input
                id="ws-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className="w-full rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-muted-foreground/70 transition"
              />
              {saving && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 px-4 py-4">
            <label htmlFor="ws-desc" className="text-sm font-semibold text-foreground sm:pt-1.5">Description</label>
            <textarea
              id="ws-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={async () => {
                // @ts-ignore - Description safety fallback
                if (description === (activeWorkspace.description || '')) return;
                try {
                  await api.patch(`/workspaces/${activeWorkspace.id}`, { name: activeWorkspace.name, description });
                  await fetchWorkspaces();
                  toast.success('Workspace updated successfully');
                } catch (err: any) {
                  toast.error(err?.response?.data?.error ?? 'Failed to update workspace');
                }
              }}
              rows={2}
              placeholder="What is this workspace about?"
              className="w-full sm:max-w-[240px] resize-none rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-muted-foreground/70 transition"
            />
          </div>
        </div>

        {/* Custom branding */}
        <h2 className={`${sectionTitle} mt-10`}>
          Custom branding
          <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 text-xs font-semibold">Enterprise</span>
        </h2>
        <div className={card}>
          <div className="flex items-center justify-between px-4 py-5">
            <span className="text-sm font-semibold text-foreground">Enable custom branding</span>
            <Toggle disabled />
          </div>
          <div className="opacity-50 divide-y divide-border">
            {brandingRows.map((r) => (
              <div key={r.title} className="flex items-center justify-between gap-3 sm:gap-6 px-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                </div>
                <AddButton />
              </div>
            ))}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 px-4 py-4">
              <span className="text-sm font-semibold text-foreground">Color scheme</span>
              <div className="flex flex-wrap items-center gap-3">
                {swatches.map((c) => (
                  <span key={c} className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: c }} />
                ))}
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 px-4 py-4">
              <span className="text-sm font-semibold text-foreground">Custom URL</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                <input
                  disabled
                  placeholder="app"
                  className="w-full sm:w-[230px] min-w-0 rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none cursor-not-allowed"
                />
                .clickup.com
              </div>
            </div>
          </div>
        </div>

        {/* Personal layout */}
        <h2 className={`${sectionTitle} mt-10`}>Personal layout</h2>
        <div className={card}>
          <div className="flex items-center justify-between gap-3 sm:gap-6 px-4 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Personal Workspace layout</p>
              <p className="text-xs text-muted-foreground mt-1">
                Work by yourself? Turn this on to maximize your efficiency by removing features designed for team collaboration.
              </p>
            </div>
            <Toggle disabled />
          </div>
        </div>

        {/* Danger zone */}
        <h2 className={`${sectionTitle} mt-10`}>Danger zone</h2>
        <div className={card}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-4 py-4">
            <span className="text-sm font-semibold text-foreground">Delete this Workspace forever</span>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-md border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition sm:flex-shrink-0"
            >
              Delete Workspace
            </button>
          </div>
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
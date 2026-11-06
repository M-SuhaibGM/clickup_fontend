'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUserStore } from '@/store/userStore'; // ← Import
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function InviteMemberModal({ open, onClose }: Props) {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const fetchUsers = useUserStore((s) => s.fetchUsers); // ← Import
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !activeWorkspace) return;

    setAdding(true);
    try {
      // CHANGED: Call /members instead of /invites
      const { data } = await api.post(`/workspaces/${activeWorkspace.id}/members`, { 
        email: email.trim() 
      });
      
      toast.success(`${data.user.name} was added to the workspace!`);
      
      // Refresh the workspace members so they appear in the Assignee dropdown
      await fetchUsers(activeWorkspace.id);
      
      setEmail('');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Add Member</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add a user to <span className="font-semibold">{activeWorkspace?.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">User Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                required
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              The user must already have a ClickUp Clone account.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-input py-2.5 text-sm font-medium text-foreground hover:bg-accent transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding || !email.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
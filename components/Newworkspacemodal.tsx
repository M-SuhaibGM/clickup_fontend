// components/NewWorkspaceModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Loader2, Building2, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAX_LENGTH = 50;

export default function NewWorkspaceModal({ open, onClose }: Props) {
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  // Reset the form every time the modal is closed
  useEffect(() => {
    if (!open) {
      setName('');
      setCreating(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !creating) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, creating, onClose]);

  if (!open) return null;

  const trimmed = name.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < 2;

  // components/NewWorkspaceModal.tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trimmed.length < 2 || creating) return;

    setCreating(true);
    try {
      await createWorkspace(trimmed);
      // REMOVED: toast.success(...)
      onClose();
    } catch (err: any) {
      // REMOVED: toast.error(...)
    } finally {
      setCreating(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !creating && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-workspace-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 id="new-workspace-title" className="text-lg font-bold text-foreground">
              Create Workspace
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              A workspace holds your projects, lists and team members.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground p-1 rounded disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="workspace-name"
              className="block text-[13px] font-semibold text-foreground mb-1.5"
            >
              Workspace Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="workspace-name"
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_LENGTH}
                placeholder="e.g. Acme Marketing"
                required
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className={`text-xs ${tooShort ? 'text-red-600' : 'text-muted-foreground'}`}>
                {tooShort ? 'Name must be at least 2 characters.' : 'You will be the owner of this workspace.'}
              </p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {name.length}/{MAX_LENGTH}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="flex-1 rounded-lg border border-input py-2.5 text-sm font-medium text-foreground hover:bg-accent transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || trimmed.length < 2}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Workspace'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
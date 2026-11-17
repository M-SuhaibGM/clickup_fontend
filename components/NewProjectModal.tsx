'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore'; // ← Import
import { useSpaceStore } from '@/store/spaceStore';

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-select this space (e.g. when created from a space's "+" button) */
  defaultSpaceId?: string | null;
}

export default function NewProjectModal({ open, onClose, defaultSpaceId }: Props) {
  const router = useRouter();
  const createProject = useProjectStore((s) => s.createProject);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace); // ← Get active workspace
  const spaces = useSpaceStore((s) => s.spaces);
  const [spaceId, setSpaceId] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setColor(COLORS[0]);
      setError(null);
      const preferred = spaces.find((sp) => sp.id === defaultSpaceId) ?? spaces[0];
      setSpaceId(preferred?.id ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultSpaceId]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Project name is required');
    if (!activeWorkspace) return setError('No active workspace found');
    if (!spaceId) return setError('Choose a space for this project');
    
    setSaving(true);
    setError(null);
    try {
      // UPDATED: Pass activeWorkspace.id to createProject
      const project = await createProject(activeWorkspace.id, { 
        name: name.trim(), 
        spaceId,
        description: description.trim() || undefined, 
        color 
      });
      onClose();
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">New Project</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Space</label>
            {spaces.length === 0 ? (
              <p className="text-xs text-muted-foreground">Create a space first — every project lives inside one.</p>
            ) : (
              <select
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition"
              >
                {spaces.map((sp) => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Site Redesign"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              A channel with the same name is created for this project automatically.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this project about?"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    color === c 
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' 
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs px-3 py-2">
              {error}
            </div>
          )}

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
              disabled={saving || spaces.length === 0}
              className="flex-1 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60 transition"
            >
              {saving ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
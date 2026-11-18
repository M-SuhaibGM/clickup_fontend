'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiError } from '@/lib/apiError';
import { useListStore } from '@/store/listStore';
import { useProjectStore } from '@/store/projectStore';
import { useSpaceStore } from '@/store/spaceStore';

const MAX_NAME = 60;

// The form only exists while open, so its state starts fresh every time.
export default function NewListModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <NewListForm onClose={onClose} /> : null;
}

function NewListForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const projects = useProjectStore((s) => s.projects);
  const spaces = useSpaceStore((s) => s.spaces);

  // Default to the project you're looking at, otherwise the first one
  const current = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  const [projectId, setProjectId] = useState(
    projects.find((p) => p.id === current)?.id ?? projects[0]?.id ?? ''
  );
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(
    () =>
      spaces
        .map((sp) => ({ space: sp, projects: projects.filter((p) => p.spaceId === sp.id) }))
        .filter((g) => g.projects.length > 0),
    [spaces, projects]
  );
  const ungrouped = projects.filter((p) => !p.spaceId || !spaces.some((sp) => sp.id === p.spaceId));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return setError('Choose a project for this list');
    if (!name.trim()) return setError('List name is required');
    setSaving(true);
    setError(null);
    try {
      const list = await useListStore.getState().createList(projectId, name.trim());
      toast.success(`List "${list.name}" created`);
      onClose();
      router.push(`/projects/${projectId}?listId=${list.id}`);
    } catch (err) {
      setError(apiError(err, 'Failed to create list'));
    } finally {
      setSaving(false);
    }
  };

  const input =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-list-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border"
      >
        <h2 id="new-list-title" className="text-lg font-bold text-foreground">Create a List</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-5">Lists hold the tasks of a project.</p>

        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Create a project first — every list lives inside one.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Project</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={input}>
                {groups.map((g) => (
                  <optgroup key={g.space.id} label={g.space.name}>
                    {g.projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                ))}
                {ungrouped.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Name</label>
              <input autoFocus value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sprint backlog" className={input} />
            </div>
            {error && <div className="rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs px-3 py-2">{error}</div>}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-lg border border-input py-2.5 text-sm font-medium text-foreground hover:bg-accent transition">Cancel</button>
              <button type="submit" disabled={saving || !name.trim()} className="flex-1 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60 transition">
                {saving ? 'Creating…' : 'Create List'}
              </button>
            </div>
          </form>
        )}
        {projects.length === 0 && (
          <div className="flex justify-end pt-4">
            <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

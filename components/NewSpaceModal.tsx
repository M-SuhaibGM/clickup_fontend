'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiError } from '@/lib/apiError';
import { SPACE_COLORS, SPACE_ICONS, SPACE_ICON_NAMES } from '@/lib/spaceIcons';
import { useSpaceStore } from '@/store/spaceStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import SpaceIcon from './SpaceIcon';

const MAX_NAME = 50;
const MAX_DESC = 500;

interface Props {
  open: boolean;
  onClose: () => void;
}

// The form only exists while open, so its state starts fresh every time.
export default function NewSpaceModal({ open, onClose }: Props) {
  return open ? <NewSpaceForm onClose={onClose} /> : null;
}

function NewSpaceForm({ onClose }: { onClose: () => void }) {
  const createSpace = useSpaceStore((s) => s.createSpace);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<string | null>(null); // null = first letter of the name
  const [color, setColor] = useState(SPACE_COLORS[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const customColor = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || saving) return;
      if (pickerOpen) setPickerOpen(false);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [saving, pickerOpen, onClose]);

  // Click outside the picker closes it
  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [pickerOpen]);

  const visibleIcons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? SPACE_ICON_NAMES.filter((n) => n.includes(q)) : SPACE_ICON_NAMES;
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Space name is required');
    if (!activeWorkspace) return setError('No active workspace found');

    setSaving(true);
    setError(null);
    try {
      const space = await createSpace(activeWorkspace.id, {
        name: name.trim(),
        color,
        icon,
        description: description.trim() || undefined,
      });
      toast.success(`Space "${space.name}" created`);
      onClose();
    } catch (err) {
      setError(apiError(err, 'Failed to create space'));
    } finally {
      setSaving(false);
    }
  };

  const gridBtn = 'h-9 w-9 flex items-center justify-center rounded-md transition hover:bg-accent text-foreground';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-space-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[560px] rounded-2xl bg-card shadow-2xl border border-border"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
          className="absolute right-4 top-4 h-8 w-8 flex items-center justify-center rounded-full bg-accent text-muted-foreground hover:text-foreground transition"
        >
          <X className="h-4 w-4" />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-6 pb-5 space-y-5">
            <div className="pr-10">
              <h2 id="new-space-title" className="text-lg font-bold text-foreground">Create a Space</h2>
              <p className="text-[13px] text-muted-foreground mt-1">
                A Space represents teams, departments, or groups, each with its own projects, channels and lists.
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-foreground mb-2">Icon &amp; name</label>
              <div className="relative flex items-center gap-3" ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  aria-label="Choose icon"
                  aria-expanded={pickerOpen}
                  className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-input bg-background hover:border-ring transition"
                >
                  <SpaceIcon name={name || 'S'} icon={icon} color={color} size={24} />
                </button>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  maxLength={MAX_NAME}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marketing, Engineering, HR"
                  className="flex-1 min-w-0 h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
                />

                {pickerOpen && (
                  <div className="absolute left-0 top-12 z-10 w-[340px] rounded-xl border border-border bg-popover shadow-2xl">
                    <div className="px-4 pt-3 pb-2 border-b border-border">
                      <span className="inline-block text-[13px] font-semibold text-foreground border-b-2 border-foreground pb-2 -mb-2.5">Icon</span>
                    </div>

                    <div className="flex items-center gap-2 p-3">
                      <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-2.5 h-9 focus-within:border-ring">
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search..."
                          className="flex-1 min-w-0 bg-transparent text-[13px] outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setColorsOpen((v) => !v)}
                        aria-label="Choose color"
                        aria-expanded={colorsOpen}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-input hover:bg-accent transition"
                      >
                        <Circle className="h-4 w-4" fill={color} stroke={color} />
                      </button>
                      <button
                        type="button"
                        onClick={() => customColor.current?.click()}
                        aria-label="Custom color"
                        title="Custom color"
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-input hover:bg-accent transition"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <input
                        ref={customColor}
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="sr-only"
                        tabIndex={-1}
                        aria-hidden
                      />
                    </div>

                    {colorsOpen && (
                      <div className="flex flex-wrap gap-2 px-3 pb-3">
                        {SPACE_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            aria-label={`Color ${c}`}
                            className={`h-6 w-6 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-offset-popover ring-foreground' : 'hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-8 gap-0.5 px-3 pb-3 max-h-[260px] overflow-y-auto custom-scrollbar">
                      {!query.trim() && (
                        <button
                          type="button"
                          title="First letter of the name"
                          onClick={() => { setIcon(null); setPickerOpen(false); }}
                          className={`${gridBtn} text-sm font-bold ${icon === null ? 'bg-accent ring-1 ring-ring' : ''}`}
                        >
                          {name.trim().charAt(0).toUpperCase() || 'S'}
                        </button>
                      )}
                      {visibleIcons.map((n) => {
                        const Icon = SPACE_ICONS[n];
                        return (
                          <button
                            key={n}
                            type="button"
                            title={n}
                            onClick={() => { setIcon(n); setPickerOpen(false); }}
                            className={`${gridBtn} ${icon === n ? 'bg-accent ring-1 ring-ring' : ''}`}
                          >
                            <Icon className="h-[18px] w-[18px]" />
                          </button>
                        );
                      })}
                      {visibleIcons.length === 0 && (
                        <p className="col-span-8 py-6 text-center text-[13px] text-muted-foreground">No icons match &quot;{query}&quot;</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="space-desc" className="block text-[13px] font-semibold text-foreground mb-2">
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="space-desc"
                type="text"
                value={description}
                maxLength={MAX_DESC}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs px-3 py-2">{error}</div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? 'Creating…' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

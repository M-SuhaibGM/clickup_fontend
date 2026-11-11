'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import type { List } from '@/types/list';
import { useListStore } from '@/store/listStore';
import { useTaskStore } from '@/store/taskStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type DraftTask = { title: string; description: string; priority: string };

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800',
  NORMAL: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300',
  HIGH: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300',
  URGENT: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300',
};

const EXAMPLES = [
  'Plan a product launch',
  'Onboard a new engineer',
  'Organize a team offsite',
  'Prepare a Q3 marketing campaign',
];

export default function AiDraftModal({
  open,
  onClose,
  projectId,
  lists,
  defaultListId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  lists: List[];
  defaultListId: string | null;
  onDone: (listId: string) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [targetListId, setTargetListId] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const createList = useListStore((s) => s.createList);
  const incrementTaskCount = useListStore((s) => s.incrementTaskCount);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  useEffect(() => {
    if (open) {
      setTargetListId(defaultListId ?? lists[0]?.id ?? '');
    } else {
      // reset when closed
      setPrompt('');
      setTasks([]);
      setSelected([]);
    }
  }, [open, defaultListId, lists]);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setTasks([]);
    try {
      const { data } = await api.post<{ tasks: DraftTask[] }>('/ai/draft', { prompt });
      if (!data.tasks?.length) {
        toast.error('AI did not return any tasks — try rephrasing');
        return;
      }
      setTasks(data.tasks);
      setSelected(data.tasks.map(() => true));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'AI request failed');
    } finally {
      setGenerating(false);
    }
  };

  const selectedCount = selected.filter(Boolean).length;

  const handleCreate = async () => {
    if (creating || selectedCount === 0) return;
    setCreating(true);
    try {
      // Ensure we have a target list
      let listId = targetListId;
      if (!listId) {
        const newList = await createList(projectId, prompt.trim().slice(0, 40) || 'AI Tasks');
        listId = newList.id;
      }

      const chosen = tasks.filter((_, i) => selected[i]);
      let added = 0;
      for (const t of chosen) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await api.post(`/lists/${listId}/tasks`, {
            title: t.title,
            description: t.description,
            priority: t.priority,
          });
          added++;
        } catch {
          /* skip failed */
        }
      }

      if (added > 0) {
        incrementTaskCount(listId, added);
        await fetchTasks(listId);
        toast.success(`Added ${added} task${added === 1 ? '' : 's'} ✨`);
        onDone(listId);
        onClose();
      } else {
        toast.error('Could not create tasks');
      }
    } finally {
      setCreating(false);
    }
  };

  const toggle = (i: number) =>
    setSelected((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            AI Task Planner
          </DialogTitle>
          <DialogDescription>
            Describe a goal and let AI break it into a ready-to-go task list.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 overflow-y-auto">
          {/* Prompt */}
          <div className="space-y-2">
            <textarea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate();
              }}
              rows={2}
              placeholder="e.g. Plan a product launch for our mobile app…"
              className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-indigo-500 resize-none"
            />
            {tasks.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    className="text-[11px] px-2 py-1 rounded-full border border-border/70 text-muted-foreground hover:bg-muted transition"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Generated tasks */}
          {tasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {selectedCount} of {tasks.length} selected
                </span>
              </div>
              <div className="space-y-1.5">
                {tasks.map((t, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition ${
                      selected[i]
                        ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20'
                        : 'border-border/60 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected[i]}
                      onChange={() => toggle(i)}
                      className="mt-0.5 h-4 w-4 rounded border-input text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{t.title}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.NORMAL
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
          {tasks.length > 0 && lists.length > 0 ? (
            <select
              value={targetListId}
              onChange={(e) => setTargetListId(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 max-w-[45%]"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  Add to: {l.name}
                </option>
              ))}
            </select>
          ) : (
            <span />
          )}

          {tasks.length === 0 ? (
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 disabled:opacity-60 transition"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {generating ? 'Generating…' : 'Generate tasks'}
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating || selectedCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {creating ? 'Adding…' : `Add ${selectedCount} task${selectedCount === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

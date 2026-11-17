'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Video, Copy, Trash2, Play } from 'lucide-react';
import { api } from '@/lib/api';
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

interface Clip {
  id: string;
  title: string;
  url: string;
  duration: number | null;
  size: number | null;
  createdAt: string;
}

function fmtDuration(sec: number | null) {
  if (!sec) return '';
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
}

function fmtSize(bytes: number | null) {
  if (!bytes) return '';
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<Clip | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<{ clips: Clip[] }>('/clips');
      setClips(data.clips);
    } catch {
      toast.error('Failed to load clips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onChanged = () => void load();
    window.addEventListener('clips:changed', onChanged);
    return () => window.removeEventListener('clips:changed', onChanged);
  }, [load]);

  const copyLink = async (clip: Clip) => {
    try {
      await navigator.clipboard.writeText(clip.url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const clip = toDelete;
    setToDelete(null);
    try {
      await api.delete(`/clips/${clip.id}`);
      setClips((c) => c.filter((x) => x.id !== clip.id));
      toast.success('Clip deleted');
    } catch {
      toast.error('Failed to delete clip');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Video className="h-5 w-5 text-red-400" />
        <h1 className="text-xl font-semibold">Clips</h1>
        {!loading && <span className="text-sm text-(--c-8a8c91)">({clips.length})</span>}
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-video w-full rounded-xl" />)}
        </div>
      ) : clips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-(--c-8a8c91)">
          <Play className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">No clips yet. Use the video icon in the top bar to record one.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {clips.map((clip) => (
            <div key={clip.id} className="rounded-xl border border-(--c-333438) bg-(--c-1e1f21) overflow-hidden">
              <video src={clip.url} controls preload="metadata" className="w-full aspect-video bg-black" />
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-(--c-white) truncate">{clip.title}</p>
                  <p className="text-[11px] text-(--c-8a8c91) mt-0.5">
                    {[fmtDuration(clip.duration), fmtSize(clip.size), new Date(clip.createdAt).toLocaleDateString()]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyLink(clip)}
                    title="Copy link"
                    className="p-1.5 rounded text-(--c-8a8c91) hover:text-(--c-white) hover:bg-(--c-2a2b2e) transition"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setToDelete(clip)}
                    title="Delete"
                    className="p-1.5 rounded text-(--c-8a8c91) hover:text-red-400 hover:bg-(--c-2a2b2e) transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="bg-(--c-1e1f21) border-(--c-333438) text-(--c-white)">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this clip?</AlertDialogTitle>
            <AlertDialogDescription className="text-(--c-8a8c91)">
              The video will be permanently removed and its link will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-(--c-2a2b2e) border-(--c-333438) text-(--c-white) hover:bg-(--c-333438) hover:text-(--c-white)">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

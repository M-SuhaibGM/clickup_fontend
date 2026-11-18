'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Task } from '@/types/task';

/** A shareable task link: finds the task's project and opens it there with the task modal showing. */
export default function TaskLinkPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get<{ task: Task }>(`/tasks/${id}`)
      .then(({ data }) => {
        if (cancelled) return;
        const { task } = data;
        const projectId = task.list?.projectId;
        if (!projectId) return setMissing(true);
        router.replace(`/projects/${projectId}?listId=${task.listId}&task=${task.id}`);
      })
      .catch(() => !cancelled && setMissing(true));
    return () => { cancelled = true; };
  }, [id, router]);

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center p-8 text-center">
      {missing ? (
        <div>
          <p className="mb-1 font-semibold text-[color:var(--c-white)]">Task not found</p>
          <p className="mb-3 text-sm text-[color:var(--c-8a8c91)]">It may have been deleted, or you don&apos;t have access to it.</p>
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:underline">Back to home</Link>
        </div>
      ) : (
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      )}
    </div>
  );
}

'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';

export interface RecentItem {
  kind: 'task' | 'project';
  id: string;
  title: string;
  /** "in Project 1" — where it lives */
  context?: string;
  /** tasks need their list to open */
  listId?: string;
  workspaceId?: string;
  at: number;
}

const KEY = 'recent-items';
const EVENT = 'recent-items-change';
const MAX = 12;

const read = (): RecentItem[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

/** Remember that the user just opened a task or project (kept in this browser). */
export function pushRecent(item: Omit<RecentItem, 'at' | 'workspaceId'>) {
  try {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id;
    const rest = read().filter((r) => !(r.kind === item.kind && r.id === item.id));
    localStorage.setItem(KEY, JSON.stringify([{ ...item, workspaceId, at: Date.now() }, ...rest].slice(0, MAX * 3)));
    window.dispatchEvent(new Event(EVENT));
  } catch { /* storage unavailable */ }
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
};
const snapshot = () => {
  try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; }
};

/** Recently opened items for the current workspace, newest first. */
export function useRecents(): RecentItem[] {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '');
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);
  return useMemo(() => {
    if (!raw) return [];
    try {
      const list = JSON.parse(raw) as RecentItem[];
      return list.filter((r) => !r.workspaceId || r.workspaceId === workspaceId).slice(0, MAX);
    } catch {
      return [];
    }
  }, [raw, workspaceId]);
}

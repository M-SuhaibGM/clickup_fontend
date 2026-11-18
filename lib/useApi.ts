'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

/**
 * GET a URL and keep the result. Re-fetches when the URL, params or `reloadKey` change; the previous data
 * stays on screen while the new request is in flight (`loading` is true meanwhile). `mutate` edits the cached
 * data locally, for optimistic updates.
 */
export function useApi<T>(url: string | null, params?: Record<string, string>, reloadKey = 0) {
  const paramsKey = JSON.stringify(params ?? {});
  const key = url ? `${url}|${paramsKey}|${reloadKey}` : '';
  const [state, setState] = useState<{ key: string; data: T | null; error: boolean }>({ key: '', data: null, error: false });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    api.get<T>(url, { params: JSON.parse(paramsKey) })
      .then(({ data }) => { if (!cancelled) setState({ key, data, error: false }); })
      .catch(() => { if (!cancelled) setState((s) => ({ key, data: s.data, error: true })); });
    return () => { cancelled = true; };
  }, [url, paramsKey, key]);

  const mutate = useCallback((fn: (data: T) => T) => setState((s) => (s.data ? { ...s, data: fn(s.data) } : s)), []);

  return { data: state.data, loading: !!url && state.key !== key, error: state.error && state.key === key, mutate };
}

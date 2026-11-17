/** Pulls the `{ error }` message the backend sends out of an axios error. */
export function apiError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: unknown } } } | null;
  const msg = e?.response?.data?.error;
  return typeof msg === 'string' && msg ? msg : fallback;
}

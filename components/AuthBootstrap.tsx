'use client';

import { useEffect } from 'react';
import { refreshAccessToken } from '@/lib/api';
import { fetchCurrentUser } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated) return;
    (async () => {
      try {
        await refreshAccessToken();
        await fetchCurrentUser();
      } catch {
        useAuthStore.getState().logout();
      } finally {
        useAuthStore.getState().setHasHydrated(true);
      }
    })();
  }, [hasHydrated]);

  return <>{children}</>;
}

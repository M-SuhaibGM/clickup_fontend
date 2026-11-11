'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuth = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (!hasHydrated) return;
    router.replace(isAuth ? '/dashboard' : '/login');
  }, [hasHydrated, isAuth, router]);

  return null;
}

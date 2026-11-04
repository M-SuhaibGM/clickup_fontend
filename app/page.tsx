'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const isAuth = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    router.replace(isAuth ? '/dashboard' : '/login');
  }, [isAuth, router]);

  return null;
}
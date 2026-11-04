'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { fetchCurrentUser } from '@/lib/auth';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [status, setStatus] = useState('Signing you in...');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('Missing token. Redirecting...');
      router.replace('/login?error=missing_token');
      return;
    }

    setAccessToken(token);

    (async () => {
      const user = await fetchCurrentUser();
      if (user) {
        router.replace('/dashboard');
      } else {
        setStatus('Could not load your account. Redirecting...');
        router.replace('/login?error=user_fetch_failed');
      }
    })();
  }, [params, router, setAccessToken]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600">{status}</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center">Loading...</p>}>
      <CallbackInner />
    </Suspense>
  );
}
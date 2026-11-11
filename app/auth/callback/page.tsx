'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { fetchCurrentUser } from '@/lib/auth';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [status, setStatus] = useState('Signing you in...');

  useEffect(() => {
    const code = params.get('code');
    if (!code) {
      setStatus('Missing auth code. Redirecting...');
      router.replace('/login?error=missing_code');
      return;
    }

    (async () => {
      try {
        // Exchange the one-time code for the actual access token.
        // Using plain axios (not the api instance) to avoid the interceptor loop.
        const authUrl = process.env.NEXT_PUBLIC_AUTH_URL ?? `${process.env.NEXT_PUBLIC_API_URL}/auth`;
        const { data } = await axios.post<{ accessToken: string }>(
          `${authUrl}/exchange-code`,
          { code },
          { withCredentials: true }
        );

        setAccessToken(data.accessToken);

        const user = await fetchCurrentUser();
        if (user) {
          router.replace('/dashboard');
        } else {
          setStatus('Could not load your account. Redirecting...');
          router.replace('/login?error=user_fetch_failed');
        }
      } catch {
        setStatus('Authentication failed. Redirecting...');
        router.replace('/login?error=exchange_failed');
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
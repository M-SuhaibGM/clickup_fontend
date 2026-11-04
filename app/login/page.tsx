'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { startGoogleLogin } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

/* ─────────────────────────────────────────────────────────── */
/* Leaf: reads ?error= from URL — MUST live under <Suspense>  */
/* ─────────────────────────────────────────────────────────── */
function ErrorBanner() {
  const params = useSearchParams();
  const error = params.get('error');
  if (!error) return null;

  const messages: Record<string, string> = {
    google_auth_failed: 'Google sign-in was cancelled or failed.',
    missing_token: 'Sign-in did not return a token. Please try again.',
    user_fetch_failed: 'We could not load your account. Please retry.',
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.2 14.2A1.5 1.5 0 003.4 20.5h17.2a1.5 1.5 0 001.3-2.44l-8.2-14.2a1.5 1.5 0 00-2.6 0z" />
      </svg>
      <span>{messages[error] ?? 'Sign-in failed. Please try again.'}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Leaf: redirects if already authenticated                    */
/* ─────────────────────────────────────────────────────────── */
function AuthRedirectGate() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  return null;
}

/* ─────────────────────────────────────────────────────────── */
/* The visual shell — no URL hooks, fully prerenderable        */
/* ─────────────────────────────────────────────────────────── */
function LoginCard() {
  return (
    <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white/90 p-8 shadow-2xl shadow-indigo-100/50 backdrop-blur">
      {/* Brand */}
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-300/40">
          <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          ClickUp <span className="text-indigo-600">Clone</span>
        </h1>
        <p className="text-sm text-gray-500">
          Sign in to plan, track, and ship your work.
        </p>
      </div>

      {/* Error slot */}
      <Suspense fallback={null}>
        <ErrorBanner />
      </Suspense>

      {/* Google button */}
      <button
        onClick={startGoogleLogin}
        className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md active:translate-y-0 active:shadow-sm"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C40.8 35.5 44 30.2 44 24c0-1.2-.1-2.4-.4-3.5z" />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs uppercase tracking-wider text-gray-400">Secure sign-in</span>
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-gray-400">
        By continuing you agree to our{' '}
        <a href="#" className="text-indigo-500 hover:text-indigo-600 hover:underline">Terms</a>{' '}
        and{' '}
        <a href="#" className="text-indigo-500 hover:text-indigo-600 hover:underline">Privacy Policy</a>.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Page — Prerenderable shell + Suspense-wrapped dynamic bits  */
/* ─────────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 px-4 py-12">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-300/30 blur-3xl" />

      {/* Auth side-effect leaf */}
      <Suspense fallback={null}>
        <AuthRedirectGate />
      </Suspense>

      {/* Visual card */}
      <LoginCard />
    </main>
  );
}
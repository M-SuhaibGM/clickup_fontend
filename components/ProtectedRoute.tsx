'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { fetchCurrentUser } from '@/lib/auth';
import ProjectDetailSkeleton from './ProjectDetailSkeleton';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // No access token → check if refresh cookie exists by asking /users/me
    // (interceptor will auto-refresh and retry if cookie is valid)
    (async () => {
      const me = user ?? (await fetchCurrentUser());
      if (!me) {
        router.replace('/login');
      } else {
        setChecking(false);
      }
    })();
  }, [accessToken, user, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">e
        <ProjectDetailSkeleton/>
      </div>
    );
  }

  return <>{children}</>;
}
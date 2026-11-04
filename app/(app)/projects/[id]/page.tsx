import { Suspense } from 'react';
import ProjectDetailClient from './ProjectDetailClient';
import AppShellSkeleton from '@/components/AppShellSkeleton';

export default function ProjectPage() {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <ProjectDetailClient />
    </Suspense>
  );
}
import { Suspense } from 'react';
import ProjectDetailClient from './ProjectDetailClient';
import AppShellSkeleton from '@/components/AppShellSkeleton';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      {/* key: switching projects from the sidebar must start from a clean slate */}
      <ProjectDetailClient key={id} />
    </Suspense>
  );
}

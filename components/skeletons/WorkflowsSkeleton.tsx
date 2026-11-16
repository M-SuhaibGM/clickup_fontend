import { Skeleton } from '@/components/ui/skeleton';

export default function WorkflowsSkeleton() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#1e1f21] p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Workflow Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-lg p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>

              {/* Status & Stats */}
              <div className="bg-muted dark:bg-[#1e1f21] rounded-lg p-3 space-y-2">
                <Skeleton className="h-3 w-16" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Skeleton className="flex-1 h-9 rounded-lg" />
                <Skeleton className="flex-1 h-9 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

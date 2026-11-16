import { Skeleton } from '@/components/ui/skeleton';

export default function PlannerSkeleton() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#1e1f21] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-lg p-6">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-4 mb-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-12" />
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="bg-muted dark:bg-[#1e1f21] rounded-lg p-3 min-h-24">
                <Skeleton className="h-4 w-6 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-lg p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-3 bg-muted dark:bg-[#1e1f21] rounded-lg">
                <Skeleton className="h-12 w-12 rounded flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

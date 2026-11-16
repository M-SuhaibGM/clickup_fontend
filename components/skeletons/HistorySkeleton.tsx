import { Skeleton } from '@/components/ui/skeleton';

export default function HistorySkeleton() {
  return (
    <div className="min-h-screen bg-background dark:bg-[color:var(--c-1e1f21)] p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Filter Options */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-card dark:bg-[color:var(--c-232426)] border border-border dark:border-[color:var(--c-333438)] rounded-lg p-4 flex gap-4"
            >
              {/* Avatar */}
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

              <div className="flex-1 space-y-2">
                {/* Action Description */}
                <div className="space-y-1">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-96" />
                </div>

                {/* Change Details */}
                <div className="pt-3 border-t border-border dark:border-[color:var(--c-333438)] space-y-2">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center pt-4">
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

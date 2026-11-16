import { Skeleton } from '@/components/ui/skeleton';

export default function TeamsSkeleton() {
  return (
    <div className="min-h-screen bg-background dark:bg-[color:var(--c-1e1f21)] p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card dark:bg-[color:var(--c-232426)] border border-border dark:border-[color:var(--c-333438)] rounded-lg p-6 space-y-4"
            >
              {/* Team Icon */}
              <Skeleton className="h-12 w-12 rounded-lg" />

              {/* Team Name */}
              <Skeleton className="h-6 w-32" />

              {/* Team Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>

              {/* Members */}
              <div className="pt-4 border-t border-border dark:border-[color:var(--c-333438)]">
                <Skeleton className="h-4 w-20 mb-3" />
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-8 rounded-full" />
                  ))}
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

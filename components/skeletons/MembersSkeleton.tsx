import { Skeleton } from '@/components/ui/skeleton';

export default function MembersSkeleton() {
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

        {/* Search & Filter */}
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-10 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>

        {/* Members Table */}
        <div className="bg-card dark:bg-[color:var(--c-232426)] border border-border dark:border-[color:var(--c-333438)] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-muted dark:bg-[color:var(--c-1e1f21)] border-b border-border dark:border-[color:var(--c-333438)] px-6 py-3 flex items-center gap-4">
            <Skeleton className="h-4 w-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20 flex-1" />
            ))}
          </div>

          {/* Table Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border-b border-border dark:border-[color:var(--c-333438)] px-6 py-4 flex items-center gap-4"
            >
              <Skeleton className="h-4 w-4" />
              <div className="flex-1 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

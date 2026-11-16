import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#1e1f21] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg flex-shrink-0" />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 overflow-x-auto pb-2 border-b border-border dark:border-[#333438]">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded flex-shrink-0" />
          ))}
        </div>

        {/* View Options */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded" />
            ))}
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Content Area - Kanban Board Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((col, colIdx) => (
            <div
              key={colIdx}
              className="bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-lg p-4 space-y-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-8" />
              </div>

              {/* Cards */}
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="bg-muted dark:bg-[#1e1f21] border border-border dark:border-[#333438] rounded-lg p-3 space-y-3"
                >
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              ))}

              {/* Add Card */}
              <Skeleton className="h-9 w-full rounded-lg mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

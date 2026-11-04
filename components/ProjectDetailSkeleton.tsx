import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectDetailSkeleton() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* List tabs */}
      <div className="flex items-center gap-6 mb-6 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-4" />
        </div>
      </div>

      {/* Task area */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Table header */}
        <div className="border-b border-gray-200 bg-gray-50/50 flex px-4 py-2.5 gap-4">
          <Skeleton className="h-3 w-12 flex-1" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-8" />
        </div>

        {/* Task rows */}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center px-4 py-3.5 gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <div className="flex items-center gap-2 w-24">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>

        {/* Add task row */}
        <div className="border-t border-gray-100 px-4 py-3">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
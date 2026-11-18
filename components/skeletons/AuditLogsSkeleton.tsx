import { Skeleton } from '@/components/ui/skeleton';

export default function AuditLogsSkeleton() {
  return (
    <div className="px-4 sm:px-8 py-8 max-w-[1100px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Filter */}
      <Skeleton className="h-10 w-full max-w-xl" />

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Skeleton className="h-10 w-full rounded-none" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-t border-border">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="space-y-1.5 w-40">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-24 hidden sm:block" />
            <Skeleton className="h-3.5 w-16 hidden sm:block" />
            <Skeleton className="h-3.5 w-16 hidden md:block" />
            <div className="ml-auto space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

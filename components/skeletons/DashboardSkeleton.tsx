import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#1e1f21] text-foreground dark:text-white p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-card dark:bg-[#2a2b2e] border border-border dark:border-[#333438] p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-96 rounded-lg" />
              <Skeleton className="h-6 w-full max-w-md rounded-lg" />
              <div className="flex gap-3 pt-4">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
              </div>
            </div>
            <div className="hidden lg:block w-96 h-56 bg-muted dark:bg-[#232426] rounded-xl" />
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="pt-3 border-t border-border dark:border-[#333438] flex items-center justify-between">
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Tasks Card */}
          <div className="bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          </div>

          {/* Workspace Stats Card */}
          <div className="bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-xl p-5">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted dark:bg-[#1e1f21] border border-border dark:border-[#333438] p-3 rounded-lg"
                >
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

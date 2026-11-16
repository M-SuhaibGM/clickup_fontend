import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#1e1f21] p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <div className="bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-lg p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded" />
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            {/* Profile Section */}
            <div className="bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </div>

            {/* Settings Form */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-lg p-6 space-y-4"
              >
                <Skeleton className="h-6 w-40" />
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-9 w-full rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-9 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export default function AiSkeleton() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#1e1f21] p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>

        {/* Chat Container */}
        <div className="bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-lg h-96 flex flex-col p-4 space-y-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Assistant Message */}
            <div className="flex justify-start">
              <div className="max-w-xs bg-muted dark:bg-[#1e1f21] rounded-lg p-3 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>

            {/* User Message */}
            <div className="flex justify-end">
              <div className="max-w-xs bg-primary rounded-lg p-3 space-y-2">
                <Skeleton className="h-4 w-40" />
              </div>
            </div>

            {/* Assistant Message with Code */}
            <div className="flex justify-start">
              <div className="max-w-xs space-y-2">
                <div className="bg-muted dark:bg-[#1e1f21] rounded-lg p-3">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="flex gap-2 pt-4 border-t border-border dark:border-[#333438]">
            <Skeleton className="flex-1 h-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card dark:bg-[#232426] border border-border dark:border-[#333438] rounded-lg p-4 space-y-2"
            >
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

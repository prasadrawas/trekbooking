import { Skeleton } from "@/components/ui/skeleton";

// Single skeleton card matching TrekCard layout
function TrekCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col">
      {/* Image area */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + organizer */}
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>

        {/* Region */}
        <Skeleton className="h-3 w-1/3" />

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Rating */}
        <Skeleton className="h-3 w-28" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + seats */}
        <div className="flex items-end justify-between border-t border-gray-100 pt-3">
          <div className="space-y-1">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-1 flex flex-col items-end">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TreksLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero band skeleton */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 pt-12 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center mb-8 space-y-4">
          <Skeleton className="h-6 w-56 mx-auto rounded-full bg-emerald-600/40" />
          <Skeleton className="h-12 w-64 mx-auto bg-emerald-600/40" />
          <Skeleton className="h-5 w-80 mx-auto bg-emerald-600/30" />
        </div>
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-14 w-full rounded-2xl bg-emerald-600/40" />
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 py-10 -mt-6">
        <div className="flex gap-8">
          {/* Sidebar skeleton (desktop only) */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5 sticky top-24">
              <Skeleton className="h-5 w-24" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Trek grid */}
          <div className="flex-1 min-w-0">
            {/* Toolbar row */}
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-24 rounded-xl lg:hidden" />
            </div>

            {/* 6 skeleton cards in responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <TrekCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/Skeleton";

export function KanbanSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search & Filter Header Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <Skeleton className="h-10 w-full sm:w-72 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Kanban Board 4 Columns Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((colIndex) => (
          <div key={colIndex} className="bg-bg-card/50 border border-border/60 rounded-xl p-3.5 space-y-3">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>

            {/* Card Items */}
            <div className="space-y-3 pt-1">
              {[1, 2].map((cardIndex) => (
                <div key={cardIndex} className="p-4 rounded-lg bg-bg-elevated/40 border border-border/50 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-24 rounded" />
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-3 w-14 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlacementsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Quiet KPIs Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-6 border-b border-border/40 pb-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <Skeleton className="h-4 w-20 rounded" />
      </div>

      {/* Table Shell Skeleton */}
      <div className="bg-bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="divide-y divide-border/40">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-bg-card border border-border/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Main Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-card border border-border/60 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-44 rounded" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="bg-bg-card border border-border/60 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-64 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function RoutineSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {/* Routine Cards Column */}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-bg-card border border-border/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />

          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3.5 rounded-lg bg-bg-elevated/30 border border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Routine Sidebar Skeleton */}
      <div className="space-y-5">
        <div className="bg-bg-card border border-border/60 rounded-xl p-5 space-y-4">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkillsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-bg-card border border-border/60 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-bg-elevated/30 border border-border/40 space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
              <div className="flex flex-wrap gap-1.5 pt-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3 bg-bg-card p-1 rounded-lg border border-border">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-card border border-border rounded-xl p-4.5 space-y-4">
          <div className="grid grid-cols-7 gap-1.5 mb-1">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {[...Array(42)].map((_, i) => (
              <div key={i} className="min-h-[75px] p-1.5 rounded-lg border bg-bg-main/30">
                <Skeleton className="h-4 w-6 rounded mb-1" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agenda Skeleton */}
        <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-bg-main border border-border/80">
                <div className="flex items-start justify-between gap-2.5">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend Skeleton */}
      <div className="flex flex-wrap gap-x-6 gap-y-2.5 p-4.5 bg-bg-card/50 border border-border border-dashed rounded-xl">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

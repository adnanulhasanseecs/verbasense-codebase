/** Lightweight placeholder while the analytics dashboard chunk (Recharts) loads. */
export function DashboardPageSkeleton() {
  return (
    <div className="w-full space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-28 w-full animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06]" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06]"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-[340px] animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] lg:col-span-8" />
        <div className="h-[340px] animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] lg:col-span-4" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-[360px] animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] lg:col-span-8" />
        <div className="h-[360px] animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] lg:col-span-4" />
      </div>
    </div>
  );
}

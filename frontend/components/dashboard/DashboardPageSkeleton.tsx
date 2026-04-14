/** Lightweight placeholder while the analytics dashboard chunk (Recharts) loads. */
export function DashboardPageSkeleton() {
  return (
    <div className="flex-1 min-w-0" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-12 gap-6 p-6">
        <div className="col-span-12 h-28 w-full animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="col-span-12 h-32 animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] md:col-span-6 lg:col-span-3"
          />
        ))}
        <div className="col-span-12 h-[340px] animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] lg:col-span-8" />
        <div className="col-span-12 h-[340px] animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] lg:col-span-4" />
        <div className="col-span-12 h-[360px] animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] lg:col-span-8" />
        <div className="col-span-12 h-[360px] animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] lg:col-span-4" />
        <div className="col-span-12 h-[340px] animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] lg:col-span-6" />
        <div className="col-span-12 h-[340px] animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] lg:col-span-6" />
      </div>
    </div>
  );
}

export function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="vs-card-glow group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121826]/92 p-4 transition hover:border-amber-300/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
      <p className="text-[11px] uppercase tracking-[0.15em] text-[#9CA3AF]">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[#F9FAFB]">{value}</p>
      <p className="mt-1 text-xs text-[#6B7280]">Updated just now</p>
    </article>
  );
}


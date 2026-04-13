export function ActivityFeed({ items }: { items: string[] }) {
  return (
    <section className="vs-card-glow rounded-2xl border border-white/[0.08] bg-[#121826]/92 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Activity Feed</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, idx) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2.5 text-sm text-[#E5E7EB]"
          >
            <span
              className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${
                idx === 0 ? "bg-emerald-400" : idx === 1 ? "bg-cyan-400" : idx === 2 ? "bg-blue-400" : "bg-amber-400"
              }`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}


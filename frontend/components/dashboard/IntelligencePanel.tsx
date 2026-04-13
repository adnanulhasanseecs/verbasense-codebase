import { INTELLIGENCE } from "@/lib/dashboard-mock";

export function IntelligencePanel({ limited }: { limited: boolean }) {
  return (
    <section className="vs-card-glow rounded-2xl border border-white/[0.08] bg-[#121826]/92 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Intelligence Snapshot</h3>
      <article className="mt-3 rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 p-3">
        <p className="text-xs uppercase tracking-wide text-[#9CA3AF]">Summary</p>
        <p className="mt-1 text-sm leading-relaxed text-[#E5E7EB]">{INTELLIGENCE.summary}</p>
      </article>
      <article className="mt-3 rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 p-3">
        <p className="text-xs uppercase tracking-wide text-[#9CA3AF]">Key Decisions</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#E5E7EB]">
          {INTELLIGENCE.decisions.slice(0, limited ? 1 : INTELLIGENCE.decisions.length).map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </article>
      {!limited ? (
        <article className="mt-3 rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 p-3">
          <p className="text-xs uppercase tracking-wide text-[#9CA3AF]">Pending Actions</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#E5E7EB]">
            {INTELLIGENCE.pending.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}


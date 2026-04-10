import type { TranscriptLine } from "@/lib/mock-data";

export function LiveIntelligencePanel({ lines }: { lines: TranscriptLine[] }) {
  const recent = lines.slice(-3);
  const decisions = lines.filter((l) => /granted|accepted|ordered|admitted/i.test(l.text)).slice(-3);
  const actions = lines
    .filter((l) => /submit|file|serve|update|issue/i.test(l.text))
    .map((l) => `${l.speaker}: ${l.text}`)
    .slice(-4);

  return (
    <section className="space-y-4">
      <Card title="Running Summary">
        {lines.length > 0
          ? `Session in progress with ${lines.length} captured statements. Latest focus: ${recent
              .map((r) => r.text)
              .join(" ")}`
          : "Waiting for transcript stream..."}
      </Card>

      <Card title="Key Decisions">
        <ul className="list-disc space-y-1 pl-5">
          {(decisions.length ? decisions : recent).map((d) => (
            <li key={d.id}>{d.text}</li>
          ))}
        </ul>
      </Card>

      <Card title="Action Items">
        <ul className="space-y-2">
          {(actions.length ? actions : ["No concrete actions detected yet."]).map((a) => (
            <li key={a} className="rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2 text-sm">
              {a}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-white/[0.08] bg-[#121826]/85 p-5 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.42)]">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-[#E5E7EB]">{children}</div>
    </article>
  );
}


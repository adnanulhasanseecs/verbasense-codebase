import type { TranscriptLine } from "@/lib/mock-data";

export function SpeakerTranscript({
  lines,
  condensed = false,
  idPrefix = "transcript-line",
}: {
  lines: TranscriptLine[];
  condensed?: boolean;
  idPrefix?: string;
}) {
  return (
    <div className={condensed ? "space-y-2" : "space-y-3"}>
      {lines.map((line) => (
        <article
          key={line.id}
          id={`${idPrefix}-${line.id}`}
          className={
            condensed
              ? "vs-card-glow rounded-xl border border-white/[0.08] bg-[#0B0F19]/60 px-3 py-2"
              : "vs-card-glow rounded-2xl border border-white/[0.08] bg-[#0B0F19]/70 p-4"
          }
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#22D3EE]">{line.speaker}</span>
            <span className="font-mono text-[11px] text-[#9CA3AF]">{line.timestamp}</span>
          </div>
          <p className={condensed ? "mt-1 text-sm text-[#E5E7EB]" : "mt-2 text-sm leading-relaxed text-[#E5E7EB]"}>
            {line.text}
          </p>
        </article>
      ))}
    </div>
  );
}

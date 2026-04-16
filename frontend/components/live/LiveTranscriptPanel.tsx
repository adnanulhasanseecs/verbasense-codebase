"use client";

import { useEffect, useRef } from "react";
import type { TranscriptLine } from "@/features/sessions/types/sessions.types";

export function LiveTranscriptPanel({
  lines,
  listening,
}: {
  lines: TranscriptLine[];
  listening: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [lines]);

  return (
    <section className="vs-card-glow rounded-3xl border border-white/[0.08] bg-[#121826]/85 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">Live Transcript</h2>
        <span className="inline-flex items-center gap-2 text-xs text-[#9CA3AF]">
          <span className={`h-2.5 w-2.5 rounded-full ${listening ? "bg-emerald-400" : "bg-zinc-500"}`} />
          {listening ? "listening" : "paused"}
        </span>
      </div>
      <div
        ref={scrollRef}
        className="h-[360px] overflow-y-auto rounded-xl border border-white/10 bg-[#0B0F19]/60 p-3 pr-2"
      >
        <div className="space-y-2 text-sm text-[#E5E7EB]">
          {lines.length === 0 ? (
            <p className="text-[#9CA3AF]">No transcript lines yet.</p>
          ) : (
            lines.map((line, index) => (
              <p key={`${line.id}-${line.timestamp}-${index}`} className="leading-relaxed">
                <span className="font-semibold text-[#22D3EE]">{line.speaker}:</span>{" "}
                <span>{line.text}</span>
              </p>
            ))
          )}
        </div>
      </div>
    </section>
  );
}


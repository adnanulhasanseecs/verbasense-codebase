"use client";

import { useEffect, useRef } from "react";
import type { TranscriptLine } from "@/lib/mock-data";
import { SpeakerTranscript } from "@/components/sessions/SpeakerTranscript";

export function LiveTranscriptPanel({
  lines,
  listening,
}: {
  lines: TranscriptLine[];
  listening: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === "function") {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [lines]);

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-[#121826]/85 p-6 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.42)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">Live Transcript</h2>
        <span className="inline-flex items-center gap-2 text-xs text-[#9CA3AF]">
          <span className={`h-2.5 w-2.5 rounded-full ${listening ? "bg-emerald-400" : "bg-zinc-500"}`} />
          {listening ? "listening" : "paused"}
        </span>
      </div>
      <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
        <SpeakerTranscript lines={lines} />
        <div ref={bottomRef} />
      </div>
    </section>
  );
}


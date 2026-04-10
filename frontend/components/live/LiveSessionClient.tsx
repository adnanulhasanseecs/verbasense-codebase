"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveIntelligencePanel } from "@/components/live/LiveIntelligencePanel";
import { LiveTranscriptPanel } from "@/components/live/LiveTranscriptPanel";
import { LIVE_SCRIPT, MOCK_SESSION, nowTime, type TranscriptLine } from "@/lib/mock-data";

const POLL_MS = 1400;

export function LiveSessionClient() {
  const [running, setRunning] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [lines, setLines] = useState<TranscriptLine[]>([]);

  useEffect(() => {
    if (!running) return;
    if (cursor >= LIVE_SCRIPT.length) return;

    const t = window.setTimeout(() => {
      const next = LIVE_SCRIPT[cursor];
      setLines((prev) => [
        ...prev,
        { id: `${cursor + 1}`, speaker: next.speaker, text: next.text, timestamp: nowTime() },
      ]);
      setCursor((n) => n + 1);
    }, POLL_MS);

    return () => window.clearTimeout(t);
  }, [cursor, running]);

  const sessionId = "LIVE-SES-2026-0091";
  const presentedDocs = useMemo(() => MOCK_SESSION.documents, []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/[0.08] bg-[#121826]/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-[#22D3EE]">Live Session</p>
            <h1 className="text-2xl font-bold text-[#F9FAFB]">Courtroom audio stream</h1>
            <p className="font-mono text-xs text-[#9CA3AF]">Session ID: {sessionId}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-100">
              <span className={`h-2.5 w-2.5 rounded-full ${running ? "bg-rose-400 animate-pulse" : "bg-zinc-500"}`} />
              {running ? "LIVE" : "STOPPED"}
            </span>
            <button
              type="button"
              onClick={() => setRunning((v) => !v)}
              className="rounded-2xl border border-white/[0.12] bg-[#0B0F19] px-4 py-2 text-sm font-semibold text-[#E5E7EB] hover:bg-white/[0.05]"
            >
              {running ? "Stop session" : "Resume session"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <LiveTranscriptPanel lines={lines} listening={running} />
        <LiveIntelligencePanel lines={lines} />
      </div>

      <section className="rounded-3xl border border-white/[0.08] bg-[#121826]/80 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">
          Documents presented during session
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {presentedDocs.map((doc) => (
            <article key={doc.id} className="rounded-2xl border border-white/[0.08] bg-[#0B0F19]/70 p-4">
              <p className="font-semibold text-[#E5E7EB]">{doc.name}</p>
              <p className="mt-1 text-sm text-[#9CA3AF]">{doc.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

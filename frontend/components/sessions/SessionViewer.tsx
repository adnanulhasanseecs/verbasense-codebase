"use client";

import { useMemo, useState } from "react";
import { SessionTabs, type SessionTab } from "@/components/sessions/SessionTabs";
import { SpeakerTranscript } from "@/components/sessions/SpeakerTranscript";
import type { Session } from "@/features/sessions/types/sessions.types";
import { exportTranscriptDocx, exportTranscriptPdf } from "@/lib/transcript-export";

export function SessionViewer({ session }: { session: Session }) {
  const [tab, setTab] = useState<SessionTab>("transcript");
  const [condensed, setCondensed] = useState(true);

  const lines = useMemo(() => session.transcript, [session.transcript]);
  const intelligenceForExport = useMemo(
    () => ({
      summary: session.intelligence.summary,
      key_decisions: session.intelligence.decisions.map((decision) => decision.text),
      actions: session.intelligence.actions.map((action) => ({ text: action.text })),
    }),
    [session.intelligence],
  );

  return (
    <div className="vs-card-glow space-y-5 rounded-3xl border border-white/[0.08] bg-[#121826]/80 p-6">
      <header className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">{session.name}</h1>
          <p className="text-sm text-[#9CA3AF]">Transcript + intelligence + documents</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportTranscriptDocx(lines, session.id, intelligenceForExport)}
            className="rounded-xl border border-white/[0.12] bg-[#0B0F19] px-3 py-2 text-xs font-semibold text-[#E5E7EB] hover:bg-white/[0.05]"
          >
            Download transcript + intelligence (.docx)
          </button>
          <button
            type="button"
            onClick={() => exportTranscriptPdf(lines, session.id, intelligenceForExport)}
            className="rounded-xl border border-white/[0.12] bg-[#0B0F19] px-3 py-2 text-xs font-semibold text-[#E5E7EB] hover:bg-white/[0.05]"
          >
            Download transcript + intelligence (.pdf)
          </button>
        </div>
      </header>

      <SessionTabs active={tab} onChange={setTab} />

      {tab === "transcript" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0B0F19]/60 px-3 py-2">
            <p className="text-xs text-[#9CA3AF]">Condensed view helps with long sessions.</p>
            <button
              type="button"
              onClick={() => setCondensed((v) => !v)}
              className="rounded-lg border border-white/[0.12] px-2.5 py-1 text-xs text-[#E5E7EB]"
            >
              {condensed ? "Expanded view" : "Condensed view"}
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <SpeakerTranscript lines={lines} condensed={condensed} idPrefix="session-line" />
            </div>
            <aside className="lg:sticky lg:top-4 lg:max-h-[60vh] lg:overflow-y-auto">
              <div className="vs-card-glow rounded-2xl border border-white/[0.08] bg-[#0B0F19]/70 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Transcript Navigator
                </h3>
                <p className="mt-1 text-[11px] text-[#6B7280]">Jump by timestamp and speaker</p>
                <div className="mt-3 space-y-2">
                  {lines.map((line, index) => (
                    <button
                      key={`${line.id}-${line.timestamp}-${index}`}
                      type="button"
                      onClick={() => {
                        document
                          .getElementById(`session-line-${line.id}-${index}`)
                          ?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#121826] px-2.5 py-2 text-left text-xs text-[#E5E7EB] hover:border-[#3B82F6]/50 hover:bg-[#1A2438]"
                    >
                      <span className="mr-2 font-mono text-[10px] text-[#9CA3AF]">{line.timestamp}</span>
                      <span className="font-semibold text-[#22D3EE]">{line.speaker}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      {tab === "intelligence" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Summary">{session.intelligence.summary}</Card>
          <Card title="Decisions">
            <ul className="list-disc space-y-1 pl-5">
              {session.intelligence.decisions.map((d) => (
                <li key={d.id}>{d.text}</li>
              ))}
            </ul>
          </Card>
          <Card title="Actions">
            <ul className="list-disc space-y-1 pl-5">
              {session.intelligence.actions.map((a) => (
                <li key={a.id}>{a.text}</li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}

      {tab === "documents" ? (
        <div className="space-y-3">
          {session.documents.map((d) => (
            <article key={d.id} className="vs-card-glow rounded-2xl border border-white/[0.08] bg-[#0B0F19]/70 p-4">
              <p className="font-semibold text-[#E5E7EB]">{d.name}</p>
              <p className="mt-1 text-sm text-[#9CA3AF]">{d.summary}</p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="vs-card-glow rounded-2xl border border-white/[0.08] bg-[#0B0F19]/70 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">{title}</h3>
      <div className="mt-2 text-sm text-[#E5E7EB]">{children}</div>
    </article>
  );
}

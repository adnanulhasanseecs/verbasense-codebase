"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OutputSchema } from "@/lib/api";
import { getJob, getResult } from "@/lib/api";

export function ExportClient({ jobId }: { jobId: string }) {
  const [out, setOut] = useState<OutputSchema | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await getJob(jobId);
        if (j.status !== "completed") {
          if (!cancelled) setErr("Job is not completed yet.");
          return;
        }
        const r = await getResult(jobId);
        if (!cancelled) setOut(r.output);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const download = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const transcriptText =
    out?.transcript.map((t) => `${t.speaker}: ${t.text}`).join("\n\n") ?? "";

  const report = out
    ? JSON.stringify(
        {
          summary: out.summary,
          key_decisions: out.key_decisions,
          actions: out.actions,
          entities: out.entities,
          schema_version: out.schema_version,
        },
        null,
        2,
      )
    : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export</h1>
        <p className="mt-1 font-mono text-xs text-[#9CA3AF]">{jobId}</p>
      </div>

      {err ? (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {err}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-1">
        <button
          type="button"
          disabled={!out}
          onClick={() => download(`transcript-${jobId}.txt`, transcriptText, "text/plain")}
          className="rounded-2xl border border-white/[0.08] bg-[#121826] px-5 py-4 text-left text-sm font-semibold text-[#E5E7EB] transition hover:bg-white/[0.04] disabled:opacity-40"
        >
          Download transcript (.txt)
        </button>
        <button
          type="button"
          disabled={!out}
          onClick={() => download(`summary-${jobId}.txt`, out?.summary ?? "", "text/plain")}
          className="rounded-2xl border border-white/[0.08] bg-[#121826] px-5 py-4 text-left text-sm font-semibold text-[#E5E7EB] transition hover:bg-white/[0.04] disabled:opacity-40"
        >
          Download summary (.txt)
        </button>
        <button
          type="button"
          disabled={!out}
          onClick={() => download(`report-${jobId}.json`, report, "application/json")}
          className="rounded-2xl border border-white/[0.08] bg-[#121826] px-5 py-4 text-left text-sm font-semibold text-[#E5E7EB] transition hover:bg-white/[0.04] disabled:opacity-40"
        >
          Download structured report (.json)
        </button>
      </div>

      <Link href={`/jobs/${jobId}`} className="inline-block text-sm text-[#22D3EE] hover:underline">
        ← Back to proceeding
      </Link>
    </div>
  );
}

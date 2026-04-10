"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { DomainConfig, Job, OutputSchema } from "@/lib/api";
import { getDomainConfig, getJob, getResult } from "@/lib/api";

const POLL_MS = 2500;

export function JobWorkspace({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [cfg, setCfg] = useState<DomainConfig | null>(null);
  const [output, setOutput] = useState<OutputSchema | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const c = await getDomainConfig("courtsense");
        if (!cancelled) setCfg(c);
      } catch {
        // Optional for demo mode
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const j = await getJob(jobId);
        if (cancelled) return;

        setJob(j);

        if (j.status === "failed") {
          setErr(j.error?.message ?? "Job failed");
          clearInterval(timer);
          return;
        }

        if (j.status === "completed") {
          clearInterval(timer);
          try {
            const r = await getResult(jobId);
            if (!cancelled) setOutput(r.output);
          } catch (e) {
            if (!cancelled) {
              setErr(e instanceof Error ? e.message : "Could not load result");
            }
          }
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Poll failed");
      }
    };

    const timer = setInterval(() => {
      void tick();
    }, POLL_MS);

    void tick();

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [jobId]);

  const stages = useMemo(
    () => cfg?.pipeline.stages ?? ["queued", "processing", "completed"],
    [cfg],
  );

  const labels = cfg?.ui.labels;

  const stageIndex = useMemo(() => {
    if (!job) return -1;
    if (job.status === "completed") return stages.length;
    const idx = stages.findIndex((s) => s === job.stage);
    return idx >= 0 ? idx : 0;
  }, [job, stages]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proceeding</h1>
            <p className="mt-1 font-mono text-xs text-[#9CA3AF]">{jobId}</p>
          </div>
          {job ? <StatusBadge status={job.status} /> : null}
        </div>

        <section className="rounded-2xl border border-white/[0.08] bg-[#121826] p-6 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.42)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">Pipeline</h2>
          <ol className="mt-4 space-y-3">
            {stages.map((stage, idx) => {
              const done =
                job?.status === "completed" ||
                (stageIndex > idx && job?.status === "processing");
              const active =
                job?.status === "processing" && (job.stage === stage || idx === stageIndex);

              return (
                <li key={stage} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? "bg-emerald-500/20 text-emerald-200"
                        : active
                          ? "animate-pulse bg-sky-500/20 text-sky-200"
                          : "bg-white/[0.06] text-[#9CA3AF]"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className={done || active ? "text-[#E5E7EB]" : "text-[#9CA3AF]"}>
                    {stage}
                  </span>
                </li>
              );
            })}
          </ol>

          {job ? (
            <div className="mt-6">
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] transition-all"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#9CA3AF]">
                Stage: <span className="text-[#E5E7EB]">{job.stage || "-"}</span> - Progress: {job.progress}%
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-[#121826] p-6 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.42)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">Transcript</h2>
          {output ? (
            <div className="mt-4 space-y-4">
              {output.transcript.map((line, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#0B0F19] p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#22D3EE]">
                      {line.speaker}
                    </span>
                    {line.start_ms != null ? (
                      <span className="font-mono text-[10px] text-[#9CA3AF]">
                        {formatMs(line.start_ms)} - {formatMs(line.end_ms ?? line.start_ms)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#E5E7EB]">{line.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#9CA3AF]">
              {job?.status === "processing" || job?.status === "queued"
                ? "Transcript will appear when processing completes."
                : job?.status === "failed"
                  ? "No transcript - job failed."
                  : "Loading..."}
            </p>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#121826] p-6 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.42)]">
          <h2 className="text-sm font-semibold text-[#9CA3AF]">{labels?.summary ?? "Summary"}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#E5E7EB]">{output?.summary ?? "-"}</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#121826] p-6 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.42)]">
          <h2 className="text-sm font-semibold text-[#9CA3AF]">{labels?.decisions ?? "Key decisions"}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#E5E7EB]">
            {(output?.key_decisions ?? []).map((d) => (
              <li key={d}>{d}</li>
            ))}
            {!output?.key_decisions?.length ? <li className="text-[#9CA3AF]">-</li> : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#121826] p-6 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.42)]">
          <h2 className="text-sm font-semibold text-[#9CA3AF]">{labels?.actions ?? "Action items"}</h2>
          <ul className="mt-3 space-y-3">
            {(output?.actions ?? []).map((a, i) => (
              <li key={i} className="rounded-2xl border border-white/[0.06] bg-[#0B0F19] p-3 text-sm">
                <p className="text-[#E5E7EB]">{a.text}</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {a.owner ?? "Unassigned"} - {a.priority ?? "-"}
                </p>
              </li>
            ))}
            {!output?.actions?.length ? <li className="text-sm text-[#9CA3AF]">-</li> : null}
          </ul>
        </div>

        {err ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {err}
          </div>
        ) : null}

        <Link
          href={`/export/${jobId}`}
          className="flex w-full items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0B0F19] px-4 py-3 text-sm font-semibold text-[#E5E7EB] transition hover:bg-white/[0.04]"
        >
          Export
        </Link>
      </aside>
    </div>
  );
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}:${rs.toString().padStart(2, "0")}`;
}


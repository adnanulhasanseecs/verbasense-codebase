"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { getJob } from "@/lib/api/jobs";
import type { JobStatus } from "@/lib/api/types";
import { loadJobIds } from "@/lib/jobs-store";

export function DashboardClient() {
  const [ids] = useState<string[]>(() => loadJobIds());

  if (ids.length === 0) {
    return (
      <div className="vs-card-glow relative overflow-hidden rounded-3xl border border-dashed border-white/[0.12] bg-[#121826]/50 p-12 text-center shadow-inner shadow-black/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_65%)]" />
        <div className="relative space-y-3">
          <p className="text-base font-medium text-[#E5E7EB]">No proceedings yet</p>
          <p className="mx-auto max-w-md text-sm text-[#9CA3AF]">
            Upload a hearing audio file to simulate transcription, diarization, and summary stages.
          </p>
          <Link
            href="/transcribe"
            className="inline-flex items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-[#E5E7EB] transition hover:bg-white/[0.08]"
          >
            Go to upload
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vs-card-glow overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121826]/90 ring-1 ring-white/[0.04]">
      <div className="grid grid-cols-[1fr_140px_100px] gap-4 border-b border-white/[0.08] bg-[#0B0F19]/40 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] sm:grid-cols-[1fr_160px_120px]">
        <span>Job</span>
        <span>Status</span>
        <span className="text-right">Open</span>
      </div>
      <ul className="divide-y divide-white/[0.05]">
        {ids.map((id) => (
          <JobRow key={id} id={id} />
        ))}
      </ul>
    </div>
  );
}

function JobRow({ id }: { id: string }) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const j = await getJob(id);
        if (!cancelled) setStatus(j.status);
      } catch {
        if (!cancelled) setStatus("unknown");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <li className="grid grid-cols-[1fr_140px_100px] items-center gap-4 px-5 py-4 text-sm sm:grid-cols-[1fr_160px_120px]">
      <span className="truncate font-mono text-xs text-[#9CA3AF]">{id}</span>
      <span>
        {status ? (
          <StatusBadge status={status as JobStatus} />
        ) : (
          <span className="text-xs text-[#9CA3AF]">...</span>
        )}
      </span>
      <span className="text-right">
        <Link
          className="rounded-lg px-2 py-1 text-sm font-medium text-[#22D3EE] transition hover:bg-[#22D3EE]/10 hover:underline"
          href={`/jobs/${id}`}
        >
          View
        </Link>
      </span>
    </li>
  );
}


"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { uploadAudio } from "@/lib/api/jobs";
import { rememberJobId } from "@/lib/jobs-store";

export function UploadPanel() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caseId, setCaseId] = useState("");
  const [courtroom, setCourtroom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const submit = async () => {
    if (!file) {
      setError("Choose an audio file.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const job = await uploadAudio(file, {
        domain: "courtsense",
        caseId: caseId || undefined,
        courtroom: courtroom || undefined,
      });
      rememberJobId(job.id);
      router.push(`/jobs/${job.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.getElementById("vs-file")?.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="vs-card-glow-inset flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.14] bg-gradient-to-b from-[#121826] to-[#0B0F19] p-10 text-center transition hover:border-[#3B82F6]/55"
        onClick={() => document.getElementById("vs-file")?.click()}
      >
        <p className="text-sm font-semibold text-[#F9FAFB]">Drag & drop audio here</p>
        <p className="mt-1 text-xs text-[#9CA3AF]">.wav or .mp3 · max size enforced server-side</p>
        <input
          id="vs-file"
          type="file"
          accept=".wav,.mp3,audio/wav,audio/mpeg"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <p className="mt-4 font-mono text-xs text-[#22D3EE]">{file.name}</p>
        ) : null}
      </div>

      <div className="vs-card-glow rounded-2xl border border-white/[0.08] bg-[#121826]/60 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Case ID</span>
            <input
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/[0.08] bg-[#0B0F19] px-4 py-3 text-sm text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-[#3B82F6]/60"
              placeholder="e.g. CV-2026-0142"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Courtroom</span>
            <input
              value={courtroom}
              onChange={(e) => setCourtroom(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/[0.08] bg-[#0B0F19] px-4 py-3 text-sm text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-[#3B82F6]/60"
              placeholder="e.g. 4B"
            />
          </label>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#6366F1] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Uploading…" : "Start processing"}
      </button>
    </div>
  );
}

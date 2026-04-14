"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function DocumentUploadPanel({
  file,
  loading,
  onUpload,
  onProcess,
}: {
  file: File | null;
  loading: boolean;
  onUpload: (file: File) => void;
  onProcess: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [page, setPage] = useState(1);

  const fileUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  return (
    <section className="vs-card-glow rounded-3xl border border-white/[0.08] bg-[#121826]/85 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">Document Viewer / Upload</h2>
      <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#0B0F19]/80 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#F9FAFB]">
              {file ? `Loaded: ${file.name}` : "No document loaded"}
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Upload does not auto-process. Use Process with AI after selecting PDF.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-[#E5E7EB]"
              onClick={() => inputRef.current?.click()}
            >
              Upload PDF
            </button>
            <button
              type="button"
              disabled={!file || loading}
              onClick={onProcess}
              className="rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Processing with AI..." : "Process with AI"}
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPage(1);
              onUpload(file);
            }
          }}
        />
      </div>
      {file && fileUrl ? (
        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#0B0F19]/80 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-[#9CA3AF]">Document preview</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev page
              </button>
              <span className="text-xs text-[#9CA3AF]">Page {page}</span>
              <button
                type="button"
                className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white"
                onClick={() => setPage((p) => p + 1)}
              >
                Next page
              </button>
            </div>
          </div>
          <iframe
            title="Document viewer"
            src={`${fileUrl}#page=${page}&view=FitH`}
            className="mt-3 h-[560px] w-full rounded-xl border border-white/10 bg-white"
          />
        </div>
      ) : null}
      {loading ? <p className="mt-2 text-xs text-[#22D3EE]">Processing document via AI...</p> : null}
    </section>
  );
}


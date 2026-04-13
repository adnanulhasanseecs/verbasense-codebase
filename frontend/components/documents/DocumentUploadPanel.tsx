"use client";

import { useRef } from "react";

export function DocumentUploadPanel({
  loading,
  onUpload,
}: {
  loading: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="vs-card-glow rounded-3xl border border-white/[0.08] bg-[#121826]/85 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">Document Viewer / Upload</h2>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) onUpload(file);
        }}
        className="vs-card-glow mt-4 flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.14] bg-[#0B0F19]/80 p-6 text-center"
      >
        <p className="text-sm font-semibold text-[#F9FAFB]">Drop PDF here or click to upload</p>
        <p className="mt-2 text-xs text-[#9CA3AF]">Document highlighting is mocked for demo.</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </div>
      {loading ? <p className="mt-3 text-xs text-[#22D3EE]">Analyzing document...</p> : null}
    </section>
  );
}


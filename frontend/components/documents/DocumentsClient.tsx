"use client";

import { useState } from "react";
import { DocumentInsightPanel } from "@/components/documents/DocumentInsightPanel";
import { DocumentUploadPanel } from "@/components/documents/DocumentUploadPanel";
import { mockDocumentInsight, type DocumentInsight } from "@/lib/mock-data";

export function DocumentsClient() {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [insight, setInsight] = useState<DocumentInsight | null>(null);

  const onUpload = (file: File) => {
    setFileName(file.name);
    setLoading(true);
    setInsight(null);

    window.setTimeout(() => {
      setInsight(mockDocumentInsight(file.name));
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <section className="vs-card-glow rounded-3xl border border-white/[0.08] bg-[#121826]/80 p-5">
        <h1 className="text-2xl font-bold text-[#F9FAFB]">Document Intelligence</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Upload legal PDFs and inspect extracted summary, entities, key points, and referenced
          sections.
        </p>
        {fileName ? <p className="mt-2 font-mono text-xs text-[#22D3EE]">Loaded: {fileName}</p> : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <DocumentUploadPanel loading={loading} onUpload={onUpload} />
        <DocumentInsightPanel loading={loading} insight={insight} />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { DocumentInsightPanel } from "@/components/documents/DocumentInsightPanel";
import { DocumentUploadPanel } from "@/components/documents/DocumentUploadPanel";
import { getAiConnections, processDocumentWithLlm, type AiConnections } from "@/lib/api";
import type { DocumentInsight } from "@/lib/mock-data";

const FIXED_DOCUMENT_PROMPT =
  "Analyze this legal document and return JSON with exactly four sections: " +
  "(1) summary as 4-5 concise sentences, (2) extracted entities, (3) key points, " +
  "and (4) referenced sections. Keep output factual and grounded in document text.";

export function DocumentsClient() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [insight, setInsight] = useState<DocumentInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelConfig, setModelConfig] = useState<AiConnections | null>(null);

  useEffect(() => {
    getAiConnections().then(setModelConfig).catch(() => {});
  }, []);

  const onUpload = (nextFile: File) => {
    setFile(nextFile);
    setLoading(false);
    setInsight(null);
    setError(null);
  };

  const processWithLlm = () => {
    if (!file) return;
    setLoading(true);
    setInsight(null);
    setError(null);
    processDocumentWithLlm({
      file,
      prompt: FIXED_DOCUMENT_PROMPT,
      provider: modelConfig?.document_llm_provider,
      model: modelConfig?.document_llm_model_value,
      baseUrl: modelConfig?.document_llm_base_url,
    })
      .then((out) => {
        setInsight({
          summary: out.summary,
          keyPoints: out.key_points,
          referencedSections: out.referenced_sections,
          entities: {
            caseId: out.entities.case_id,
            judge: out.entities.judge,
            parties: out.entities.parties,
            evidence: out.entities.evidence,
            dates: out.entities.dates,
          },
        });
      })
      .catch(() => {
        setInsight(null);
        setError("Document processing failed. Check model endpoint and API key.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <section className="vs-card-glow rounded-3xl border border-white/[0.08] bg-[#121826]/80 p-5">
        <h1 className="text-2xl font-bold text-[#F9FAFB]">Document Intelligence</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Upload legal PDFs, then process with AI using the standard legal extraction prompt.
        </p>
        {file ? <p className="mt-2 font-mono text-xs text-[#22D3EE]">Loaded: {file.name}</p> : null}
        <p className="mt-2 text-xs text-[#9CA3AF]">
          Model: {modelConfig?.document_llm_provider ?? "not configured"} /{" "}
          {modelConfig?.document_llm_model_name ?? "not configured"} (
          {modelConfig?.document_llm_model_value ?? "n/a"})
        </p>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Endpoint: {modelConfig?.document_llm_base_url ?? "not configured"}
        </p>
        {!modelConfig?.has_document_llm_api_key ? (
          <p className="mt-1 text-xs text-amber-300">
            Missing LLM API key. Add it in Admin - Model connections.
          </p>
        ) : null}
      </section>
      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <DocumentUploadPanel
            file={file}
            loading={loading}
            onUpload={onUpload}
            onProcess={processWithLlm}
          />
        </div>

        <DocumentInsightPanel loading={loading} insight={insight} />
      </div>
    </div>
  );
}

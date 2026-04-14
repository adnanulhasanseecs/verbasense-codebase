"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  getAiConnections,
  getAuthUser,
  healthCheckAiConnections,
  updateAiConnections,
  validateDocumentLlmKey,
  type AiConnections,
} from "@/lib/api";

function KeyStatusBadge({
  configured,
  pending,
  label,
}: {
  configured: boolean;
  pending?: boolean;
  label: string;
}) {
  if (configured) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
        {label}: saved
      </span>
    );
  }
  if (pending) {
    return (
      <span className="inline-flex items-center rounded-full border border-sky-500/35 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-100">
        {label}: entered (not saved)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-100">
      {label}: not saved
    </span>
  );
}

export default function AdminModelsPage() {
  const [asrProvider, setAsrProvider] = useState("openai");
  const [speechEngine, setSpeechEngine] = useState("whisper-large-v3");
  const [asrBaseUrl, setAsrBaseUrl] = useState("https://api.openai.com/v1");
  const [asrApiKey, setAsrApiKey] = useState("");

  const [deploymentMode, setDeploymentMode] = useState<"cloud" | "self-hosted" | "on-prem">("cloud");
  const [docProvider, setDocProvider] = useState("openai-compatible");
  const [docModelName, setDocModelName] = useState("Document Extractor");
  const [docModelValue, setDocModelValue] = useState("gpt-4.1-mini");
  const [transModelName, setTransModelName] = useState("Transcript Intelligence");
  const [transModelValue, setTransModelValue] = useState("gpt-4.1-mini");
  const [docBaseUrl, setDocBaseUrl] = useState("https://api.openai.com/v1");
  const [docApiKey, setDocApiKey] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validatingAsr, setValidatingAsr] = useState(false);
  const [validatingLlm, setValidatingLlm] = useState(false);
  const [asrStatusMessage, setAsrStatusMessage] = useState<string | null>(null);
  const [asrStatusOk, setAsrStatusOk] = useState<boolean | null>(null);
  const [llmStatusMessage, setLlmStatusMessage] = useState<string | null>(null);
  const [llmStatusOk, setLlmStatusOk] = useState<boolean | null>(null);

  const [keyStatusLoaded, setKeyStatusLoaded] = useState(false);
  const [hasAsrApiKeySaved, setHasAsrApiKeySaved] = useState(false);
  const [hasDocumentLlmApiKeySaved, setHasDocumentLlmApiKeySaved] = useState(false);

  const hasAsrApiKeyPending = asrApiKey.trim().length > 0;
  const hasDocumentLlmApiKeyPending = docApiKey.trim().length > 0;

  const applyKeyStatusFromResponse = (c: AiConnections) => {
    setHasAsrApiKeySaved(c.has_asr_api_key);
    setHasDocumentLlmApiKeySaved(c.has_document_llm_api_key);
    setKeyStatusLoaded(true);
  };

  useEffect(() => {
    const me = getAuthUser();
    if (!me || me.role !== "admin") {
      window.location.href = "/login";
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const c = await getAiConnections();
        setAsrProvider(c.asr_provider || "openai");
        setSpeechEngine(c.asr_model || "whisper-1");
        setAsrBaseUrl(c.asr_base_url || "https://api.openai.com/v1");
        setDeploymentMode(c.deployment_mode);
        setDocProvider(c.document_llm_provider || "openai-compatible");
        setDocModelName(c.document_llm_model_name || "Document Extractor");
        setDocModelValue(c.document_llm_model_value || "gpt-4.1-mini");
        setTransModelName(c.transcription_llm_model_name || "Transcript Intelligence");
        setTransModelValue(c.transcription_llm_model_value || "gpt-4.1-mini");
        setDocBaseUrl(c.document_llm_base_url || "https://api.openai.com/v1");
        setDocApiKey("");
        setAsrApiKey("");
        applyKeyStatusFromResponse(c);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load saved model configuration");
        setKeyStatusLoaded(true);
        setHasAsrApiKeySaved(false);
        setHasDocumentLlmApiKeySaved(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const buildPayload = () => ({
    asr_provider: asrProvider,
    asr_model: speechEngine,
    asr_base_url: asrBaseUrl,
    asr_api_key: asrApiKey || undefined,
    deployment_mode: deploymentMode,
    document_llm_provider: docProvider,
    document_llm_model_name: docModelName,
    document_llm_model_value: docModelValue,
    transcription_llm_model_name: transModelName,
    transcription_llm_model_value: transModelValue,
    document_llm_base_url: docBaseUrl,
    document_llm_api_key: docApiKey || undefined,
  });

  const saveAsrConfig = async () => {
    try {
      const out = await updateAiConnections(buildPayload());
      applyKeyStatusFromResponse(out);
      setMessage("ASR configuration saved to secure backend storage");
      setError(null);
      setAsrApiKey("");
      setAsrStatusOk(true);
      setAsrStatusMessage("ASR configuration saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const saveLlmConfig = async () => {
    try {
      const out = await updateAiConnections(buildPayload());
      applyKeyStatusFromResponse(out);
      setMessage("LLM configuration saved to secure backend storage");
      setError(null);
      setDocApiKey("");
      setLlmStatusOk(true);
      setLlmStatusMessage("LLM configuration saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const runAsrValidation = async () => {
    setAsrStatusMessage(null);
    setAsrStatusOk(null);
    setValidatingAsr(true);
    try {
      const out = await validateDocumentLlmKey({
        provider: asrProvider,
        baseUrl: asrBaseUrl,
        apiKey: asrApiKey,
      });
      setAsrStatusOk(out.valid);
      setAsrStatusMessage(out.message);
    } catch (e) {
      setAsrStatusOk(false);
      setAsrStatusMessage(e instanceof Error ? e.message : "ASR key validation failed");
    } finally {
      setValidatingAsr(false);
    }
  };

  const runLlmValidation = async () => {
    setLlmStatusMessage(null);
    setLlmStatusOk(null);
    setValidatingLlm(true);
    try {
      const out = await validateDocumentLlmKey({
        provider: docProvider,
        baseUrl: docBaseUrl,
        apiKey: docApiKey,
      });
      setLlmStatusOk(out.valid);
      setLlmStatusMessage(out.message);
    } catch (e) {
      setLlmStatusOk(false);
      setLlmStatusMessage(e instanceof Error ? e.message : "LLM key validation failed");
    } finally {
      setValidatingLlm(false);
    }
  };

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Model connections</h1>
            <p className="mt-1 text-sm text-[#9CA3AF]">
              Explicitly configure ASR and LLM models for cloud, self-hosted, or on-prem deployments.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {!keyStatusLoaded ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-[#0B0F19] px-2.5 py-0.5 text-[11px] text-[#9CA3AF]">
                  Key status: loading…
                </span>
              ) : (
                <>
                  <KeyStatusBadge
                    configured={hasAsrApiKeySaved}
                    pending={!hasAsrApiKeySaved && hasAsrApiKeyPending}
                    label="ASR API key"
                  />
                  <KeyStatusBadge
                    configured={hasDocumentLlmApiKeySaved}
                    pending={!hasDocumentLlmApiKeySaved && hasDocumentLlmApiKeyPending}
                    label="LLM API key"
                  />
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/users" className="rounded-xl border border-white/15 px-3 py-2 text-xs text-[#E5E7EB]">Users</Link>
            <Link href="/admin/models" className="rounded-xl bg-[#3B82F6] px-3 py-2 text-xs font-semibold text-white">Model connections</Link>
            <Link href="/settings" className="rounded-xl border border-white/15 px-3 py-2 text-xs text-[#E5E7EB]">My settings</Link>
          </div>
        </div>

        <section className="mt-5 rounded-2xl border border-white/10 bg-[#121826] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">ASR configuration</h2>
            {keyStatusLoaded ? (
              <KeyStatusBadge
                configured={hasAsrApiKeySaved}
                pending={!hasAsrApiKeySaved && hasAsrApiKeyPending}
                label="ASR key"
              />
            ) : null}
          </div>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            These fields are for speech-to-text input (upload + live transcription). Use provider/model IDs that
            match your ASR backend.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs text-[#9CA3AF]">
              ASR provider ID
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
                value={asrProvider}
                onChange={(e) => setAsrProvider(e.target.value)}
                placeholder="openai | self-hosted-whisper | deepgram"
              />
            </label>
            <label className="text-xs text-[#9CA3AF]">
              ASR model ID
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
                value={speechEngine}
                onChange={(e) => setSpeechEngine(e.target.value)}
                placeholder="whisper-1 (OpenAI) or whisper-large-v3 (self-hosted)"
              />
            </label>
            <label className="text-xs text-[#9CA3AF]">
              ASR base URL (OpenAI-compatible)
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
                value={asrBaseUrl}
                onChange={(e) => setAsrBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1 or http://localhost:8001/v1"
              />
            </label>
            <label className="text-xs text-[#9CA3AF]">
              ASR API key/token
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
                value={asrApiKey}
                onChange={(e) => setAsrApiKey(e.target.value)}
                placeholder="Leave blank to keep saved key"
                type="password"
              />
            </label>
          </div>
          <div className="mt-2 rounded-xl border border-white/10 bg-[#0B0F19]/70 px-3 py-2 text-[11px] text-[#9CA3AF]">
            <p>
              Example 1 (OpenAI cloud): provider <code>openai</code>, model <code>whisper-1</code>
            </p>
            <p>
              Example 2 (Self-hosted Whisper): provider <code>self-hosted-whisper</code>, model{" "}
              <code>whisper-large-v3</code>
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={() => saveAsrConfig().catch(() => {})}
            >
              Save ASR configuration
            </button>
            <button
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-[#E5E7EB] disabled:opacity-50"
              type="button"
              onClick={runAsrValidation}
              disabled={validatingAsr || !asrApiKey}
            >
              {validatingAsr ? "Validating ASR key..." : "Validate ASR key"}
            </button>
            <button
              className="rounded-xl border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-200"
              type="button"
              onClick={async () => {
                try {
                  const out = await healthCheckAiConnections();
                  setAsrStatusOk(out.asr.valid);
                  setAsrStatusMessage(out.asr.message);
                } catch (e) {
                  setAsrStatusOk(false);
                  setAsrStatusMessage(e instanceof Error ? e.message : "ASR health check failed");
                }
              }}
            >
              Run ASR health check
            </button>
          </div>
          {asrStatusMessage ? (
            <p className={`mt-2 text-xs ${asrStatusOk ? "text-emerald-300" : "text-rose-200"}`}>
              {asrStatusMessage}
            </p>
          ) : null}
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-[#121826] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">LLM configuration</h2>
            {keyStatusLoaded ? (
              <KeyStatusBadge
                configured={hasDocumentLlmApiKeySaved}
                pending={!hasDocumentLlmApiKeySaved && hasDocumentLlmApiKeyPending}
                label="LLM key"
              />
            ) : null}
          </div>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            These models process text outputs: document extraction and transcription intelligence (summary/actions/entities
            from transcript text).
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs text-[#9CA3AF]">
              Deployment mode
              <select className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" value={deploymentMode} onChange={(e) => setDeploymentMode(e.target.value as "cloud" | "self-hosted" | "on-prem") }>
                <option value="cloud">Cloud</option>
                <option value="self-hosted">Self-hosted</option>
                <option value="on-prem">On-prem</option>
              </select>
            </label>
            <label className="text-xs text-[#9CA3AF]">
              LLM provider ID
              <input className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" value={docProvider} onChange={(e) => setDocProvider(e.target.value)} placeholder="openai-compatible | ollama | vllm" />
            </label>
            <label className="text-xs text-[#9CA3AF]">
              Document model name (display label)
              <input className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" value={docModelName} onChange={(e) => setDocModelName(e.target.value)} placeholder="Document Extractor" />
            </label>
            <label className="text-xs text-[#9CA3AF]">
              Document model value (API model ID)
              <input className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" value={docModelValue} onChange={(e) => setDocModelValue(e.target.value)} placeholder="gpt-4.1-mini / llama3.1:8b-instruct" />
            </label>
            <label className="text-xs text-[#9CA3AF]">
              Transcription-intelligence model name
              <input className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" value={transModelName} onChange={(e) => setTransModelName(e.target.value)} placeholder="Transcript Intelligence" />
            </label>
            <label className="text-xs text-[#9CA3AF]">
              Transcription-intelligence model value (API model ID)
              <input className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" value={transModelValue} onChange={(e) => setTransModelValue(e.target.value)} placeholder="gpt-4.1-mini / mistral-small" />
            </label>
            <label className="text-xs text-[#9CA3AF]">
              LLM base URL (OpenAI-compatible)
              <input className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" value={docBaseUrl} onChange={(e) => setDocBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1 or http://localhost:11434/v1" />
            </label>
            <label className="text-xs text-[#9CA3AF]">
              LLM API key/token
              <input className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" value={docApiKey} onChange={(e) => setDocApiKey(e.target.value)} placeholder="sk-... or deployment token" type="password" />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white" type="button" onClick={() => saveLlmConfig().catch(() => {})}>Save LLM configuration</button>
            <button className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-[#E5E7EB] disabled:opacity-50" type="button" onClick={runLlmValidation} disabled={validatingLlm || !docApiKey}>
              {validatingLlm ? "Validating LLM key..." : "Validate LLM key"}
            </button>
            <button
              className="rounded-xl border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-200"
              type="button"
              onClick={async () => {
                try {
                  const out = await healthCheckAiConnections();
                  setLlmStatusOk(out.document_llm.valid);
                  setLlmStatusMessage(out.document_llm.message);
                } catch (e) {
                  setLlmStatusOk(false);
                  setLlmStatusMessage(e instanceof Error ? e.message : "LLM health check failed");
                }
              }}
            >
              Run LLM health check
            </button>
          </div>
          {llmStatusMessage ? (
            <p className={`mt-2 text-xs ${llmStatusOk ? "text-emerald-300" : "text-rose-200"}`}>
              {llmStatusMessage}
            </p>
          ) : null}
        </section>

        {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
        {error ? <p className="mt-3 text-xs text-rose-200">{error}</p> : null}
      </main>
    </AppShell>
  );
}

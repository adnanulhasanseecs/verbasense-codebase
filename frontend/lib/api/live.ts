import type { LiveSession } from "@/features/live/types/live.types";
import { authHeaders, getBaseUrl, parseJson } from "@/lib/api/client";

export async function getLiveSession(): Promise<LiveSession | null> {
  const response = await fetch(`${getBaseUrl()}/api/v1/live`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Live session fetch failed (${response.status})`);
  return parseJson<LiveSession | null>(response);
}

export async function startLiveSession(params: {
  courtroom: string;
  inputDevice: string;
  sampleRate: number;
  chunkDurationMs: number;
}): Promise<LiveSession> {
  const formData = new FormData();
  formData.append("courtroom", params.courtroom);
  formData.append("input_device", params.inputDevice);
  formData.append("sample_rate", String(params.sampleRate));
  formData.append("chunk_duration_ms", String(params.chunkDurationMs));
  const response = await fetch(`${getBaseUrl()}/api/v1/live/sessions/start`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!response.ok) throw new Error(`Live session start failed (${response.status})`);
  return parseJson<LiveSession>(response);
}

export async function sendLiveChunk(sessionId: string, blob: Blob): Promise<LiveSession> {
  const formData = new FormData();
  formData.append("chunk", blob, "chunk.webm");
  const response = await fetch(`${getBaseUrl()}/api/v1/live/sessions/${sessionId}/chunk`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!response.ok) throw new Error(`Live chunk upload failed (${response.status})`);
  return parseJson<LiveSession>(response);
}

export async function pauseLiveSession(sessionId: string): Promise<LiveSession> {
  const response = await fetch(`${getBaseUrl()}/api/v1/live/sessions/${sessionId}/pause`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error(`Live pause failed (${response.status})`);
  return parseJson<LiveSession>(response);
}

export async function resumeLiveSession(sessionId: string): Promise<LiveSession> {
  const response = await fetch(`${getBaseUrl()}/api/v1/live/sessions/${sessionId}/resume`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error(`Live resume failed (${response.status})`);
  return parseJson<LiveSession>(response);
}

export async function stopLiveSession(sessionId: string): Promise<LiveSession> {
  const response = await fetch(`${getBaseUrl()}/api/v1/live/sessions/${sessionId}/stop`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error(`Live stop failed (${response.status})`);
  return parseJson<LiveSession>(response);
}

export async function applySpeakerLabels(
  sessionId: string,
  labels: Record<string, string>,
): Promise<LiveSession> {
  const response = await fetch(`${getBaseUrl()}/api/v1/live/sessions/${sessionId}/speakers/labels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(labels),
  });
  if (!response.ok) throw new Error(`Speaker relabel failed (${response.status})`);
  return parseJson<LiveSession>(response);
}

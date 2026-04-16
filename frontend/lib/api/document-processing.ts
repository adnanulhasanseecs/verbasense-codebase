import { authHeaders, extractApiError, getBaseUrl, parseJson } from "@/lib/api/client";
import type { DocumentInsightResult } from "@/lib/api/types";

export async function processDocumentWithLlm(params: {
  file: File;
  prompt: string;
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}): Promise<DocumentInsightResult> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("prompt", params.prompt);
  formData.append("provider", params.provider ?? "");
  formData.append("model", params.model ?? "");
  formData.append("api_key", params.apiKey ?? "");
  formData.append("base_url", params.baseUrl ?? "");
  const response = await fetch(`${getBaseUrl()}/api/v1/documents/process`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!response.ok) throw await extractApiError(response, `Document processing failed (${response.status})`);
  return parseJson<DocumentInsightResult>(response);
}

export async function validateDocumentLlmKey(params: {
  provider: string;
  baseUrl: string;
  apiKey: string;
}): Promise<{ valid: boolean; message: string }> {
  const response = await fetch(`${getBaseUrl()}/api/v1/documents/validate-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      provider: params.provider,
      base_url: params.baseUrl,
      api_key: params.apiKey,
    }),
  });
  if (!response.ok) throw new Error(`Key validation failed (${response.status})`);
  return parseJson<{ valid: boolean; message: string }>(response);
}

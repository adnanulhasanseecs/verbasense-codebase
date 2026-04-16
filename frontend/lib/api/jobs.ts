import { getBaseUrl, parseJson } from "@/lib/api/client";
import type { DomainConfig, Job, ResultEnvelope } from "@/lib/api/types";

export type { DomainConfig, Job };

export async function uploadAudio(
  file: File,
  opts: { domain?: string; caseId?: string; courtroom?: string },
): Promise<Job> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("domain", opts.domain ?? "courtsense");
  const meta: Record<string, string | undefined> = {
    case_id: opts.caseId,
    courtroom: opts.courtroom,
  };
  formData.append("metadata", JSON.stringify(meta));
  const response = await fetch(`${getBaseUrl()}/api/v1/upload`, { method: "POST", body: formData });
  if (!response.ok) {
    const errorBody = (await parseJson<{ message?: string; code?: string }>(response).catch(() => ({}))) as {
      message?: string;
      code?: string;
    };
    throw new Error(errorBody.message ?? errorBody.code ?? `Upload failed (${response.status})`);
  }
  return parseJson<Job>(response);
}

export async function getJob(id: string): Promise<Job> {
  const response = await fetch(`${getBaseUrl()}/api/v1/job/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Job fetch failed (${response.status})`);
  return parseJson<Job>(response);
}

export async function getResult(id: string): Promise<ResultEnvelope> {
  const response = await fetch(`${getBaseUrl()}/api/v1/result/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Result fetch failed (${response.status})`);
  return parseJson<ResultEnvelope>(response);
}

export async function getDomainConfig(domainId: string): Promise<DomainConfig> {
  const response = await fetch(`${getBaseUrl()}/api/v1/config/domain/${domainId}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Config fetch failed (${response.status})`);
  return parseJson<DomainConfig>(response);
}

export async function health(): Promise<{ status: string }> {
  const response = await fetch(`${getBaseUrl()}/api/v1/health`, { cache: "no-store" });
  if (!response.ok) throw new Error("API unhealthy");
  return parseJson(response);
}

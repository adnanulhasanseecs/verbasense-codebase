/**
 * Typed API client for VerbaSense backend (contract-aligned).
 */

const baseUrl = () =>
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8011").replace(/\/$/, "");

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Job {
  id: string;
  status: JobStatus;
  stage: string;
  progress: number;
  domain: string;
  error?: { code: string; message: string };
}

export interface TranscriptSegment {
  speaker: string;
  text: string;
  start_ms?: number | null;
  end_ms?: number | null;
}

export interface ActionItem {
  text: string;
  owner?: string | null;
  priority?: string | null;
}

export interface Entity {
  type: string;
  value: string;
}

export interface OutputSchema {
  transcript: TranscriptSegment[];
  summary: string;
  key_decisions: string[];
  actions: ActionItem[];
  entities: Entity[];
  schema_version: string;
}

export interface ResultEnvelope {
  job_id: string;
  domain: string;
  output: OutputSchema;
}

export interface DomainConfig {
  id: string;
  domain: string;
  features: string[];
  ui: {
    name: string;
    labels: { summary: string; actions: string; decisions: string };
  };
  pipeline: { stages: string[] };
  entities: string[];
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON (${res.status}): ${text.slice(0, 200)}`);
  }
}

export async function uploadAudio(
  file: File,
  opts: { domain?: string; caseId?: string; courtroom?: string },
): Promise<Job> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("domain", opts.domain ?? "courtsense");
  const meta: Record<string, string | undefined> = {
    case_id: opts.caseId,
    courtroom: opts.courtroom,
  };
  fd.append("metadata", JSON.stringify(meta));
  const res = await fetch(`${baseUrl()}/api/v1/upload`, { method: "POST", body: fd });
  if (!res.ok) {
    const err = (await parseJson<{ message?: string; code?: string }>(res).catch(() => ({}))) as {
      message?: string;
      code?: string;
    };
    throw new Error(err.message ?? err.code ?? `Upload failed (${res.status})`);
  }
  return parseJson<Job>(res);
}

export async function getJob(id: string): Promise<Job> {
  const res = await fetch(`${baseUrl()}/api/v1/job/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Job fetch failed (${res.status})`);
  return parseJson<Job>(res);
}

export async function getResult(id: string): Promise<ResultEnvelope> {
  const res = await fetch(`${baseUrl()}/api/v1/result/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Result fetch failed (${res.status})`);
  return parseJson<ResultEnvelope>(res);
}

export async function getDomainConfig(domainId: string): Promise<DomainConfig> {
  const res = await fetch(`${baseUrl()}/api/v1/config/domain/${domainId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Config fetch failed (${res.status})`);
  return parseJson<DomainConfig>(res);
}

export async function health(): Promise<{ status: string }> {
  const res = await fetch(`${baseUrl()}/api/v1/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("API unhealthy");
  return parseJson(res);
}

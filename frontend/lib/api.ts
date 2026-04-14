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

async function extractApiError(res: Response, fallback: string): Promise<Error> {
  const body = (await parseJson<{ code?: string; message?: string; details?: Record<string, unknown> }>(res).catch(
    () => ({}),
  )) as { code?: string; message?: string; details?: Record<string, unknown> };
  const detail = body.details && typeof body.details === "object" ? JSON.stringify(body.details) : "";
  const message = body.message ?? body.code ?? fallback;
  return new Error(detail ? `${message} ${detail}` : message);
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

const TOKEN_KEY = "verbasense.authToken";
const USER_KEY = "verbasense.authUser";

export type AuthUser = {
  user_id: string;
  account_id: string;
  email: string;
  name: string;
  role: "admin" | "judge" | "clerk" | "viewer";
  active: boolean;
  profile_image_url?: string | null;
};

export type UserRole = AuthUser["role"];

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("verbasense-auth-changed"));
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("verbasense-auth-changed"));
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${baseUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed (${res.status})`);
  const payload = await parseJson<{ access_token: string; user: AuthUser }>(res);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, payload.access_token);
    setAuthUser(payload.user);
  }
  return payload.user;
}

export type AdminUser = {
  user_id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
};

export async function listAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/users`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Users fetch failed (${res.status})`);
  const out = await parseJson<{ items: AdminUser[] }>(res);
  return out.items;
}

export async function createInvite(email: string, role: string): Promise<{ invite_code: string }> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) throw new Error(`Invite failed (${res.status})`);
  return parseJson<{ invite_code: string }>(res);
}

export async function createAdminUser(payload: {
  email: string;
  name: string;
  password: string;
  role: string;
}): Promise<AdminUser> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Create user failed (${res.status})`);
  return parseJson<AdminUser>(res);
}

export async function updateAdminUserRole(userId: string, role: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(`Role update failed (${res.status})`);
}

export async function updateAdminUserStatus(userId: string, active: boolean): Promise<void> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error(`Status update failed (${res.status})`);
}

export async function resetAdminUserPassword(userId: string, newPassword: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/users/${userId}/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ new_password: newPassword }),
  });
  if (!res.ok) throw new Error(`Password reset failed (${res.status})`);
}

export type AccountSettings = {
  account_id: string;
  provider: string;
  model: string;
  fallback_providers: string[];
  provider_by_domain: Record<string, string>;
  model_by_domain: Record<string, string>;
};

export type AiConnections = {
  asr_provider: string;
  asr_model: string;
  asr_base_url: string;
  asr_timeout_seconds?: number | null;
  deployment_mode: "cloud" | "self-hosted" | "on-prem";
  document_llm_provider: string;
  document_llm_model_name: string;
  document_llm_model_value: string;
  transcription_llm_model_name: string;
  transcription_llm_model_value: string;
  document_llm_base_url: string;
  has_asr_api_key: boolean;
  has_document_llm_api_key: boolean;
};

export async function getAiConnections(): Promise<AiConnections> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/ai-connections`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!res.ok) throw await extractApiError(res, `AI settings fetch failed (${res.status})`);
  return parseJson<AiConnections>(res);
}

export async function updateAiConnections(payload: {
  asr_provider: string;
  asr_model: string;
  asr_base_url: string;
  asr_api_key?: string;
  asr_timeout_seconds?: number | null;
  deployment_mode: "cloud" | "self-hosted" | "on-prem";
  document_llm_provider: string;
  document_llm_model_name: string;
  document_llm_model_value: string;
  transcription_llm_model_name: string;
  transcription_llm_model_value: string;
  document_llm_base_url: string;
  document_llm_api_key?: string;
}): Promise<AiConnections> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/ai-connections`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await extractApiError(res, `AI settings update failed (${res.status})`);
  return parseJson<AiConnections>(res);
}

export async function healthCheckAiConnections(): Promise<{
  document_llm: { target: string; valid: boolean; message: string };
  asr: { target: string; valid: boolean; message: string };
}> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/ai-connections/health-check`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await extractApiError(res, `AI health check failed (${res.status})`);
  return parseJson(res);
}

export async function getAccountSettings(): Promise<AccountSettings> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/account-settings`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Settings fetch failed (${res.status})`);
  return parseJson<AccountSettings>(res);
}

export async function updateAccountSettings(payload: Omit<AccountSettings, "account_id">): Promise<void> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/account-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Settings update failed (${res.status})`);
}

export async function listAuditLogs(): Promise<
  Array<{ id: number; action: string; target_type: string; target_id: string; created_at: string }>
> {
  const res = await fetch(`${baseUrl()}/api/v1/admin/audit-logs`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Audit log fetch failed (${res.status})`);
  const out = await parseJson<{
    items: Array<{ id: number; action: string; target_type: string; target_id: string; created_at: string }>;
  }>(res);
  return out.items;
}

export async function getMe(): Promise<AuthUser> {
  const res = await fetch(`${baseUrl()}/api/v1/me`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`);
  const user = await parseJson<AuthUser>(res);
  setAuthUser(user);
  return user;
}

export async function updateMyProfile(payload: {
  name?: string;
  profile_image_url?: string;
}): Promise<AuthUser> {
  const res = await fetch(`${baseUrl()}/api/v1/me/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Profile update failed (${res.status})`);
  const user = await parseJson<AuthUser>(res);
  setAuthUser(user);
  return user;
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/api/v1/me/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!res.ok) throw new Error(`Password change failed (${res.status})`);
}

export type DocumentInsightResult = {
  summary: string;
  key_points: string[];
  referenced_sections: string[];
  entities: {
    case_id: string;
    judge: string;
    parties: string[];
    evidence: string[];
    dates: string[];
  };
  provider: string;
  model: string;
  prompt_used: string;
};

export async function processDocumentWithLlm(params: {
  file: File;
  prompt: string;
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}): Promise<DocumentInsightResult> {
  const fd = new FormData();
  fd.append("file", params.file);
  fd.append("prompt", params.prompt);
  fd.append("provider", params.provider ?? "");
  fd.append("model", params.model ?? "");
  fd.append("api_key", params.apiKey ?? "");
  fd.append("base_url", params.baseUrl ?? "");
  const res = await fetch(`${baseUrl()}/api/v1/documents/process`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: fd,
  });
  if (!res.ok) throw await extractApiError(res, `Document processing failed (${res.status})`);
  return parseJson<DocumentInsightResult>(res);
}

export async function validateDocumentLlmKey(params: {
  provider: string;
  baseUrl: string;
  apiKey: string;
}): Promise<{ valid: boolean; message: string }> {
  const res = await fetch(`${baseUrl()}/api/v1/documents/validate-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      provider: params.provider,
      base_url: params.baseUrl,
      api_key: params.apiKey,
    }),
  });
  if (!res.ok) throw new Error(`Key validation failed (${res.status})`);
  const out = await parseJson<{ valid: boolean; message: string }>(res);
  return out;
}

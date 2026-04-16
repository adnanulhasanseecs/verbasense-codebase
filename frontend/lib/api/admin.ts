import { authHeaders, extractApiError, getBaseUrl, parseJson } from "@/lib/api/client";
import type { AccountSettings, AdminUser, AiConnections } from "@/lib/api/types";

export type { AccountSettings, AdminUser, AiConnections };

export async function listAdminUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/users`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Users fetch failed (${response.status})`);
  const out = await parseJson<{ items: AdminUser[] }>(response);
  return out.items;
}

export async function createInvite(email: string, role: string): Promise<{ invite_code: string }> {
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ email, role }),
  });
  if (!response.ok) throw new Error(`Invite failed (${response.status})`);
  return parseJson<{ invite_code: string }>(response);
}

export async function createAdminUser(payload: {
  email: string;
  name: string;
  password: string;
  role: string;
}): Promise<AdminUser> {
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Create user failed (${response.status})`);
  return parseJson<AdminUser>(response);
}

export async function updateAdminUserRole(userId: string, role: string): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) throw new Error(`Role update failed (${response.status})`);
}

export async function updateAdminUserStatus(userId: string, active: boolean): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ active }),
  });
  if (!response.ok) throw new Error(`Status update failed (${response.status})`);
}

export async function resetAdminUserPassword(userId: string, newPassword: string): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/users/${userId}/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ new_password: newPassword }),
  });
  if (!response.ok) throw new Error(`Password reset failed (${response.status})`);
}

export async function getAiConnections(): Promise<AiConnections> {
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/ai-connections`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!response.ok) throw await extractApiError(response, `AI settings fetch failed (${response.status})`);
  return parseJson<AiConnections>(response);
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
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/ai-connections`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await extractApiError(response, `AI settings update failed (${response.status})`);
  return parseJson<AiConnections>(response);
}

export async function healthCheckAiConnections(): Promise<{
  document_llm: { target: string; valid: boolean; message: string };
  asr: { target: string; valid: boolean; message: string };
}> {
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/ai-connections/health-check`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw await extractApiError(response, `AI health check failed (${response.status})`);
  return parseJson(response);
}

export async function getAccountSettings(): Promise<AccountSettings> {
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/account-settings`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Settings fetch failed (${response.status})`);
  return parseJson<AccountSettings>(response);
}

export async function updateAccountSettings(payload: Omit<AccountSettings, "account_id">): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/account-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Settings update failed (${response.status})`);
}

export async function listAuditLogs(): Promise<
  Array<{ id: number; action: string; target_type: string; target_id: string; created_at: string }>
> {
  const response = await fetch(`${getBaseUrl()}/api/v1/admin/audit-logs`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Audit log fetch failed (${response.status})`);
  const out = await parseJson<{
    items: Array<{ id: number; action: string; target_type: string; target_id: string; created_at: string }>;
  }>(response);
  return out.items;
}

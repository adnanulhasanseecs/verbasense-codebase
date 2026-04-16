import {
  clearAuth as clearAuthStorage,
  extractApiError,
  getAuthToken,
  getAuthUser as getStoredAuthUser,
  getBaseUrl,
  parseJson,
  setAccessToken,
  setAuthUser as setStoredAuthUser,
} from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/types";

export { getAuthToken };

export function getAuthUser(): AuthUser | null {
  return getStoredAuthUser<AuthUser>();
}

export function clearAuth(): void {
  clearAuthStorage();
}

export function setAuthUser(user: AuthUser): void {
  setStoredAuthUser(user);
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${getBaseUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  if (!response.ok) {
    throw await extractApiError(response, `Login failed (${response.status})`);
  }
  const payload = await parseJson<{ access_token: string; user: AuthUser }>(response);
  setAccessToken(payload.access_token);
  setAuthUser(payload.user);
  return payload.user;
}

export async function getMe(): Promise<AuthUser> {
  const token = getAuthToken();
  const response = await fetch(`${getBaseUrl()}/api/v1/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Profile fetch failed (${response.status})`);
  const user = await parseJson<AuthUser>(response);
  setAuthUser(user);
  return user;
}

export async function updateMyProfile(payload: {
  name?: string;
  profile_image_url?: string;
}): Promise<AuthUser> {
  const token = getAuthToken();
  const response = await fetch(`${getBaseUrl()}/api/v1/me/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Profile update failed (${response.status})`);
  const user = await parseJson<AuthUser>(response);
  setAuthUser(user);
  return user;
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${getBaseUrl()}/api/v1/me/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!response.ok) throw new Error(`Password change failed (${response.status})`);
}

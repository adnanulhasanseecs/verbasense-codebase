const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8011").replace(/\/$/, "");

const MOCK_DELAY_MS = 220;
const TOKEN_KEY = "verbasense.authToken";
const USER_KEY = "verbasense.authUser";
const ROLE_COOKIE = "verbasense.role";

export async function withMockDelay<T>(value: T): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
  return value;
}

export function getBaseUrl(): string {
  return API_BASE;
}

export async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON (${response.status}): ${text.slice(0, 200)}`);
  }
}

export async function extractApiError(response: Response, fallback: string): Promise<Error> {
  const payload = (await parseJson<{ code?: string; message?: string; details?: Record<string, unknown> }>(response).catch(
    () => ({}),
  )) as { code?: string; message?: string; details?: Record<string, unknown> };
  const detail =
    payload.details && typeof payload.details === "object" ? JSON.stringify(payload.details) : "";
  const message = payload.message ?? payload.code ?? fallback;
  return new Error(detail ? `${message} ${detail}` : message);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setAuthUser<T extends { role: string }>(user: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(user.role)}; path=/; max-age=2592000; SameSite=Lax`;
  window.dispatchEvent(new Event("verbasense-auth-changed"));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  window.dispatchEvent(new Event("verbasense-auth-changed"));
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function safeFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  if (!API_BASE) return null;
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

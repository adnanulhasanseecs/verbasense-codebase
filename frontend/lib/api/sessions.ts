import type { Session } from "@/features/sessions/types/sessions.types";
import { authHeaders, getBaseUrl, parseJson } from "@/lib/api/client";

export async function getSessions(): Promise<Session[]> {
  const response = await fetch(`${getBaseUrl()}/api/v1/sessions`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Sessions fetch failed (${response.status})`);
  return parseJson<Session[]>(response);
}

export async function getSessionById(sessionId: string): Promise<Session | null> {
  const response = await fetch(`${getBaseUrl()}/api/v1/sessions/${sessionId}`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Session fetch failed (${response.status})`);
  return parseJson<Session>(response);
}

export async function getSessionIntelligence(
  sessionId: string,
): Promise<Session["intelligence"] | null> {
  const response = await fetch(`${getBaseUrl()}/api/v1/intelligence/${sessionId}`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Intelligence fetch failed (${response.status})`);
  return parseJson<Session["intelligence"] | null>(response);
}

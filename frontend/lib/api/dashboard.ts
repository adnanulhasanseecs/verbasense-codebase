import type { Session } from "@/features/sessions/types/sessions.types";
import { authHeaders, getBaseUrl, parseJson } from "@/lib/api/client";

export type DashboardResponse = {
  kpis: Array<{
    title: string;
    value: string;
    trend: string;
    up: boolean;
    href: string;
    data: number[];
  }>;
  sessionsPerHour: Array<{ hour: string; sessions: number }>;
  byCourtroom: Array<{ name: string; value: number }>;
  byDay: Array<{ day: string; value: number }>;
  docTypes: Array<{ name: string; value: number; color: string }>;
  timeline: Array<{ title: string; detail: string; at: string }>;
  liveSession: {
    courtroom: string;
    speaker: string;
    durationLabel: string;
    timelineProgress: number;
    speakerActivity: Array<{ label: string; value: number }>;
    waveform: number[];
  } | null;
  intelligence: Session["intelligence"];
};

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await fetch(`${getBaseUrl()}/api/v1/dashboard`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Dashboard fetch failed (${response.status})`);
  return parseJson<DashboardResponse>(response);
}

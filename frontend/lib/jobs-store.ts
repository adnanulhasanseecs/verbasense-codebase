/**
 * Lightweight client-side list of recent job ids (demo persistence).
 */

const KEY = "verbasense.jobs";

export function loadJobIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function rememberJobId(id: string): void {
  if (typeof window === "undefined") return;
  const cur = loadJobIds().filter((x) => x !== id);
  cur.unshift(id);
  localStorage.setItem(KEY, JSON.stringify(cur.slice(0, 20)));
}

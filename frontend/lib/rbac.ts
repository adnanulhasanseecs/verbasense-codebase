export type UserRole = "admin" | "judge" | "clerk" | "viewer";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  judge: "Judge",
  clerk: "Clerk",
  viewer: "Viewer",
};

export const NAV_ACCESS = {
  dashboard: ["admin", "judge", "clerk", "viewer"],
  live: ["admin", "judge"],
  upload: ["admin", "clerk"],
  documents: ["admin", "clerk", "judge"],
  sessions: ["admin", "judge", "viewer", "clerk"],
} as const;

export function hasRole(role: UserRole, allowed: readonly UserRole[]): boolean {
  return allowed.includes(role);
}

export function mapPersonaToRole(personaId?: string): UserRole {
  if (!personaId) return "viewer";
  if (personaId === "admin") return "admin";
  if (personaId === "judge") return "judge";
  if (personaId === "clerk") return "clerk";
  return "viewer";
}

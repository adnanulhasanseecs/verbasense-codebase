import type { UserRole } from "@/lib/auth/roles";

export const PERMISSIONS = {
  viewDashboard: ["admin", "judge", "clerk", "viewer"],
  viewSessions: ["admin", "judge", "clerk", "viewer"],
  viewLive: ["admin", "judge"],
  uploadAudio: ["admin", "clerk"],
  processDocuments: ["admin", "judge", "clerk"],
  viewRbac: ["admin"],
  adminActions: ["admin"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

export function canAccess(role: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role);
}

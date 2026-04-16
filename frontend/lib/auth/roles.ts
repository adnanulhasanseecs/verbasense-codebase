export const ROLES = ["admin", "judge", "clerk", "viewer"] as const;

export type UserRole = (typeof ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return ROLES.includes(value as UserRole);
}

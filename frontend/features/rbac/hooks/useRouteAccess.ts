"use client";

import { ROUTE_POLICIES } from "@/features/rbac/api/rbac.api";
import type { UserRole } from "@/lib/auth/roles";

export function canAccessPath(pathname: string, role: UserRole): boolean {
  const policy = ROUTE_POLICIES.find((candidate) => pathname.startsWith(candidate.pathPrefix));
  if (!policy) return true;
  return policy.roles.includes(role);
}

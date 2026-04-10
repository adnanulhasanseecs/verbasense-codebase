"use client";

import type { ReactNode } from "react";
import { useRole } from "@/components/rbac/RoleContext";
import { hasRole, type UserRole } from "@/lib/rbac";

export function RoleGuard({
  roles,
  children,
  fallback = null,
}: {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role } = useRole();
  if (!hasRole(role, roles)) return <>{fallback}</>;
  return <>{children}</>;
}

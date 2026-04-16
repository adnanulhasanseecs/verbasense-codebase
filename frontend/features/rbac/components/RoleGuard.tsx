"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccess } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/roles";

export function RoleGuard({
  roles,
  children,
  fallback = null,
}: {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role } = useAuth();
  if (!canAccess(role, roles)) return <>{fallback}</>;
  return <>{children}</>;
}

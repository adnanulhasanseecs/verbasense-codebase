"use client";

import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/lib/auth/roles";

export function RoleProvider({ children, initialRole }: { children: React.ReactNode; initialRole?: UserRole }) {
  return <AuthProvider initialRole={initialRole}>{children}</AuthProvider>;
}

export function useRole() {
  return useAuth();
}

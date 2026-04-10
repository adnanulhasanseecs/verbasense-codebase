"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { mapPersonaToRole, type UserRole } from "@/lib/rbac";

type RoleContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "verbasense.activePersona";

function resolveInitialRole(initialRole?: UserRole): UserRole {
  return initialRole ?? "viewer";
}

export function RoleProvider({
  children,
  initialRole,
}: {
  children: React.ReactNode;
  initialRole?: UserRole;
}) {
  const [role, setRoleState] = useState<UserRole>(() => resolveInitialRole(initialRole));

  useEffect(() => {
    if (initialRole || typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { id?: string };
        const persisted = mapPersonaToRole(parsed.id);
        setRoleState((prev) => (prev === persisted ? prev : persisted));
      } catch {
        // noop
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialRole]);

  const setRole = (next: UserRole) => {
    setRoleState(next);
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...parsed, id: next === "viewer" ? "viewer" : next }),
      );
    } catch {
      // noop
    }
  };

  const value = useMemo(() => ({ role, setRole }), [role]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return ctx;
}

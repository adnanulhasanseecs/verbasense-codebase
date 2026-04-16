"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuthUser } from "@/lib/api/auth";
import type { UserRole } from "@/lib/auth/roles";
import { useAppStore } from "@/store/app-store";

type AuthContextValue = {
  role: UserRole;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialRole,
}: {
  children: React.ReactNode;
  initialRole?: UserRole;
}) {
  const [role, setRole] = useState<UserRole>(initialRole ?? "viewer");
  const setCurrentRole = useAppStore((state) => state.setCurrentRole);

  useEffect(() => {
    if (initialRole) {
      setCurrentRole(initialRole);
      return;
    }
    const sync = () => {
      const user = getAuthUser();
      const next = user?.role ?? "viewer";
      setRole(next);
      setCurrentRole(next);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("verbasense-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("verbasense-auth-changed", sync);
    };
  }, [initialRole, setCurrentRole]);

  const value = useMemo(() => ({ role }), [role]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuthUser, type UserRole } from "@/lib/api";

type RoleContextValue = {
  role: UserRole;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  children,
  initialRole,
}: {
  children: React.ReactNode;
  initialRole?: UserRole;
}) {
  const [role, setRole] = useState<UserRole>(initialRole ?? "viewer");

  useEffect(() => {
    const sync = () => {
      const user = getAuthUser();
      setRole(user?.role ?? "viewer");
    };
    if (initialRole) return;
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("verbasense-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("verbasense-auth-changed", sync);
    };
  }, [initialRole]);

  const value = useMemo(() => ({ role }), [role]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return ctx;
}

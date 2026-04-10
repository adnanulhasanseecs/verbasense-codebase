"use client";

import { ROLE_LABELS } from "@/lib/rbac";
import { useRole } from "@/components/rbac/RoleContext";

export function RoleBadge() {
  const { role } = useRole();
  return (
    <span className="inline-flex items-center rounded-full border border-white/[0.15] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#E5E7EB]">
      Role: {ROLE_LABELS[role]}
    </span>
  );
}

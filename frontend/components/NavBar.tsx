"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/components/rbac/RoleContext";
import { RoleBadge } from "@/components/rbac/RoleBadge";
import { APP_NAV_LINKS } from "@/lib/nav-config";
import { NAV_ACCESS, ROLE_LABELS, hasRole, type UserRole } from "@/lib/rbac";

export function NavBar() {
  const pathname = usePathname();
  const { role, setRole } = useRole();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <RoleBadge />
      <label className="sr-only" htmlFor="role-switcher">
        Switch role
      </label>
      <select
        id="role-switcher"
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        className="rounded-xl border border-white/[0.12] bg-[#121826] px-2 py-1.5 text-xs text-[#E5E7EB]"
      >
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>

      <nav className="flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-[#0B0F19]/50 p-1 shadow-inner shadow-black/40 backdrop-blur-md">
        {APP_NAV_LINKS.filter((l) => hasRole(role, NAV_ACCESS[l.key])).map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? "rounded-xl bg-gradient-to-r from-[#3B82F6]/25 to-[#6366F1]/20 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/10 ring-1 ring-white/10"
                    : "rounded-xl px-3 py-2 text-xs font-medium text-[#9CA3AF] transition hover:bg-white/[0.06] hover:text-[#E5E7EB]"
                }
              >
                {l.label}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}

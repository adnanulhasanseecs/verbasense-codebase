"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Settings } from "lucide-react";
import { RoleBadge } from "@/components/rbac/RoleBadge";
import { useRole } from "@/components/rbac/RoleContext";
import { APP_NAV_LINKS } from "@/lib/nav-config";
import { NAV_ACCESS, ROLE_LABELS, hasRole, type UserRole } from "@/lib/rbac";

/** Fixed top bar: logo + centered minimal nav (no border rail), aligned with AppShell. */
export function DashboardHeader() {
  const pathname = usePathname();
  const { role, setRole } = useRole();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-[#0B0F19]/95 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#121826]/90 sm:h-10 sm:w-10">
            <Image
              src="/verbasense-logo.png"
              alt="VerbaSense"
              width={28}
              height={28}
              className="h-auto w-auto object-contain"
              priority
            />
          </span>
          <span className="hidden min-w-0 sm:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF]">VerbaSense</p>
            <p className="truncate text-sm font-semibold text-[#F9FAFB]">CourtSense Command Center</p>
          </span>
        </Link>

        <nav aria-label="Primary" className="flex min-w-0 flex-1 justify-center">
          <ul className="flex max-w-full items-center gap-0.5 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 sm:px-2 [&::-webkit-scrollbar]:hidden">
            {APP_NAV_LINKS.filter((l) => hasRole(role, NAV_ACCESS[l.key])).map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <li key={l.href} className="shrink-0">
                  <Link
                    href={l.href}
                    className={
                      active
                        ? "inline-flex rounded-lg bg-gradient-to-r from-[#3B82F6]/25 to-[#6366F1]/20 px-2 py-1.5 text-[11px] font-semibold text-white sm:px-3 sm:py-2 sm:text-xs"
                        : "inline-flex rounded-lg px-2 py-1.5 text-[11px] font-medium text-[#9CA3AF] transition hover:bg-white/[0.06] hover:text-[#E5E7EB] sm:px-3 sm:py-2 sm:text-xs"
                    }
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden lg:block">
            <div className="flex max-w-[14rem] items-center rounded-xl bg-[#121826]/80 px-3 py-2 xl:max-w-xs">
              <Search size={16} className="shrink-0 text-[#6B7280]" />
              <input
                aria-label="Global search"
                placeholder="Search…"
                className="ml-2 min-w-0 flex-1 bg-transparent text-sm text-[#E5E7EB] placeholder:text-[#6B7280] focus:outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            className="hidden h-9 w-9 items-center justify-center rounded-xl bg-[#121826]/80 text-[#9CA3AF] md:inline-flex"
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>
          <button
            type="button"
            className="hidden h-9 w-9 items-center justify-center rounded-xl bg-[#121826]/80 text-[#9CA3AF] md:inline-flex"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
          <RoleBadge />
          <label className="sr-only" htmlFor="dashboard-role-switcher">
            Switch role
          </label>
          <select
            id="dashboard-role-switcher"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="max-w-[6.5rem] rounded-xl border border-white/[0.08] bg-[#121826] px-1.5 py-1.5 text-[11px] text-[#E5E7EB] sm:max-w-[7.5rem] sm:px-2 sm:text-xs"
          >
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

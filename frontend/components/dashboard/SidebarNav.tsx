"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, AudioLines, FileText, LayoutDashboard, Radio } from "lucide-react";
import { useRole } from "@/components/rbac/RoleContext";
import { APP_NAV_LINKS, type NavLinkKey } from "@/lib/nav-config";
import { NAV_ACCESS, hasRole } from "@/lib/rbac";

const ICONS: Record<NavLinkKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  live: Radio,
  upload: AudioLines,
  documents: FileText,
  sessions: Activity,
};

/** Legacy sidebar rail (optional); dashboard shell now uses the top nav bar. */
export function SidebarNav() {
  const pathname = usePathname();
  const { role } = useRole();

  return (
    <nav className="vs-card-glow rounded-2xl border border-white/[0.08] bg-[#121826]/95 p-2">
      <p className="px-3 pb-2 pt-1 text-[10px] uppercase tracking-[0.2em] text-[#6B7280]">Workspace</p>
      {APP_NAV_LINKS.filter((item) => hasRole(role, NAV_ACCESS[item.key])).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.key];
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={
              active
                ? "mb-1 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6]/25 to-[#6366F1]/20 px-3 py-2.5 text-sm font-semibold text-[#F9FAFB]"
                : "mb-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#9CA3AF] transition hover:bg-white/[0.04] hover:text-[#E5E7EB]"
            }
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

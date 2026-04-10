"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AudioLines,
  FileText,
  LayoutDashboard,
  Radio,
  Shield,
} from "lucide-react";
import { useRole } from "@/components/rbac/RoleContext";
import { NAV_ACCESS, hasRole } from "@/lib/rbac";

const items = [
  { href: "/dashboard", label: "Overview", key: "dashboard" as const, icon: LayoutDashboard },
  { href: "/live", label: "Live Session", key: "live" as const, icon: Radio },
  { href: "/transcribe", label: "Transcribe", key: "upload" as const, icon: AudioLines },
  { href: "/documents", label: "Documents", key: "documents" as const, icon: FileText },
  { href: "/sessions", label: "Sessions", key: "sessions" as const, icon: Activity },
  { href: "/admin/rbac", label: "RBAC", key: "admin" as const, icon: Shield },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { role } = useRole();

  return (
    <nav className="rounded-2xl border border-white/[0.08] bg-[#121826]/95 p-2 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.25)]">
      <p className="px-3 pb-2 pt-1 text-[10px] uppercase tracking-[0.2em] text-[#6B7280]">Workspace</p>
      {items
        .filter((item) => hasRole(role, NAV_ACCESS[item.key]))
        .map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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

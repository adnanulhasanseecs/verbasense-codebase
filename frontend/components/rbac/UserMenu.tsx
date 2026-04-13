"use client";

import Link from "next/link";
import { ClipboardList, Eye, Gavel, Shield, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRole } from "@/components/rbac/RoleContext";
import { ROLE_LABELS, type UserRole } from "@/lib/rbac";

const ROLE_ORDER: UserRole[] = ["admin", "judge", "clerk", "viewer"];

/** Navbar trigger icon per demo role (distinct silhouette at a glance). */
const ROLE_ICONS: Record<UserRole, LucideIcon> = {
  admin: Shield,
  judge: Gavel,
  clerk: ClipboardList,
  viewer: Eye,
};

/**
 * User icon opens a panel: link to dashboard (demo profile) + role switching (no separate badge or select).
 */
export function UserMenu() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const RoleIcon = ROLE_ICONS[role];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${ROLE_LABELS[role]} account: profile and role`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-[#121826]/90 text-[#E5E7EB] transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/55"
      >
        <RoleIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="vs-card-glow absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,15rem)] rounded-xl border border-white/[0.1] bg-[#121826]/98 py-2 backdrop-blur-xl"
        >
          <div className="border-b border-white/[0.06] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-[#6B7280]">Demo session</p>
            <p className="truncate text-sm font-medium text-[#F9FAFB]">{ROLE_LABELS[role]}</p>
          </div>
          <Link
            href="/dashboard"
            role="menuitem"
            className="block px-3 py-2.5 text-sm text-[#E5E7EB] hover:bg-white/[0.06]"
            onClick={() => setOpen(false)}
          >
            Profile / Dashboard
          </Link>
          <div className="border-t border-white/[0.06] px-2 py-2">
            <p className="px-1 pb-1.5 text-[10px] uppercase tracking-wider text-[#6B7280]">Switch role</p>
            <ul className="space-y-0.5">
              {ROLE_ORDER.map((id) => {
                const active = role === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      className={
                        active
                          ? "w-full rounded-lg bg-gradient-to-r from-[#3B82F6]/25 to-[#6366F1]/20 px-2 py-2 text-left text-sm font-medium text-white"
                          : "w-full rounded-lg px-2 py-2 text-left text-sm text-[#9CA3AF] hover:bg-white/[0.06] hover:text-[#E5E7EB]"
                      }
                      onClick={() => {
                        setRole(id);
                        setOpen(false);
                      }}
                    >
                      {ROLE_LABELS[id]}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

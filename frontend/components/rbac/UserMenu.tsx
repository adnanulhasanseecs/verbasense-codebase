"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Gavel, LogOut, Mars, Scale, Settings, Shield, User, UserCircle2, Venus } from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { clearAuth, getAuthUser } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/types";

const AVATAR_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  shield: Shield,
  gavel: Gavel,
  eye: Eye,
  scales: Scale,
  male: Mars,
  female: Venus,
  user: User,
};

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setUser(getAuthUser());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("verbasense-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("verbasense-auth-changed", sync);
    };
  }, []);

  const profile = user?.profile_image_url ?? "";
  const avatarToken = profile.startsWith("avatar:") ? profile.replace("avatar:", "") : "";
  const AvatarIcon = avatarToken ? AVATAR_ICONS[avatarToken] : null;

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

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-[#121826]/90 text-[#E5E7EB] transition hover:bg-white/[0.08] hover:text-white"
      >
        {AvatarIcon ? (
          <AvatarIcon className="h-5 w-5 text-[#93C5FD]" />
        ) : profile ? (
          <Image
            src={profile}
            alt="Profile avatar"
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl object-cover"
            unoptimized
          />
        ) : (
          <UserCircle2 className="h-5 w-5" aria-hidden />
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="vs-card-glow absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,16rem)] rounded-xl border border-white/[0.1] bg-[#121826]/98 py-2 backdrop-blur-xl"
        >
          <div className="border-b border-white/[0.06] px-3 py-2">
            <p className="truncate text-sm font-medium text-[#F9FAFB]">{user?.name ?? "Guest"}</p>
            <p className="truncate text-xs text-[#9CA3AF]">{user?.email ?? "Not signed in"}</p>
          </div>
          <Link
            href="/settings"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#E5E7EB] hover:bg-white/[0.06]"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            My settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#FCA5A5] hover:bg-white/[0.06]"
            onClick={() => {
              clearAuth();
              window.location.href = "/login";
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

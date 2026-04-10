"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Search, Settings } from "lucide-react";
import { RoleBadge } from "@/components/rbac/RoleBadge";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0B0F19]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.15] bg-[#121826]">
            <Image src="/verbasense-logo.png" alt="VerbaSense" width={28} height={28} className="object-contain" priority />
          </span>
          <span className="hidden sm:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF]">VerbaSense</p>
            <p className="text-sm font-semibold text-[#F9FAFB]">CourtSense Command Center</p>
          </span>
        </Link>

        <div className="hidden max-w-xl flex-1 px-4 lg:block">
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#121826] px-3 py-2">
            <Search size={16} className="text-[#6B7280]" />
            <input
              aria-label="Global search"
              placeholder="Search cases, sessions, documents"
              className="ml-2 w-full bg-transparent text-sm text-[#E5E7EB] placeholder:text-[#6B7280] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#121826] text-[#9CA3AF] md:inline-flex" aria-label="Notifications">
            <Bell size={16} />
          </button>
          <button type="button" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#121826] text-[#9CA3AF] md:inline-flex" aria-label="Settings">
            <Settings size={16} />
          </button>
          <RoleBadge />
        </div>
      </div>
    </header>
  );
}

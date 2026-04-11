"use client";

import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

/**
 * Dashboard uses the same max-width and top chrome pattern as AppShell: fixed header,
 * full-width scrollable main (no scrolling sidebar rail).
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#E5E7EB]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_70%_at_50%_-20%,rgba(59,130,246,0.14),transparent_60%),radial-gradient(ellipse_70%_45%_at_100%_0%,rgba(245,158,11,0.08),transparent_55%)]" />
      <DashboardHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-24">
        {children}
      </main>
      <footer className="border-t border-white/[0.06] py-8 text-center text-[11px] text-[#6B7280]">
        VerbaSense · CourtSense mock environment · API{" "}
        <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[#9CA3AF]">
          localhost:8111
        </code>
      </footer>
    </div>
  );
}

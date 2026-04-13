import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="vs-page min-h-screen text-[#E5E7EB]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(99,102,241,0.12),transparent_45%),radial-gradient(ellipse_60%_40%_at_0%_100%,rgba(34,211,238,0.08),transparent_40%)]" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10">{children}</main>
      <footer className="border-t border-white/[0.06] py-8 text-center text-[11px] text-[#6B7280]">
        VerbaSense - CourtSense mock environment - API defaults to{" "}
        <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[#9CA3AF]">
          localhost:8111
        </code>
      </footer>
    </div>
  );
}

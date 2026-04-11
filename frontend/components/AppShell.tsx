import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { NavBar } from "@/components/NavBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="vs-page min-h-screen text-[#E5E7EB]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(99,102,241,0.12),transparent_45%),radial-gradient(ellipse_60%_40%_at_0%_100%,rgba(34,211,238,0.08),transparent_40%)]" />
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0B0F19]/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#0B0F19] shadow-lg shadow-blue-500/20 ring-1 ring-white/20 transition group-hover:brightness-110">
              <Image
                src="/verbasense-logo.png"
                alt="VerbaSense logo"
                width={34}
                height={34}
                className="h-auto w-auto object-contain"
                priority
              />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
                VerbaSense
              </span>
              <span className="text-sm font-semibold tracking-tight text-[#F9FAFB]">
                CourtSense <span className="font-normal text-[#9CA3AF]">- Enterprise demo</span>
              </span>
            </span>
          </Link>
          <NavBar />
        </div>
      </header>
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

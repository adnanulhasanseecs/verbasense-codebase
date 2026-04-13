import Image from "next/image";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";

/** Shared top chrome: VerbaSense branding + CourtSense label + NavBar (used by AppShell and DashboardShell). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0B0F19]/65 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" prefetch={false} className="group flex items-center gap-3">
          <span className="vs-logo-glow relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-[#0B0F19] transition group-hover:brightness-110">
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
  );
}

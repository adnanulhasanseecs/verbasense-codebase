"use client";

import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SidebarNav } from "@/components/dashboard/SidebarNav";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#E5E7EB]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_70%_at_50%_-20%,rgba(59,130,246,0.14),transparent_60%),radial-gradient(ellipse_70%_45%_at_100%_0%,rgba(245,158,11,0.08),transparent_55%)]" />
      <DashboardHeader />
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 px-4 py-5 md:grid-cols-12">
        <aside className="md:col-span-3 xl:col-span-2 md:sticky md:top-20 md:h-[calc(100vh-6rem)]">
          <SidebarNav />
        </aside>
        <main className="md:col-span-9 xl:col-span-10">{children}</main>
      </div>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardPageSkeleton";

const DashboardPageContent = dynamic(
  () => import("@/features/dashboard/components/DashboardPageContent").then((m) => ({ default: m.DashboardPageContent })),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  },
);

/** Loads Recharts + KPI UI in a separate chunk after first paint (faster route startup). */
export function DashboardPageClient() {
  return <DashboardPageContent />;
}

"use client";

import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardPageSkeleton";

const DashboardLayout = dynamic(
  () => import("@/components/dashboard/DashboardLayout").then((m) => ({ default: m.DashboardLayout })),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  },
);

/** Loads Recharts + KPI UI in a separate chunk after first paint (faster route startup). */
export function DashboardPageClient() {
  return <DashboardLayout />;
}

import { DashboardPageSkeleton } from "@/components/dashboard/DashboardPageSkeleton";

/** Shown during route transition to /dashboard while RSC + client chunk resolve. */
export default function DashboardLoading() {
  return <DashboardPageSkeleton />;
}

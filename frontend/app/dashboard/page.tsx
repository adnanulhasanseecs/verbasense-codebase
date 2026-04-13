import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardPageClient } from "@/components/dashboard/DashboardPageClient";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardPageClient />
    </DashboardShell>
  );
}

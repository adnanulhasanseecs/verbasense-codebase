import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardLayout />
    </DashboardShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { RoleGuard } from "@/components/rbac/RoleGuard";
import { LiveSetupPanel } from "@/features/live/components/LiveSetupPanel";

export default function LiveSetupPage() {
  return (
    <AppShell>
      <RoleGuard roles={["admin", "judge", "clerk"]}>
        <section className="space-y-4">
          <PageHeader
            title="Live Setup"
            description="Configure microphone, device, and stream controls before starting live intake."
            breadcrumbs={[{ label: "Dashboard" }, { label: "Live" }, { label: "Setup" }]}
          />
          <LiveSetupPanel />
        </section>
      </RoleGuard>
    </AppShell>
  );
}

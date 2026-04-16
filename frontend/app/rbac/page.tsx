import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { RoleGuard } from "@/components/rbac/RoleGuard";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default function RbacPage() {
  return (
    <AppShell>
      <RoleGuard
        roles={["admin"]}
        fallback={
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            Your role does not have access to RBAC settings.
          </p>
        }
      >
        <section className="space-y-4">
          <PageHeader title="RBAC" description="Role-based access control matrix." breadcrumbs={[{ label: "Dashboard" }, { label: "RBAC" }]} />
          <section className="rounded-2xl border border-white/10 bg-[#121826]/80 p-4">
            <h2 className="text-sm font-semibold text-white">Permission mapping</h2>
            <ul className="mt-3 space-y-2">
              {Object.entries(PERMISSIONS).map(([permission, roles]) => (
                <li key={permission} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0B0F19]/60 px-3 py-2 text-sm">
                  <span className="text-[#E5E7EB]">{permission}</span>
                  <span className="text-[#9CA3AF]">{roles.join(", ")}</span>
                </li>
              ))}
            </ul>
          </section>
        </section>
      </RoleGuard>
    </AppShell>
  );
}

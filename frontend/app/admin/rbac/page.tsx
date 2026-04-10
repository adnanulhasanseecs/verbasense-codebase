import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/rbac/RoleGuard";

export default function RbacPage() {
  return (
    <AppShell>
      <RoleGuard
        roles={["admin"]}
        fallback={
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            Only Admin can view RBAC settings.
          </p>
        }
      >
        <section className="space-y-4 rounded-3xl border border-white/[0.08] bg-[#121826]/80 p-6">
          <h1 className="text-2xl font-bold text-[#F9FAFB]">RBAC / Admin</h1>
          <p className="text-sm text-[#9CA3AF]">
            This mock panel defines role visibility and permission boundaries for CourtSense modules.
          </p>
          <ul className="space-y-3 text-sm text-[#E5E7EB]">
            <li className="rounded-2xl border border-white/[0.08] bg-[#0B0F19]/70 p-3">Admin: full access, RBAC configuration, settings</li>
            <li className="rounded-2xl border border-white/[0.08] bg-[#0B0F19]/70 p-3">Judge: sessions + live courtroom workflow</li>
            <li className="rounded-2xl border border-white/[0.08] bg-[#0B0F19]/70 p-3">Clerk: upload + document intelligence + session support</li>
            <li className="rounded-2xl border border-white/[0.08] bg-[#0B0F19]/70 p-3">Viewer: read-only dashboard and session review</li>
          </ul>
        </section>
      </RoleGuard>
    </AppShell>
  );
}

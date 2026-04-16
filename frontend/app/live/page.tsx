import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/rbac/RoleGuard";
import { LivePageContent } from "@/features/live/components/LivePageContent";

export default function LivePage() {
  return (
    <AppShell>
      <RoleGuard
        roles={["admin", "judge"]}
        fallback={
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            Your role does not have access to Live Session.
          </p>
        }
      >
        <LivePageContent />
      </RoleGuard>
    </AppShell>
  );
}

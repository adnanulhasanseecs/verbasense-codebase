import { AppShell } from "@/components/AppShell";
import { DocumentsClient } from "@/components/documents/DocumentsClient";
import { RoleGuard } from "@/components/rbac/RoleGuard";

export default function DocumentsPage() {
  return (
    <AppShell>
      <RoleGuard
        roles={["admin", "clerk", "judge"]}
        fallback={
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            Your role does not have access to Document Intelligence.
          </p>
        }
      >
        <DocumentsClient />
      </RoleGuard>
    </AppShell>
  );
}

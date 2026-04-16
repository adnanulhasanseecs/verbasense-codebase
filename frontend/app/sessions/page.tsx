"use client";

import { AppShell } from "@/components/AppShell";
import { SessionsPageContent } from "@/features/sessions/components/SessionsPageContent";

export default function SessionsPage() {
  return (
    <AppShell>
      <SessionsPageContent />
    </AppShell>
  );
}

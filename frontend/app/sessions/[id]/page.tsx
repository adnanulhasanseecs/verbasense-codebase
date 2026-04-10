import { AppShell } from "@/components/AppShell";
import { SessionViewer } from "@/components/sessions/SessionViewer";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <SessionViewer id={id} />
    </AppShell>
  );
}

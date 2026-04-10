import { AppShell } from "@/components/AppShell";
import { ExportClient } from "@/components/ExportClient";

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <ExportClient jobId={id} />
    </AppShell>
  );
}

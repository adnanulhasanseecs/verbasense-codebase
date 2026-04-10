import { AppShell } from "@/components/AppShell";
import { JobWorkspace } from "@/components/JobWorkspace";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <JobWorkspace jobId={id} />
    </AppShell>
  );
}

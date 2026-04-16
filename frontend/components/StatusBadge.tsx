import type { JobStatus } from "@/lib/api/types";

const styles: Record<JobStatus, string> = {
  queued: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
  processing: "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30",
  completed: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
  failed: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30",
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

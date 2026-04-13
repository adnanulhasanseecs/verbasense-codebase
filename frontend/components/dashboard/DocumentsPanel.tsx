import type { SessionRow } from "@/lib/dashboard-mock";
import { DOCUMENTS } from "@/lib/dashboard-mock";

function statusClass(status: SessionRow["status"]) {
  if (status === "Processed") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
  if (status === "Processing") return "bg-blue-500/15 text-blue-200 border-blue-400/30";
  return "bg-amber-500/15 text-amber-200 border-amber-400/30";
}

export function DocumentsPanel() {
  return (
    <section className="vs-card-glow rounded-2xl border border-white/[0.08] bg-[#121826]/92 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Document Intelligence</h3>
      <ul className="mt-3 space-y-2">
        {DOCUMENTS.map((doc) => (
          <li
            key={doc.name}
            className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2.5 text-sm text-[#E5E7EB]"
          >
            <span>{doc.name}</span>
            <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(doc.status as SessionRow["status"])}`}>{doc.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}


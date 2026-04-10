import Link from "next/link";
import type { SessionRow } from "@/lib/dashboard-mock";

function statusClass(status: SessionRow["status"]) {
  if (status === "Processed") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
  if (status === "Processing") return "bg-blue-500/15 text-blue-200 border-blue-400/30";
  return "bg-amber-500/15 text-amber-200 border-amber-400/30";
}

export function SessionsTable({
  rows,
  query,
  onQuery,
  readOnly,
}: {
  rows: SessionRow[];
  query: string;
  onQuery: (value: string) => void;
  readOnly: boolean;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#121826]/92 p-5 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.38)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Sessions Overview</h3>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search case, session, status"
          className="w-full max-w-xs rounded-xl border border-white/[0.08] bg-[#0B0F19] px-3 py-2 text-sm text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-[#3B82F6]/60 focus:outline-none"
        />
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-[#0B0F19]/55">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[#9CA3AF]">
              <th className="px-4 py-3">Case ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-white/[0.06] text-[#E5E7EB] transition hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3.5 font-medium">{row.caseId}</td>
                <td className="px-4 py-3.5 text-[#9CA3AF]">{row.date}</td>
                <td className="px-4 py-3.5 text-[#9CA3AF]">{row.duration}</td>
                <td className="px-4 py-3.5">
                  <span className={`rounded-full border px-2 py-1 text-xs ${statusClass(row.status)}`}>{row.status}</span>
                </td>
                <td className="px-4 py-3.5">
                  <Link className="font-medium text-[#22D3EE] hover:underline" href={`/sessions/${row.id}`}>
                    {readOnly ? "Open" : "Review"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


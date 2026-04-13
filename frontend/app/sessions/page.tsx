import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { MOCK_SESSION } from "@/lib/mock-data";

export default function SessionsPage() {
  const sessions = [
    { id: MOCK_SESSION.id, status: "Processed", at: "2026-04-06 10:42" },
    { id: "SES-2026-1043", status: "Processing", at: "2026-04-06 11:05" },
    { id: "SES-2026-1039", status: "Processed", at: "2026-04-05 16:12" },
  ];

  return (
    <AppShell>
      <section className="vs-card-glow space-y-4 rounded-3xl border border-white/[0.08] bg-[#121826]/80 p-6">
        <h1 className="text-2xl font-bold text-[#F9FAFB]">Sessions</h1>
        <p className="text-sm text-[#9CA3AF]">Browse recent hearings with transcript, intelligence, and documents.</p>
        <ul className="vs-card-glow divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-[#0B0F19]/70">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-[#E5E7EB]">{s.id}</p>
                <p className="text-xs text-[#9CA3AF]">{s.at}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#9CA3AF]">{s.status}</span>
                <Link href={`/sessions/${s.id}`} className="text-[#22D3EE] hover:underline">
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

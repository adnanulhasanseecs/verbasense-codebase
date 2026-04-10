import { PENDING_ACTIONS } from "@/lib/dashboard-mock";

export function ActionsPanel() {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#121826]/92 p-5 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.38)]">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Pending Actions</h3>
      <ul className="mt-3 space-y-2 text-sm text-[#E5E7EB]">
        {PENDING_ACTIONS.map((a) => (
          <li key={a} className="rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2.5">
            {a}
          </li>
        ))}
      </ul>
    </section>
  );
}


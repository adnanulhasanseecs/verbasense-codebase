import Link from "next/link";

export function LiveSessionCard({
  active,
  room,
  detail,
}: {
  active: boolean;
  room?: string;
  detail?: string;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#121826]/92 p-5 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.38)]">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Live Session</h3>
      {active ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm font-semibold text-rose-200">
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-rose-400" />
            LIVE - {room}
          </p>
          <p className="text-sm leading-relaxed text-[#E5E7EB]">{detail}</p>
          <div className="rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2 text-xs text-[#9CA3AF]">
            Auto-capture and intelligence updates are active.
          </div>
          <Link
            href="/live"
            className="inline-flex rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#6366F1] px-3.5 py-2 text-xs font-semibold text-white"
          >
            Join Live View
          </Link>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-[#9CA3AF]">No active session</p>
          <Link
            href="/live"
            className="inline-flex rounded-xl border border-white/[0.12] px-3 py-2 text-xs font-semibold text-[#E5E7EB]"
          >
            Start Live Session
          </Link>
        </div>
      )}
    </section>
  );
}


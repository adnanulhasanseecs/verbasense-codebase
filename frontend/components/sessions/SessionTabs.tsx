"use client";

type SessionTab = "transcript" | "intelligence" | "documents";

const tabs: { id: SessionTab; label: string }[] = [
  { id: "transcript", label: "Transcript" },
  { id: "intelligence", label: "Intelligence" },
  { id: "documents", label: "Documents" },
];

export function SessionTabs({
  active,
  onChange,
}: {
  active: SessionTab;
  onChange: (tab: SessionTab) => void;
}) {
  return (
    <div className="vs-card-glow flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#121826]/70 p-2">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={
              isActive
                ? "rounded-xl bg-gradient-to-r from-[#3B82F6]/30 to-[#6366F1]/25 px-4 py-2 text-xs font-semibold text-white"
                : "rounded-xl px-4 py-2 text-xs font-medium text-[#9CA3AF] hover:bg-white/[0.04]"
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export type { SessionTab };

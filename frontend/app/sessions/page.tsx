"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SessionViewer } from "@/components/sessions/SessionViewer";
import { MOCK_SESSIONS } from "@/lib/mock-data";

export default function SessionsPage() {
  const [selectedId, setSelectedId] = useState<string>(MOCK_SESSIONS[0]?.id ?? "");

  const processed = useMemo(() => MOCK_SESSIONS.filter((s) => s.status === "processed"), []);
  const processing = useMemo(() => MOCK_SESSIONS.filter((s) => s.status === "processing"), []);
  const selected = useMemo(
    () => MOCK_SESSIONS.find((s) => s.id === selectedId) ?? MOCK_SESSIONS[0],
    [selectedId],
  );

  return (
    <AppShell>
      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="vs-card-glow h-fit rounded-3xl border border-white/[0.08] bg-[#121826]/80 p-4 lg:sticky lg:top-20">
          <h1 className="text-xl font-bold text-[#F9FAFB]">Sessions</h1>
          <p className="mt-1 text-xs text-[#9CA3AF]">Click any session to open details instantly.</p>

          <div className="mt-4 space-y-4">
            <SessionSection
              title="In process"
              items={processing}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <SessionSection
              title="Processed"
              items={processed}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </aside>

        <div>{selected ? <SessionViewer session={selected} /> : null}</div>
      </section>
    </AppShell>
  );
}

function SessionSection({
  title,
  items,
  selectedId,
  onSelect,
}: {
  title: string;
  items: (typeof MOCK_SESSIONS)[number][];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">{title}</p>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2 text-xs text-[#6B7280]">
            No sessions in this section.
          </p>
        ) : (
          items.map((s) => {
            const active = selectedId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className={
                  active
                    ? "w-full rounded-xl border border-[#3B82F6]/45 bg-[#1A2438] px-3 py-2 text-left"
                    : "w-full rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2 text-left hover:border-white/[0.15]"
                }
              >
                <p className="text-sm font-semibold text-[#E5E7EB]">{s.name}</p>
                <p className="text-xs text-[#9CA3AF]">{s.dateLabel}</p>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

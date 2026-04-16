"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SessionViewer } from "@/components/sessions/SessionViewer";
import { useSessions } from "@/features/sessions/hooks/useSessions";
import { useAppStore } from "@/store/app-store";

export function SessionsPageContent() {
  const { data, isLoading, isError, refetch } = useSessions();
  const selectedId = useAppStore((state) => state.currentSession);
  const setSelectedId = useAppStore((state) => state.setCurrentSession);

  const sessions = useMemo(() => data ?? [], [data]);
  const processed = useMemo(() => sessions.filter((session) => session.status === "processed"), [sessions]);
  const processing = useMemo(() => sessions.filter((session) => session.status === "processing"), [sessions]);
  const selected = useMemo(() => {
    if (!sessions.length) return null;
    if (!selectedId) return sessions[0];
    return sessions.find((session) => session.id === selectedId) ?? sessions[0];
  }, [sessions, selectedId]);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06]" />;
  }
  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100">
        Failed to load sessions.
        <button type="button" onClick={() => refetch()} className="ml-3 rounded-lg border border-white/20 px-2 py-1 text-xs hover:bg-white/10">
          Retry
        </button>
      </div>
    );
  }
  if (!sessions.length) {
    return <div className="rounded-2xl border border-white/10 bg-[#121826] p-4 text-sm text-[#9CA3AF]">No sessions available.</div>;
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title="Sessions"
        description="Browse in-process and completed sessions."
        breadcrumbs={[{ label: "Dashboard" }, { label: "Sessions" }, { label: selected?.id ?? "Session" }]}
      />
      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="vs-card-glow h-fit rounded-3xl border border-white/[0.08] bg-[#121826]/80 p-4 lg:sticky lg:top-20">
          <p className="mt-1 text-xs text-[#9CA3AF]">Click any session to open details instantly.</p>
          <div className="mt-4 space-y-4">
            <SessionSection title="In process" items={processing} selectedId={selected?.id ?? ""} onSelect={setSelectedId} />
            <SessionSection title="Processed" items={processed} selectedId={selected?.id ?? ""} onSelect={setSelectedId} />
          </div>
        </aside>
        <div>{selected ? <SessionViewer session={selected} /> : null}</div>
      </section>
    </section>
  );
}

function SessionSection({
  title,
  items,
  selectedId,
  onSelect,
}: {
  title: string;
  items: Array<{ id: string; name: string; dateLabel: string }>;
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
          items.map((session) => {
            const active = selectedId === session.id;
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelect(session.id)}
                className={
                  active
                    ? "w-full rounded-xl border border-[#3B82F6]/45 bg-[#1A2438] px-3 py-2 text-left"
                    : "w-full rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2 text-left hover:border-white/[0.15]"
                }
              >
                <p className="text-sm font-semibold text-[#E5E7EB]">{session.name}</p>
                <p className="text-xs text-[#9CA3AF]">{session.dateLabel}</p>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

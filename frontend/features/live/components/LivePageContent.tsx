"use client";

import { useEffect } from "react";
import { useLiveSession } from "@/features/live/hooks/useLiveSession";
import { LiveSessionPage } from "@/features/live/components/LiveSessionPage";
import { useAppStore } from "@/store/app-store";

export function LivePageContent() {
  const { data, isLoading, isError, refetch } = useLiveSession();
  const setLiveSession = useAppStore((state) => state.setLiveSession);

  useEffect(() => {
    if (!data || data.status !== "live") {
      setLiveSession(null);
      return;
    }
    setLiveSession(data);
  }, [data, setLiveSession]);

  if (isLoading) {
    return <div className="h-56 animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06]" />;
  }
  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100">
        Failed to load live session.
        <button type="button" onClick={() => refetch()} className="ml-3 rounded-lg border border-white/20 px-2 py-1 text-xs hover:bg-white/10">
          Retry
        </button>
      </div>
    );
  }

  return (
    <LiveSessionPage />
  );
}

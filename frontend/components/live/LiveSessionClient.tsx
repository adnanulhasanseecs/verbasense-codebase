"use client";

import { LiveIntelligencePanel } from "@/components/live/LiveIntelligencePanel";
import { LiveTranscriptPanel } from "@/components/live/LiveTranscriptPanel";
import { useAppStore } from "@/store/app-store";

export function LiveSessionClient() {
  const liveSession = useAppStore((state) => state.liveSession);
  const running = liveSession?.status === "live";
  const lines = liveSession?.transcript ?? [];

  return (
    <div className="space-y-4">
      <div className="text-xs text-[#9CA3AF]">
        {running ? "Live capture is active." : "No active live capture. Start a new session to stream."}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <LiveTranscriptPanel lines={lines} listening={running} />
        <LiveIntelligencePanel lines={lines} intelligence={liveSession?.intelligence} />
      </div>
    </div>
  );
}

import type { TranscriptLine } from "@/features/sessions/types/sessions.types";

type RealtimePayload = {
  speakerActivity: Array<{ label: string; value: number }>;
  timelineProgress: number;
  waveform: number[];
  line?: TranscriptLine;
};

const SCRIPT: Array<Pick<TranscriptLine, "speaker" | "text">> = [
  { speaker: "Judge", text: "Proceed with the next argument." },
  { speaker: "Counsel", text: "Submitting revised procedural schedule." },
  { speaker: "Clerk", text: "Schedule update marked in docket notes." },
];

export function createRealtimeSession(
  onMessage: (payload: RealtimePayload) => void,
): () => void {
  let index = 0;
  const timer = window.setInterval(() => {
    const waveform = Array.from({ length: 48 }).map((_, i) => 25 + ((i * (13 + index)) % 65));
    const timelineProgress = Math.min(0.98, 0.5 + index * 0.05);
    const nextLine = SCRIPT[index % SCRIPT.length];
    onMessage({
      waveform,
      timelineProgress,
      speakerActivity: [
        { label: "Judge", value: 40 + (index % 3) },
        { label: "Counsel", value: 34 + ((index + 1) % 3) },
        { label: "Clerk", value: 23 + ((index + 2) % 2) },
      ],
      line: {
        id: `live-${Date.now()}`,
        speaker: nextLine.speaker,
        text: nextLine.text,
        timestamp: new Date().toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
    });
    index += 1;
  }, 1600);

  return () => window.clearInterval(timer);
}

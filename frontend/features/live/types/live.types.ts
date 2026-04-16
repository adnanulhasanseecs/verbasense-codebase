import type { TranscriptLine } from "@/features/sessions/types/sessions.types";

export type LiveSession = {
  sessionId: string;
  courtroom: string;
  speaker: string;
  timelineProgress: number;
  durationLabel: string;
  speakerActivity: Array<{ label: string; value: number }>;
  waveform: number[];
  transcript: TranscriptLine[];
  status: "live" | "paused" | "stopped";
  inputDevice?: string;
  sampleRate?: number;
  chunkDurationMs?: number;
  intelligence?: {
    summary?: string;
    decisions?: string[];
    actions?: Array<{ text: string; owner?: string }>;
    entities?: Array<{ type: string; value: string }>;
    speaker_labels?: Record<string, string>;
    warning?: string;
  };
};

export type Speaker = {
  id: string;
  name: string;
  role: "judge" | "counsel" | "clerk" | "witness";
};

export type TranscriptLine = {
  id: string;
  speakerId?: string;
  speaker: string;
  text: string;
  timestamp: string;
};

export type Decision = {
  id: string;
  text: string;
};

export type Action = {
  id: string;
  text: string;
  owner?: string;
};

export type Document = {
  id: string;
  name: string;
  summary: string;
  type: "pdf" | "audio" | "evidence" | "notes";
  linkedSessionId: string;
  processingStatus: "queued" | "processing" | "completed" | "failed";
  entityCount: number;
};

export type Session = {
  id: string;
  name: string;
  judge: string;
  dateLabel: string;
  status: "processed" | "processing";
  transcript: TranscriptLine[];
  intelligence: {
    summary: string;
    decisions: Decision[];
    actions: Action[];
  };
  speakers: Speaker[];
  documents: Document[];
};

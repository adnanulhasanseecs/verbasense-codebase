export type TranscriptLine = {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
};

export type DocumentInsight = {
  summary: string;
  keyPoints: string[];
  referencedSections: string[];
  entities: {
    caseId: string;
    judge: string;
    parties: string[];
    evidence: string[];
    dates: string[];
  };
};

export const LIVE_SCRIPT: Omit<TranscriptLine, "id" | "timestamp">[] = [
  { speaker: "Judge", text: "Proceed with the next argument." },
  { speaker: "Counsel", text: "We submit Exhibit A and request admission." },
  { speaker: "Clerk", text: "Exhibit A marked and entered into record." },
  { speaker: "Judge", text: "Noted. Continue with witness examination." },
  { speaker: "Witness", text: "I confirm the timeline in the submitted report." },
  { speaker: "Counsel", text: "No further questions at this stage." },
];

export const MOCK_SESSION = {
  id: "SES-2026-1042",
  transcript: [
    { id: "1", speaker: "Judge", text: "Court is now in session.", timestamp: "09:42:10" },
    { id: "2", speaker: "Clerk", text: "Calling matter CR-2026-118.", timestamp: "09:42:44" },
    {
      id: "3",
      speaker: "Counsel",
      text: "Defense requests short continuance for supplemental filing.",
      timestamp: "09:44:12",
    },
    {
      id: "4",
      speaker: "Judge",
      text: "Continuance is granted for seven days. Order will follow.",
      timestamp: "09:44:58",
    },
  ] as TranscriptLine[],
  intelligence: {
    summary:
      "The court heard procedural submissions and granted a seven-day continuance for supplemental filings.",
    decisions: [
      "Continuance granted for seven days",
      "Exhibit list accepted for record",
      "Order to be issued by chambers",
    ],
    actions: [
      "Defense to submit supplemental filing by Friday",
      "Clerk to update docket notes",
    ],
  },
  documents: [
    { id: "DOC-11", name: "Motion for Continuance.pdf", summary: "Requests brief extension." },
    { id: "DOC-12", name: "Exhibit Index.pdf", summary: "Index of admitted exhibits." },
  ],
};

export type SessionRecord = {
  id: string;
  name: string;
  judge: string;
  dateLabel: string;
  status: "processed" | "processing";
  transcript: TranscriptLine[];
  intelligence: {
    summary: string;
    decisions: string[];
    actions: string[];
  };
  documents: { id: string; name: string; summary: string }[];
};

export const MOCK_SESSIONS: SessionRecord[] = [
  {
    id: "SES-2026-1042",
    name: "Hon. Avery Cole - 2026-04-06",
    judge: "Hon. Avery Cole",
    dateLabel: "2026-04-06 10:42",
    status: "processed",
    transcript: MOCK_SESSION.transcript,
    intelligence: MOCK_SESSION.intelligence,
    documents: MOCK_SESSION.documents,
  },
  {
    id: "SES-2026-1039",
    name: "Hon. Rina Matthews - 2026-04-05",
    judge: "Hon. Rina Matthews",
    dateLabel: "2026-04-05 16:12",
    status: "processed",
    transcript: [
      { id: "1", speaker: "Judge", text: "Proceed with witness statements.", timestamp: "16:12:14" },
      { id: "2", speaker: "Counsel", text: "Submitting timeline addendum.", timestamp: "16:13:05" },
    ],
    intelligence: {
      summary: "Witness sequence was recorded and a timeline addendum was submitted.",
      decisions: ["Witness order approved", "Timeline addendum accepted"],
      actions: ["Clerk to circulate notes", "Counsel to upload signed annex"],
    },
    documents: [{ id: "DOC-31", name: "Timeline Addendum.pdf", summary: "Updated chronology." }],
  },
  {
    id: "SES-2026-1043",
    name: "Hon. Diego Marin - 2026-04-06",
    judge: "Hon. Diego Marin",
    dateLabel: "2026-04-06 11:05",
    status: "processing",
    transcript: [
      { id: "1", speaker: "Judge", text: "Hearing resumed for procedural updates.", timestamp: "11:05:20" },
    ],
    intelligence: {
      summary: "Session is in process. Intelligence updates will appear when processing completes.",
      decisions: [],
      actions: [],
    },
    documents: [],
  },
];

export function mockDocumentInsight(fileName: string): DocumentInsight {
  return {
    summary: `Document ${fileName} reviewed. The filing references a procedural continuance and admissibility of evidence.`,
    keyPoints: [
      "Motion requests short extension for supplemental arguments",
      "References Exhibit A and Exhibit C as supporting artifacts",
      "Mentions prior hearing order dated 2026-03-14",
    ],
    referencedSections: ["Section 2.1", "Section 4.3", "Appendix B"],
    entities: {
      caseId: "CR-2026-118",
      judge: "Hon. Avery Cole",
      parties: ["State", "R. Morales"],
      evidence: ["Exhibit A", "Exhibit C"],
      dates: ["2026-03-14", "2026-04-06"],
    },
  };
}

export function nowTime(): string {
  const d = new Date();
  return d.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export type SessionStatus = "Processed" | "Processing" | "Pending";

export type SessionRow = {
  id: string;
  caseId: string;
  date: string;
  duration: string;
  status: SessionStatus;
};

export const DASHBOARD_KPIS = [
  { title: "Active Sessions", value: "2" },
  { title: "Sessions Today", value: "14" },
  { title: "Documents Processed", value: "31" },
  { title: "Pending Actions", value: "6" },
] as const;

export const LIVE_STATE = {
  active: true,
  room: "Courtroom A",
  detail: "Judge speaking...",
};

export const ACTIVITY_ITEMS = [
  "Session completed - CR-2026-114",
  "Document processed - Evidence.pdf",
  "Processing in progress - CR-2026-118",
  "Action pending - Submit judgment notes",
];

export const SESSION_ROWS: SessionRow[] = [
  { id: "SES-2026-1042", caseId: "CR-2026-118", date: "2026-04-06", duration: "42m", status: "Processed" },
  { id: "SES-2026-1043", caseId: "CR-2026-119", date: "2026-04-06", duration: "31m", status: "Processing" },
  { id: "SES-2026-1044", caseId: "CR-2026-120", date: "2026-04-06", duration: "18m", status: "Pending" },
  { id: "SES-2026-1045", caseId: "CR-2026-121", date: "2026-04-05", duration: "56m", status: "Processed" },
];

export const DOCUMENTS = [
  { name: "CaseFile_SC102.pdf", status: "Processed" },
  { name: "Evidence.pdf", status: "Processing" },
  { name: "Submission.docx", status: "Pending" },
];

export const INTELLIGENCE = {
  summary: "Two hearings progressed to decision draft stage. One matter remains in intake.",
  decisions: ["Adjourned CR-2026-119", "Accepted Exhibit A", "Set hearing date for CR-2026-120"],
  pending: ["Review forensic annex", "Approve docket updates"],
};

export const PENDING_ACTIONS = [
  "Submit judgment",
  "Review evidence",
  "Schedule hearing",
  "Sign transcript certification",
];

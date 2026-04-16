import type { Document } from "@/features/sessions/types/sessions.types";

export type DocumentsResponse = Document[];

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

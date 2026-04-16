export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Job {
  id: string;
  status: JobStatus;
  stage: string;
  progress: number;
  domain: string;
  error?: { code: string; message: string };
}

export interface TranscriptSegment {
  speaker: string;
  text: string;
  start_ms?: number | null;
  end_ms?: number | null;
}

export interface ActionItem {
  text: string;
  owner?: string | null;
  priority?: string | null;
}

export interface Entity {
  type: string;
  value: string;
}

export interface OutputSchema {
  transcript: TranscriptSegment[];
  summary: string;
  key_decisions: string[];
  actions: ActionItem[];
  entities: Entity[];
  schema_version: string;
}

export interface ResultEnvelope {
  job_id: string;
  domain: string;
  output: OutputSchema;
}

export interface DomainConfig {
  id: string;
  domain: string;
  features: string[];
  ui: {
    name: string;
    labels: { summary: string; actions: string; decisions: string };
  };
  pipeline: { stages: string[] };
  entities: string[];
}

export type AuthUser = {
  user_id: string;
  account_id: string;
  email: string;
  name: string;
  role: "admin" | "judge" | "clerk" | "viewer";
  active: boolean;
  profile_image_url?: string | null;
};

export type UserRole = AuthUser["role"];

export type AdminUser = {
  user_id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
};

export type AccountSettings = {
  account_id: string;
  provider: string;
  model: string;
  fallback_providers: string[];
  provider_by_domain: Record<string, string>;
  model_by_domain: Record<string, string>;
};

export type AiConnections = {
  asr_provider: string;
  asr_model: string;
  asr_base_url: string;
  asr_timeout_seconds?: number | null;
  deployment_mode: "cloud" | "self-hosted" | "on-prem";
  document_llm_provider: string;
  document_llm_model_name: string;
  document_llm_model_value: string;
  transcription_llm_model_name: string;
  transcription_llm_model_value: string;
  document_llm_base_url: string;
  has_asr_api_key: boolean;
  has_document_llm_api_key: boolean;
};

export type DocumentInsightResult = {
  summary: string;
  key_points: string[];
  referenced_sections: string[];
  entities: {
    case_id: string;
    judge: string;
    parties: string[];
    evidence: string[];
    dates: string[];
  };
  provider: string;
  model: string;
  prompt_used: string;
};

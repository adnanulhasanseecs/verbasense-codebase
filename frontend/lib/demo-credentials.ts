/**
 * Demo personas for CourtSense — informational only (no auth/RBAC in this build).
 */

export interface DemoCredential {
  id: string;
  role: string;
  subtitle: string;
  email: string;
  password: string;
  scope: string;
  accent: "sky" | "violet" | "cyan" | "amber";
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    id: "admin",
    role: "Court Administrator",
    subtitle: "Operations & tenant configuration",
    email: "admin@courtsense.demo",
    password: "VerbaSense-Demo-2026",
    scope: "Full console access (future RBAC)",
    accent: "violet",
  },
  {
    id: "judge",
    role: "Presiding Judge",
    subtitle: "Chambers & hearing oversight",
    email: "judge@courtsense.demo",
    password: "VerbaSense-Demo-2026",
    scope: "Proceedings, orders, sealed views (future)",
    accent: "sky",
  },
  {
    id: "clerk",
    role: "Clerk of Court",
    subtitle: "Docketing & records",
    email: "clerk@courtsense.demo",
    password: "VerbaSense-Demo-2026",
    scope: "Filings, scheduling, public records (future)",
    accent: "cyan",
  },
  {
    id: "counsel",
    role: "Counsel (Observer)",
    subtitle: "Read-only matter visibility",
    email: "counsel@courtsense.demo",
    password: "VerbaSense-Demo-2026",
    scope: "Transcripts & summaries for assigned cases (future)",
    accent: "amber",
  },
];

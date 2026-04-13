export type NavLinkKey = "dashboard" | "live" | "upload" | "documents" | "sessions";

export const APP_NAV_LINKS: ReadonlyArray<{
  href: string;
  label: string;
  key: NavLinkKey;
}> = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/live", label: "Live Session", key: "live" },
  { href: "/transcribe", label: "Transcribe", key: "upload" },
  { href: "/documents", label: "Documents", key: "documents" },
  { href: "/sessions", label: "Sessions", key: "sessions" },
];

export type NavLinkItem = (typeof APP_NAV_LINKS)[number];

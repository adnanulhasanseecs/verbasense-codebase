import type { RoutePolicy } from "@/features/rbac/types/rbac.types";

export const ROUTE_POLICIES: RoutePolicy[] = [
  { pathPrefix: "/rbac", roles: ["admin"] },
  { pathPrefix: "/admin", roles: ["admin"] },
  { pathPrefix: "/upload", roles: ["admin", "clerk"] },
  { pathPrefix: "/transcribe", roles: ["admin", "clerk"] },
];

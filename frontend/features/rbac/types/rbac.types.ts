import type { UserRole } from "@/lib/auth/roles";

export type RoutePolicy = {
  pathPrefix: string;
  roles: UserRole[];
};

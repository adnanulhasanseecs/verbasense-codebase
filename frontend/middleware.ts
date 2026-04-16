import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isUserRole } from "@/lib/auth/roles";

const ROUTE_ACCESS: Array<{ prefix: string; roles: Array<"admin" | "judge" | "clerk" | "viewer"> }> = [
  { prefix: "/rbac", roles: ["admin"] },
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/upload", roles: ["admin", "clerk"] },
  { prefix: "/transcribe", roles: ["admin", "clerk"] },
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const policy = ROUTE_ACCESS.find((entry) => pathname.startsWith(entry.prefix));
  if (!policy) return NextResponse.next();

  const roleCookie = request.cookies.get("verbasense.role")?.value ?? "";
  if (!isUserRole(roleCookie) || !policy.roles.includes(roleCookie)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/rbac/:path*", "/admin/:path*", "/upload/:path*", "/transcribe/:path*"],
};

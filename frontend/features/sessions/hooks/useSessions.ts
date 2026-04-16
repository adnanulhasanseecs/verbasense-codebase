"use client";

import { useQuery } from "@tanstack/react-query";
import { getSessions } from "@/features/sessions/api/sessions.api";

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: getSessions,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getLiveSession } from "@/features/live/api/live.api";

export function useLiveSession() {
  return useQuery({
    queryKey: ["live-session"],
    queryFn: getLiveSession,
    refetchInterval: 3000,
  });
}

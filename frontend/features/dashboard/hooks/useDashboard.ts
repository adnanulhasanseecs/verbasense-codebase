"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/features/dashboard/api/dashboard.api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });
}

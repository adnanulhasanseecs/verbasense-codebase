"use client";

import { useQuery } from "@tanstack/react-query";
import { getDocuments } from "@/features/documents/api/documents.api";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });
}

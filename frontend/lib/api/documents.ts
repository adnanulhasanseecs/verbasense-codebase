import type { Document } from "@/features/sessions/types/sessions.types";
import { authHeaders, getBaseUrl, parseJson } from "@/lib/api/client";

export async function getDocuments(): Promise<Document[]> {
  const response = await fetch(`${getBaseUrl()}/api/v1/documents`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Documents fetch failed (${response.status})`);
  return parseJson<Document[]>(response);
}

export async function uploadDocument(file: File): Promise<{ id: string; name: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${getBaseUrl()}/api/v1/upload`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!response.ok) throw new Error(`Document upload failed (${response.status})`);
  const out = await parseJson<{ id: string }>(response);
  return { id: out.id, name: file.name };
}

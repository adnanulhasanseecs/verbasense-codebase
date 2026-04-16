"use client";

import { PageHeader } from "@/components/PageHeader";
import { DocumentsClient } from "@/components/documents/DocumentsClient";
import { useDocuments } from "@/features/documents/hooks/useDocuments";

export function DocumentsPageContent() {
  const { data, isLoading, isError, refetch } = useDocuments();

  if (isLoading) {
    return <div className="h-56 animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06]" />;
  }
  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100">
        Failed to load documents.
        <button type="button" onClick={() => refetch()} className="ml-3 rounded-lg border border-white/20 px-2 py-1 text-xs hover:bg-white/10">
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title="Document Intelligence"
        description="Upload and process linked legal documents."
        breadcrumbs={[{ label: "Dashboard" }, { label: "Documents" }, { label: "Processing" }]}
      />
      {!data?.length ? (
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-4 text-sm text-[#9CA3AF]">No documents uploaded yet.</div>
      ) : null}
      <DocumentsClient />
    </section>
  );
}

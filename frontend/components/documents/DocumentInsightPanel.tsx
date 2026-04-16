import type { DocumentInsight } from "@/features/documents/types/documents.types";

export function DocumentInsightPanel({
  insight,
  loading,
}: {
  insight: DocumentInsight | null;
  loading: boolean;
}) {
  return (
    <section className="space-y-4">
      <Card title="Document Summary">
        {loading ? "Extracting summary..." : insight?.summary ?? "Upload a document to begin extraction."}
      </Card>

      <Card title="Extracted Entities">
        {loading || !insight ? (
          "Waiting for extraction..."
        ) : (
          <ul className="space-y-1 text-sm">
            <li>Case ID: {insight.entities.caseId}</li>
            <li>Judge: {insight.entities.judge}</li>
            <li>Parties: {insight.entities.parties.join(", ")}</li>
            <li>Evidence: {insight.entities.evidence.join(", ")}</li>
            <li>Dates: {insight.entities.dates.join(", ")}</li>
          </ul>
        )}
      </Card>

      <Card title="Key Points">
        <ul className="list-disc space-y-1 pl-5">
          {(insight?.keyPoints ?? ["No key points yet."]).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Card>

      <Card title="Referenced Sections">
        <ul className="space-y-2">
          {(insight?.referencedSections ?? ["No referenced sections."]).map((r) => (
            <li key={r} className="rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2 text-sm">
              {r}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="vs-card-glow rounded-3xl border border-white/[0.08] bg-[#121826]/85 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-[#E5E7EB]">{children}</div>
    </article>
  );
}


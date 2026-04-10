import { render, screen } from "@testing-library/react";
import { DocumentInsightPanel } from "@/components/documents/DocumentInsightPanel";

describe("DocumentInsightPanel", () => {
  it("renders extracted intelligence cards", () => {
    render(
      <DocumentInsightPanel
        loading={false}
        insight={{
          summary: "Summary text",
          keyPoints: ["Point A"],
          referencedSections: ["Section 1.2"],
          entities: {
            caseId: "CR-101",
            judge: "Hon. Avery Cole",
            parties: ["State", "Defendant"],
            evidence: ["Exhibit A"],
            dates: ["2026-04-06"],
          },
        }}
      />,
    );

    expect(screen.getByText("Summary text")).toBeInTheDocument();
    expect(screen.getByText("Case ID: CR-101")).toBeInTheDocument();
    expect(screen.getByText("Point A")).toBeInTheDocument();
  });
});

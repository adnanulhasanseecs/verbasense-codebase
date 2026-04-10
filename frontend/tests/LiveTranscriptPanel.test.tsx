import { render, screen } from "@testing-library/react";
import { LiveTranscriptPanel } from "@/components/live/LiveTranscriptPanel";

describe("LiveTranscriptPanel", () => {
  it("renders streamed transcript lines", () => {
    render(
      <LiveTranscriptPanel
        listening={true}
        lines={[
          { id: "1", speaker: "Judge", text: "Proceed with next argument", timestamp: "10:11:12" },
          { id: "2", speaker: "Lawyer", text: "We submit evidence", timestamp: "10:11:18" },
        ]}
      />,
    );

    expect(screen.getByText("Judge")).toBeInTheDocument();
    expect(screen.getByText("We submit evidence")).toBeInTheDocument();
    expect(screen.getByText("listening")).toBeInTheDocument();
  });
});

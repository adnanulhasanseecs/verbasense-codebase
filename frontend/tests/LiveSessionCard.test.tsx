import { render, screen } from "@testing-library/react";
import { LiveSessionCard } from "@/components/dashboard/LiveSessionCard";

describe("LiveSessionCard", () => {
  it("renders active live session state", () => {
    render(<LiveSessionCard active={true} room="Courtroom A" detail="Judge speaking..." />);

    expect(screen.getByText(/LIVE - Courtroom A/i)).toBeInTheDocument();
    expect(screen.getByText("Join Live View")).toBeInTheDocument();
  });

  it("renders inactive state", () => {
    render(<LiveSessionCard active={false} />);

    expect(screen.getByText(/No active session/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Live Session/i)).toBeInTheDocument();
  });
});

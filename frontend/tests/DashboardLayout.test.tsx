import { render, screen } from "@testing-library/react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RoleProvider } from "@/components/rbac/RoleContext";

describe("DashboardLayout", () => {
  it("renders analytics dashboard for admin role", () => {
    render(
      <RoleProvider initialRole="admin">
        <DashboardLayout />
      </RoleProvider>,
    );

    expect(screen.getByText("Active Sessions")).toBeInTheDocument();
    expect(screen.getByText("Pending Actions Timeline")).toBeInTheDocument();
    expect(screen.getByText(/for admin operations/i)).toBeInTheDocument();
  });

  it("renders judge-specific intelligence label", () => {
    render(
      <RoleProvider initialRole="judge">
        <DashboardLayout />
      </RoleProvider>,
    );

    expect(screen.getByText("Sessions Analytics")).toBeInTheDocument();
    expect(screen.getByText(/for judge operations/i)).toBeInTheDocument();
  });

  it("renders viewer-specific intelligence label", () => {
    render(
      <RoleProvider initialRole="viewer">
        <DashboardLayout />
      </RoleProvider>,
    );

    expect(screen.getByText("Document Distribution")).toBeInTheDocument();
    expect(screen.getByText(/for viewer operations/i)).toBeInTheDocument();
  });
});

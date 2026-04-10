import { render, screen } from "@testing-library/react";
import { RoleGuard } from "@/components/rbac/RoleGuard";
import { RoleProvider } from "@/components/rbac/RoleContext";

describe("RoleGuard", () => {
  it("renders content for allowed role", () => {
    render(
      <RoleProvider initialRole="admin">
        <RoleGuard roles={["admin"]}>Visible for admin</RoleGuard>
      </RoleProvider>,
    );
    expect(screen.getByText("Visible for admin")).toBeInTheDocument();
  });

  it("hides content for disallowed role", () => {
    render(
      <RoleProvider initialRole="viewer">
        <RoleGuard roles={["admin"]}>Hidden for viewer</RoleGuard>
      </RoleProvider>,
    );
    expect(screen.queryByText("Hidden for viewer")).not.toBeInTheDocument();
  });
});

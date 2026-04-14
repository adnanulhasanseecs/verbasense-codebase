import {
  clearAuth,
  createInvite,
  getAuthToken,
  listAdminUsers,
  login,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "@/lib/api";

describe("admin/auth API client", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("stores token on login", async () => {
    const fetchMock = jest.spyOn(global, "fetch" as never).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "abc",
          user: {
            user_id: "u1",
            account_id: "a1",
            email: "admin@verbasense.local",
            name: "Admin",
            role: "admin",
            active: true,
          },
        }),
    } as Response);

    await login("admin@verbasense.local", "Admin");
    expect(getAuthToken()).toBe("abc");
    fetchMock.mockRestore();
  });

  it("sends auth header for admin endpoints", async () => {
    localStorage.setItem("verbasense.authToken", "token-123");
    const fetchMock = jest.spyOn(global, "fetch" as never).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as Response);

    await listAdminUsers();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/admin/users"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token-123" }),
      }),
    );
    fetchMock.mockRestore();
  });

  it("calls invite/role/status mutation endpoints", async () => {
    localStorage.setItem("verbasense.authToken", "token-123");
    const fetchMock = jest.spyOn(global, "fetch" as never).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ invite_code: "code1" }),
    } as Response);

    await createInvite("x@y.com", "viewer");
    await updateAdminUserRole("u1", "judge");
    await updateAdminUserStatus("u1", false);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    clearAuth();
    fetchMock.mockRestore();
  });
});

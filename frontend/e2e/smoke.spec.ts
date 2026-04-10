import { expect, test } from "@playwright/test";

test.describe("CourtSense demo smoke", () => {
  test("dashboard loads", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Command center for hearings/i }),
    ).toBeVisible();
  });

  test("upload page loads", async ({ page }) => {
    await page.goto("/upload");
    await expect(page.getByRole("heading", { name: /Upload audio/i })).toBeVisible();
  });
});

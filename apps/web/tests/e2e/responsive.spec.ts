import { expect, test } from "@playwright/test";

test.describe("responsive flows", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile nav + core pages remain usable", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("link", { name: "Runs", exact: true })).toBeVisible();

    const seed = await page.request.post("/api/demo/seed");
    expect(seed.ok()).toBeTruthy();

    await page.goto("/runs");
    await expect(page.getByRole("heading", { name: "Runs" })).toBeVisible();
    await expect(page.getByLabel("Search runs")).toBeVisible();

    await page.goto("/compare");
    await expect(page.getByRole("button", { name: "Compare" })).toBeVisible();

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });
});

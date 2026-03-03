import { expect, test } from "@playwright/test";

test("runs filters and saved views persist", async ({ page }) => {
  const seed = await page.request.post("/api/demo/seed");
  expect(seed.ok()).toBeTruthy();

  await page.goto("/runs");
  await expect(page.getByRole("heading", { name: "Runs" })).toBeVisible();

  await page.getByRole("textbox", { name: "Tool" }).fill("pricing.lookup");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("pricing.lookup").first()).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept("pricing-view"));
  await page.getByRole("button", { name: "Save view" }).click();

  await page.reload();
  await page.getByLabel("Saved views").selectOption({ label: "pricing-view" });
  await expect(page.getByRole("textbox", { name: "Tool" })).toHaveValue("pricing.lookup");
});

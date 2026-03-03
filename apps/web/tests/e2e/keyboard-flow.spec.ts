import { expect, test } from "@playwright/test";

test("keyboard workflow covers J/K/Enter/F", async ({ page }) => {
  const seed = await page.request.post("/api/demo/seed");
  expect(seed.ok()).toBeTruthy();

  await page.goto("/runs/run_demo_fail");
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();

  await page.keyboard.press("j");
  await page.keyboard.press("j");
  await page.keyboard.press("k");

  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Rendered" })).toBeVisible();

  await page.keyboard.press("f");
  await expect(page.getByTestId("fork-modal")).toBeVisible();

  await page.keyboard.press("Escape");
  const modal = page.getByTestId("fork-modal");
  if (await modal.isVisible()) {
    await page.getByRole("button", { name: "Cancel" }).click();
  }
  await expect(page.getByTestId("fork-modal")).toBeHidden();
});

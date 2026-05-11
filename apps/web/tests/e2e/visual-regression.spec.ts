import { expect, type Page, test } from "@playwright/test";

const NAV_TIMEOUT_MS = 30_000;

async function prepareVisualSnapshot(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      [data-nextjs-dialog],
      [data-nextjs-dev-overlay] {
        display: none !important;
      }
    `,
  });
}

async function resetVisualData(page: Page): Promise<void> {
  const reset = await page.request.post("/api/settings/delete-all");
  expect(reset.ok()).toBeTruthy();
}

async function seedVisualData(page: Page): Promise<void> {
  await resetVisualData(page);
  const seed = await page.request.post("/api/demo/seed");
  expect(seed.ok()).toBeTruthy();
}

test.describe("visual regression", () => {
  test("landing snapshot", async ({ page }) => {
    await resetVisualData(page);
    await page.goto("/");
    await prepareVisualSnapshot(page);
    await expect(page).toHaveScreenshot("landing.png", { fullPage: true });
  });

  test("runs snapshot", async ({ page }) => {
    await seedVisualData(page);
    await page.goto("/runs");
    await expect(page).toHaveURL(/\/runs/, { timeout: NAV_TIMEOUT_MS });
    await prepareVisualSnapshot(page);
    await expect(page).toHaveScreenshot("runs.png", { fullPage: true });
  });

  test("compare snapshot", async ({ page }) => {
    await seedVisualData(page);

    const branchRes = await page.request.post("/api/branches", {
      data: {
        parentRunId: "run_demo_fail",
        forkEventId: "e0004",
        mode: "replay",
        intervention: {
          kind: "tool_output_override",
          callId: "c_pricing_1",
          result: { product: "ACME Widget", price: 100.0, currency: "USD", as_of: "2026-02-27" },
        },
      },
    });
    expect(branchRes.ok()).toBeTruthy();
    const branch = (await branchRes.json()) as { branchRunId?: string };
    expect(branch.branchRunId).toBeTruthy();

    await page.goto(`/compare?parent=run_demo_fail&branch=${branch.branchRunId}`);
    await page.getByRole("button", { name: "Compare" }).click();
    await prepareVisualSnapshot(page);
    await expect(page.getByRole("heading", { name: "Changed events" })).toBeVisible({
      timeout: NAV_TIMEOUT_MS,
    });
    await expect(page).toHaveScreenshot("compare.png", { fullPage: true });
  });
});

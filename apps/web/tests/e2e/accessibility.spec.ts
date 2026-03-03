import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const NAV_TIMEOUT_MS = 30_000;

type AxeLiteResult = {
  violations: Array<{ impact?: string | null }>;
};

function blockingViolations(results: AxeLiteResult): Array<{ impact?: string | null }> {
  return results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
}

test("landing page has no critical a11y violations", async ({ page }) => {
  await page.goto("/");
  const results = (await new AxeBuilder({ page }).analyze()) as AxeLiteResult;
  const blocking = blockingViolations(results);
  expect(blocking, JSON.stringify(blocking, null, 2)).toHaveLength(0);
});

test("runs page has no critical a11y violations", async ({ page }) => {
  const seed = await page.request.post("/api/demo/seed");
  expect(seed.ok()).toBeTruthy();
  await page.goto("/runs");
  await expect(page).toHaveURL(/\/runs/, { timeout: NAV_TIMEOUT_MS });

  const results = (await new AxeBuilder({ page }).analyze()) as AxeLiteResult;
  const blocking = blockingViolations(results);
  expect(blocking, JSON.stringify(blocking, null, 2)).toHaveLength(0);
});

test("compare and policy pages have no blocking a11y violations", async ({ page }) => {
  const seed = await page.request.post("/api/demo/seed");
  expect(seed.ok()).toBeTruthy();

  await page.goto("/compare");
  const compareResults = (await new AxeBuilder({ page }).analyze()) as AxeLiteResult;
  expect(blockingViolations(compareResults), JSON.stringify(compareResults.violations, null, 2)).toHaveLength(0);

  await page.goto("/policy");
  const policyResults = (await new AxeBuilder({ page }).analyze()) as AxeLiteResult;
  expect(blockingViolations(policyResults), JSON.stringify(policyResults.violations, null, 2)).toHaveLength(0);
});

test("modal states remain free of blocking a11y violations", async ({ page }) => {
  const seed = await page.request.post("/api/demo/seed");
  expect(seed.ok()).toBeTruthy();

  await page.goto("/runs/run_demo_fail");
  await page.getByRole("button", { name: "Fork from selected (F)" }).click();
  await expect(page.getByTestId("fork-modal")).toBeVisible();

  const modalResults = (await new AxeBuilder({ page }).analyze()) as AxeLiteResult;
  expect(blockingViolations(modalResults), JSON.stringify(modalResults.violations, null, 2)).toHaveLength(0);
});

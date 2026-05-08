import { expect, test } from "@playwright/test";

const NAV_TIMEOUT_MS = 30_000;

test("golden ui flow: replay -> fork -> compare -> policy", async ({ page }) => {
  await page.goto("/");

  const seed = await page.request.post("/api/demo/seed");
  expect(seed.ok()).toBeTruthy();
  const seedPayload = (await seed.json()) as {
    imported: Array<{ path: string; runId: string }>;
  };
  const failRunId = seedPayload.imported.find((entry) => entry.path.includes("demo_run_fail"))?.runId;
  expect(failRunId).toBeTruthy();
  await page.goto(`/runs/${failRunId}`);
  await expect(page).toHaveURL(/\/runs\/.+/, { timeout: NAV_TIMEOUT_MS });

  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await page.getByTestId("timeline-event-e0004").click();
  await page.keyboard.press("f");

  await expect(page.getByTestId("fork-modal")).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await page.getByTestId("fork-kind").selectOption("tool_output_override");
  await page.getByTestId("fork-result-json").fill(
    '{"product":"ACME Widget","price":100.0,"currency":"USD","as_of":"2026-02-27"}',
  );
  await page.getByTestId("fork-create-button").click();

  const compareLink = page.getByTestId("compare-link");
  await expect(compareLink).toBeVisible();
  await compareLink.click();

  await page.getByRole("button", { name: "Compare" }).click();
  await expect(page.getByRole("heading", { name: "Changed events" })).toBeVisible({
    timeout: NAV_TIMEOUT_MS,
  });
  await expect(page.getByRole("heading", { name: "Canonical evidence summary" })).toBeVisible({
    timeout: NAV_TIMEOUT_MS,
  });

  await page.goto("/policy");
  await expect(page.getByRole("heading", { name: "Policy Lab" })).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await page.getByRole("button", { name: "Save policy version" }).click();
  await expect(page.getByText("Policy saved")).toBeVisible();

  const policySelect = page.getByLabel("Policy version");
  await policySelect.selectOption({ index: 1 });

  const runChecks = page.locator('input[type="checkbox"]');
  await runChecks.first().check();
  const asyncCheckbox = page.getByLabel("Run asynchronously with progress");
  if (await asyncCheckbox.isChecked()) {
    await asyncCheckbox.uncheck();
  }
  const runButton = page.getByRole("button", { name: "Run on selected traces" });
  await expect(runButton).toBeEnabled({ timeout: NAV_TIMEOUT_MS });
  await runButton.click();
  await expect(page.locator("div.subtle.mono").filter({ hasText: /violations=/ })).toBeVisible();
});

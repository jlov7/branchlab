import { expect, test } from "@playwright/test";

test("trace payload text is never executed as script", async ({ page }) => {
  const seed = await page.request.post("/api/demo/seed");
  expect(seed.ok()).toBeTruthy();

  const branchRes = await page.request.post("/api/branches", {
    data: {
      parentRunId: "run_demo_fail",
      forkEventId: "e0004",
      mode: "replay",
      intervention: {
        kind: "tool_output_override",
        callId: "c_pricing_1",
        result: {
          product: "<script>window.__branchlab_xss = 1</script>",
          price: 100,
          currency: "USD",
          as_of: "2026-02-27",
        },
      },
    },
  });
  expect(branchRes.ok()).toBeTruthy();
  const branch = (await branchRes.json()) as { branchRunId: string };

  await page.goto(`/runs/${branch.branchRunId}`);
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();

  const executed = await page.evaluate(() => (window as { __branchlab_xss?: number }).__branchlab_xss ?? 0);
  expect(executed).toBe(0);
});

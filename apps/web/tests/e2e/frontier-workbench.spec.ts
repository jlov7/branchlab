import { expect, test } from "@playwright/test";

const NAV_TIMEOUT_MS = 30_000;

test("frontier workbench: causality, evals, runtime, evidence", async ({ page }) => {
  const seed = await page.request.post("/api/demo/seed");
  expect(seed.ok()).toBeTruthy();

  const asyncImport = await page.request.post("/api/runs/import", {
    multipart: {
      async: "1",
      file: {
        name: "async_import.jsonl",
        mimeType: "application/jsonl",
        buffer: Buffer.from(
          `${JSON.stringify({
            schema: "branchlab.trace.v1",
            run_id: "run_async_import",
            event_id: "async_1",
            ts: "2026-05-08T00:00:00Z",
            type: "run.start",
            data: {},
          })}\n`,
        ),
      },
    },
  });
  expect(asyncImport.status()).toBe(202);
  const asyncPayload = (await asyncImport.json()) as { jobId?: string };
  expect(asyncPayload.jobId).toBeTruthy();
  let asyncStatus = "";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const jobRes = await page.request.get(`/api/jobs/${asyncPayload.jobId}`);
    const jobPayload = (await jobRes.json()) as { job?: { status: string } };
    asyncStatus = jobPayload.job?.status ?? "";
    if (asyncStatus === "succeeded") {
      break;
    }
    await page.waitForTimeout(200);
  }
  expect(asyncStatus).toBe("succeeded");

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

  await page.goto("/causality");
  await expect(page.getByRole("heading", { name: "Trace graph, fingerprints, and divergence candidates" })).toBeVisible({
    timeout: NAV_TIMEOUT_MS,
  });
  await page.getByLabel("Branch run ID").fill(branch.branchRunId!);
  await page.getByRole("button", { name: "Load causality" }).click();
  await expect(page.getByText(/First divergence:/)).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await expect(page.getByText("Trace physics evidence")).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: "Top causal candidates" })).toBeVisible();
  await page.getByRole("button", { name: /Select span/ }).first().click();
  await expect(page.getByText("Selected pin")).toBeVisible();
  await page.getByRole("textbox", { name: "Investigation title" }).fill("Pricing evidence hypothesis");
  await page.getByRole("textbox", { name: "Hypothesis", exact: true }).fill("The divergent tool result explains the final quote.");
  await page.getByRole("button", { name: "Save investigation" }).click();
  await expect(page.getByText("Investigation saved")).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await expect(page.getByText("Pricing evidence hypothesis").first()).toBeVisible();
  await page.getByRole("button", { name: "Resolve Pricing evidence hypothesis" }).click();
  await expect(page.getByText("Investigation marked resolved")).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await expect(page.getByText("resolved").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Investigation filters" })).toBeVisible();
  await page.getByRole("button", { name: /resolved 1/ }).click();
  await expect(page.getByText("Pricing evidence hypothesis").first()).toBeVisible();
  await page.getByRole("button", { name: "Select investigation Pricing evidence hypothesis" }).click();
  await expect(page.getByText("Selected investigation")).toBeVisible();
  await page.getByRole("button", { name: "Use first pin" }).click();
  await expect(page.getByText("Selected pin")).toBeVisible();
  await page.getByLabel("Note").fill("Reviewed selected span as the causal intervention point.");
  await page.getByRole("button", { name: "Save span annotation" }).click();
  await expect(page.getByText("Span annotation saved")).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await expect(page.getByText("Reviewed selected span as the causal intervention point.")).toBeVisible();
  await page.getByRole("button", { name: "Selected span" }).click();
  await expect(page.getByText("Reviewed selected span as the causal intervention point.")).toBeVisible();

  await page.goto("/evals");
  await expect(page.getByRole("heading", { name: "Local regression gates from real traces" })).toBeVisible({
    timeout: NAV_TIMEOUT_MS,
  });
  await page.getByRole("button", { name: "Create from runs" }).click();
  await expect(page.getByText("Dataset created")).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await page.getByRole("button", { name: "Run gate" }).click();
  await expect(page.getByText("Eval run complete")).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await expect(page.getByText(/cases/).first()).toBeVisible();

  await page.goto("/runtime");
  await expect(page.getByRole("heading", { name: "Re-execution, budgets, and side-effect evidence" })).toBeVisible({
    timeout: NAV_TIMEOUT_MS,
  });
  await expect(page.getByText(branch.branchRunId!)).toBeVisible({ timeout: NAV_TIMEOUT_MS });

  await page.goto("/evidence");
  await expect(page.getByRole("heading", { name: "Redacted exports with provenance hashes" })).toBeVisible({
    timeout: NAV_TIMEOUT_MS,
  });
  await expect(page.getByText("Trace physics summary")).toBeVisible();
  await expect(page.getByText("Investigation ledger")).toBeVisible();
  await expect(page.getByText("Span annotations")).toBeVisible();
  await page.getByLabel("Branch run ID").fill(branch.branchRunId!);
  await page.getByRole("button", { name: "Create redacted evidence pack" }).click();
  await expect(page.getByText("Evidence pack exported")).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await expect(page.getByText("trace physics", { exact: true })).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await expect(page.getByText(/investigations 1/)).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await expect(page.getByText(/span notes 1/)).toBeVisible({ timeout: NAV_TIMEOUT_MS });
  await expect(page.getByText(branch.branchRunId!)).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Recent large-trace jobs" })).toBeVisible({
    timeout: NAV_TIMEOUT_MS,
  });
  await expect(page.getByText("async_import.jsonl")).toBeVisible();
});

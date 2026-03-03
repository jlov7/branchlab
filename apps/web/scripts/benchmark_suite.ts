import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compareRunsById } from "@/lib/compareService";
import { REPO_ROOT } from "@/lib/paths";
import { evaluatePolicy, savePolicy } from "@/lib/policyService";
import { resetAllData, saveRun } from "@/lib/runsRepo";
import type { NormalizedEvent } from "@branchlab/core";

async function run(): Promise<void> {
  resetAllData();

  const failRunEvents: NormalizedEvent[] = [
    {
      schema: "branchlab.trace.v1",
      run_id: "run_bench_fail",
      event_id: "e1",
      ts: "2026-02-27T00:00:00Z",
      type: "run.start",
      data: {},
    },
    {
      schema: "branchlab.trace.v1",
      run_id: "run_bench_fail",
      event_id: "e2",
      ts: "2026-02-27T00:00:01Z",
      type: "tool.request",
      data: { call_id: "c1", tool: "browser.open", args: { url: "https://example.com" } },
    },
    {
      schema: "branchlab.trace.v1",
      run_id: "run_bench_fail",
      event_id: "e3",
      ts: "2026-02-27T00:00:02Z",
      type: "tool.response",
      data: { call_id: "c1", tool: "browser.open", error: "blocked" },
    },
    {
      schema: "branchlab.trace.v1",
      run_id: "run_bench_fail",
      event_id: "e4",
      ts: "2026-02-27T00:00:03Z",
      type: "run.end",
      data: { status: "fail" },
    },
  ];

  const successRunEvents: NormalizedEvent[] = failRunEvents.map((event) => ({
    ...event,
    run_id: "run_bench_success",
    data: structuredClone(event.data),
  }));
  const successTool = successRunEvents[2];
  if (successTool) {
    successTool.data = { call_id: "c1", tool: "browser.open", result: { ok: true } };
  }
  const successEnd = successRunEvents[3];
  if (successEnd) {
    successEnd.data = { status: "success" };
  }

  saveRun({ runId: "run_bench_fail", source: "bench", mode: "replay", events: failRunEvents, partialParse: false, issues: [] });
  saveRun({ runId: "run_bench_success", source: "bench", mode: "reexec", events: successRunEvents, partialParse: false, issues: [] });

  const compare = compareRunsById("run_bench_fail", "run_bench_success");

  const policy = savePolicy({
    name: "bench-policy",
    description: "deny browser.open",
    backend: "yaml",
    content: `version: 1\nrules:\n  - id: deny_browser\n    when:\n      tool: [\"browser.open\"]\n    then:\n      decision: deny\n      severity: high\n      reason: browser blocked\n`,
  });

  const policyResult = await evaluatePolicy(policy.id, ["run_bench_fail", "run_bench_success"]);
  const output = {
    generatedAt: new Date().toISOString(),
    scenarios: [
      {
        mode: "replay",
        provider: "recorded",
        runId: "run_bench_fail",
      },
      {
        mode: "reexec",
        provider: "recorded-override",
        runId: "run_bench_success",
      },
    ],
    compare: compare.compare.deltas,
    blame: compare.blame,
    policy: policyResult.summary,
  };

  mkdirSync(join(REPO_ROOT, "artifacts"), { recursive: true });
  writeFileSync(join(REPO_ROOT, "artifacts", "benchmark-suite.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

void run();

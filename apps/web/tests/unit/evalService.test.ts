import { beforeEach, describe, expect, it } from "vitest";
import type { NormalizedEvent } from "@branchlab/core";
import { createEvalDataset, runEvalDataset } from "@/lib/evalService";
import { resetAllData, saveRun } from "@/lib/runsRepo";

describe("evalService", () => {
  beforeEach(() => {
    resetAllData();
  });

  it("creates datasets and runs deterministic local evals", () => {
    const events: NormalizedEvent[] = [
      {
        schema: "branchlab.trace.v1",
        run_id: "run_eval",
        event_id: "e1",
        ts: "2026-02-27T00:00:00Z",
        type: "tool.response",
        data: { call_id: "c1", error: "timeout" },
      },
      {
        schema: "branchlab.trace.v1",
        run_id: "run_eval",
        event_id: "e2",
        ts: "2026-02-27T00:00:01Z",
        type: "run.end",
        data: { status: "fail" },
      },
    ];
    saveRun({ runId: "run_eval", source: "eval-test", mode: "replay", events, partialParse: false, issues: [] });

    const dataset = createEvalDataset({ name: "eval", runIds: ["run_eval"] });
    const result = runEvalDataset(dataset.id);

    expect(result.summary.total).toBe(1);
    expect(result.status).toBe("fail");
    expect(result.results[0]?.checks.some((check) => check.id === "tool-error-rate" && check.status === "fail")).toBe(true);
  });
});

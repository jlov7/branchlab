import { describe, expect, it } from "vitest";
import { compareRuns } from "../src/diff";
import type { NormalizedEvent } from "../src/types";

const parent: NormalizedEvent[] = [
  {
    schema: "branchlab.trace.v1",
    run_id: "parent",
    event_id: "e1",
    ts: "2026-01-01T00:00:00Z",
    type: "tool.response",
    data: { call_id: "c1", result: { value: 10 } },
  },
  {
    schema: "branchlab.trace.v1",
    run_id: "parent",
    event_id: "e2",
    ts: "2026-01-01T00:00:01Z",
    type: "run.end",
    data: { status: "fail" },
  },
];

const branch: NormalizedEvent[] = [
  {
    schema: "branchlab.trace.v1",
    run_id: "branch",
    event_id: "e1",
    ts: "2026-01-01T00:00:00Z",
    type: "tool.response",
    data: { call_id: "c1", result: { value: 99 } },
  },
  {
    schema: "branchlab.trace.v1",
    run_id: "branch",
    event_id: "e2",
    ts: "2026-01-01T00:00:01Z",
    type: "run.end",
    data: { status: "success" },
  },
];

describe("compareRuns", () => {
  it("detects divergence and deltas", () => {
    const result = compareRuns(parent, branch);
    expect(result.divergence.firstDivergenceIndex).toBe(0);
    expect(result.stats.modified).toBe(2);
    expect(result.deltas.outcome.from).toBe("fail");
    expect(result.deltas.outcome.to).toBe("success");
  });
});

import { describe, expect, it } from "vitest";
import { suggestBlameCandidates } from "../src/blame";
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
    ...parent[0]!,
    run_id: "branch",
    data: { call_id: "c1", result: { value: 99 } },
  },
  {
    ...parent[1]!,
    run_id: "branch",
    data: { status: "success" },
  },
];

describe("suggestBlameCandidates", () => {
  it("keeps the strongest candidate per event", () => {
    const candidates = suggestBlameCandidates(parent, branch);
    expect(candidates.filter((candidate) => candidate.eventId === "e1")).toHaveLength(1);
    expect(candidates[0]?.eventId).toBe("e1");
    expect(candidates[0]?.confidence).toBe(0.94);
  });
});

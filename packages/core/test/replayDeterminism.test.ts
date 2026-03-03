import { describe, expect, it } from "vitest";
import type { InterventionSpec, NormalizedEvent } from "../src/types";
import { applyReplayIntervention } from "../src/branch";

describe("replay determinism", () => {
  it("produces deterministic output for repeated policy overrides", () => {
    const events: NormalizedEvent[] = [
      {
        schema: "branchlab.trace.v1",
        run_id: "run_1",
        event_id: "e1",
        ts: "2026-02-27T10:00:00Z",
        type: "tool.request",
        data: { call_id: "c1", tool: "pricing.lookup", args: {} },
      },
      {
        schema: "branchlab.trace.v1",
        run_id: "run_1",
        event_id: "e2",
        ts: "2026-02-27T10:00:01Z",
        type: "run.end",
        data: { status: "success" },
      },
    ];

    const intervention: InterventionSpec = {
      kind: "policy_override",
      callId: "c1",
      decision: "deny",
      reason: "blocked",
    };

    const first = applyReplayIntervention(events, "e1", intervention);
    const second = applyReplayIntervention(events, "e1", intervention);

    expect(first.events).toEqual(second.events);
    expect(first.status).toBe(second.status);
  });
});

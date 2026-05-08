import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { NormalizedEvent } from "@branchlab/core";
import { getCausalDebugger } from "@/lib/causalService";
import { compareRunsById } from "@/lib/compareService";
import { exportBundle } from "@/lib/exportService";
import { EXPORTS_DIR } from "@/lib/paths";
import { resetAllData, saveRun } from "@/lib/runsRepo";

const parentEvents: NormalizedEvent[] = [
  {
    schema: "branchlab.trace.v1",
    run_id: "run_parent",
    event_id: "root",
    ts: "2026-05-08T00:00:00Z",
    type: "run.start",
    data: { scenario: "pricing" },
  },
  {
    schema: "branchlab.trace.v1",
    run_id: "run_parent",
    event_id: "tool_result",
    ts: "2026-05-08T00:00:01Z",
    type: "tool.response",
    parent_event_id: "root",
    data: { call_id: "call_price", tool: "pricing.lookup", result: { price: 1000 } },
  },
  {
    schema: "branchlab.trace.v1",
    run_id: "run_parent",
    event_id: "final",
    ts: "2026-05-08T00:00:02Z",
    type: "run.end",
    parent_event_id: "tool_result",
    data: { status: "fail" },
  },
];

const branchEvents: NormalizedEvent[] = parentEvents.map((event) => ({
  ...event,
  run_id: "run_branch",
  data:
    event.event_id === "tool_result"
      ? { call_id: "call_price", tool: "pricing.lookup", result: { price: 100 } }
      : event.event_id === "final"
        ? { status: "success" }
        : event.data,
}));

describe("trace physics service integration", () => {
  beforeEach(() => {
    resetAllData();
    saveRun({
      runId: "run_parent",
      source: "physics-parent",
      mode: "replay",
      events: parentEvents,
      partialParse: false,
      issues: [],
    });
    saveRun({
      runId: "run_branch",
      source: "physics-branch",
      mode: "replay",
      events: branchEvents,
      partialParse: false,
      issues: [],
    });
  });

  it("compare service exposes canonical trace physics output", () => {
    const result = compareRunsById("run_parent", "run_branch");

    expect(result.tracePhysics?.firstDivergenceSpanId).toBe("tool_result");
    expect(result.tracePhysics?.heatmap.tool).toBe(1);
    expect(result.tracePhysics?.parent.diagnostics).toEqual([]);
    expect(result.tracePhysics?.branch.diagnostics).toEqual([]);
    expect(result.causalCandidates[0]?.spanId).toBe("tool_result");
  });

  it("causal debugger uses the trace physics graph and compare", () => {
    const result = getCausalDebugger("run_parent", "run_branch");

    expect(result.tracePhysics.evidence.eventCount).toBe(3);
    expect(result.graph.nodes).toHaveLength(3);
    expect(result.compare?.firstDivergenceSpanId).toBe("tool_result");
    expect(result.candidates[0]?.spanId).toBe("tool_result");
  });

  it("evidence packs include compact trace physics artifacts", () => {
    const bundle = exportBundle({ runId: "run_parent", branchRunId: "run_branch", redacted: true });
    const tracePhysicsJson = readFileSync(join(EXPORTS_DIR, bundle.id, "trace_physics.json"), "utf8");
    const provenanceJson = readFileSync(join(EXPORTS_DIR, bundle.id, "provenance.json"), "utf8");

    expect(bundle.files).toContain("trace_physics.json");
    expect(tracePhysicsJson).toContain("firstDivergenceSpanId");
    expect(tracePhysicsJson).toContain("tool_result");
    expect(provenanceJson).toContain("tracePhysicsEvidence");
    expect(provenanceJson).toContain("tracePhysicsDiagnostics");
  });
});

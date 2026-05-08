import { describe, expect, it } from "vitest";
import { buildCausalGraph, compareCausalTraces, rankCausalCandidates, replayFingerprint } from "../src/causal";
import { normalizeTraceIrEvent } from "../src/traceIr";

const parent = [
  normalizeTraceIrEvent({ schema: "branchlab.trace_ir.v2", traceId: "t", runId: "p", spanId: "s1", sequence: 1, eventKind: "llm", redactionState: "raw", causalParentIds: [], timing: {}, data: { text: "a" } }),
  normalizeTraceIrEvent({ schema: "branchlab.trace_ir.v2", traceId: "t", runId: "p", spanId: "s2", parentSpanId: "s1", sequence: 2, eventKind: "tool", toolCallId: "c1", redactionState: "raw", causalParentIds: ["s1"], timing: {}, data: { result: 1 } }),
];

const branch = [
  normalizeTraceIrEvent({ schema: "branchlab.trace_ir.v2", traceId: "t", runId: "b", spanId: "s1", sequence: 1, eventKind: "llm", redactionState: "raw", causalParentIds: [], timing: {}, data: { text: "a" } }),
  normalizeTraceIrEvent({ schema: "branchlab.trace_ir.v2", traceId: "t", runId: "b", spanId: "s2", parentSpanId: "s1", sequence: 2, eventKind: "tool", toolCallId: "c1", redactionState: "raw", causalParentIds: ["s1"], timing: {}, data: { result: 2 } }),
];

describe("causal trace utilities", () => {
  it("builds graph edges and deterministic fingerprints", () => {
    const graph = buildCausalGraph(parent);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges.some((edge) => edge.from === "s1" && edge.to === "s2")).toBe(true);
    expect(replayFingerprint(parent)).toHaveLength(64);
  });

  it("compares trace IR hashes and ranks causal candidates", () => {
    const compare = compareCausalTraces(parent, branch);
    expect(compare.firstDivergenceSpanId).toBe("s2");
    expect(compare.heatmap.tool).toBe(1);
    expect(rankCausalCandidates(compare)[0]?.eventKind).toBe("tool");
  });
});

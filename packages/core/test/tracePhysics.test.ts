import { describe, expect, it } from "vitest";
import { analyzeTracePhysics, compareTracePhysics } from "../src/tracePhysics";

describe("trace physics kernel", () => {
  it("produces stable fingerprints when only run and trace ids change", () => {
    const first = analyzeTracePhysics([
      {
        schema: "branchlab.trace_ir.v2",
        traceId: "trace_a",
        runId: "run_a",
        spanId: "root",
        sequence: 0,
        eventKind: "run",
        redactionState: "raw",
        causalParentIds: [],
        timing: {},
        data: { scenario: "same" },
      },
      {
        schema: "branchlab.trace_ir.v2",
        traceId: "trace_a",
        runId: "run_a",
        spanId: "tool_result",
        parentSpanId: "root",
        sequence: 1,
        eventKind: "tool",
        redactionState: "raw",
        causalParentIds: ["root"],
        timing: {},
        data: { price: 100 },
      },
    ]);

    const second = analyzeTracePhysics([
      {
        schema: "branchlab.trace_ir.v2",
        traceId: "trace_b",
        runId: "run_b",
        spanId: "root",
        sequence: 0,
        eventKind: "run",
        redactionState: "raw",
        causalParentIds: [],
        timing: {},
        data: { scenario: "same" },
      },
      {
        schema: "branchlab.trace_ir.v2",
        traceId: "trace_b",
        runId: "run_b",
        spanId: "tool_result",
        parentSpanId: "root",
        sequence: 1,
        eventKind: "tool",
        redactionState: "raw",
        causalParentIds: ["root"],
        timing: {},
        data: { price: 100 },
      },
    ]);

    expect(first.diagnostics).toEqual([]);
    expect(second.diagnostics).toEqual([]);
    expect(first.fingerprint).toBe(second.fingerprint);
    expect(first.evidence.eventCount).toBe(2);
    expect(first.evidence.roots).toEqual(["root"]);
  });

  it("emits deterministic validation diagnostics", () => {
    const summary = analyzeTracePhysics([
      {
        schema: "branchlab.trace_ir.v2",
        traceId: "trace_bad",
        runId: "run_bad",
        spanId: "dup",
        sequence: 0,
        eventKind: "run",
        redactionState: "raw",
        causalParentIds: [],
        timing: {},
        data: {},
      },
      {
        schema: "branchlab.trace_ir.v2",
        traceId: "trace_bad",
        runId: "run_bad",
        spanId: "dup",
        parentSpanId: "missing_parent",
        sequence: -1,
        eventKind: "tool",
        redactionState: "raw",
        causalParentIds: ["missing_causal"],
        timing: {},
        data: {},
        hash: "not-the-derived-hash",
      },
    ]);

    expect(summary.diagnostics.map((item) => item.code)).toEqual([
      "duplicate_span_id",
      "hash_mismatch",
      "negative_sequence",
      "dangling_parent_span",
      "dangling_causal_parent",
    ]);
  });

  it("can trust stored hashes for persisted Trace IR index rows", () => {
    const summary = analyzeTracePhysics(
      [
        {
          schema: "branchlab.trace_ir.v2",
          traceId: "trace_index",
          runId: "run_index",
          spanId: "tool_result",
          sequence: 0,
          eventKind: "tool",
          redactionState: "raw",
          causalParentIds: [],
          timing: {},
          data: {},
          hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        },
      ],
      { trustExistingHashes: true },
    );

    expect(summary.events[0]?.hash).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(summary.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(summary.diagnostics).toEqual([]);
  });

  it("compares traces through one evidence-producing interface", () => {
    const compare = compareTracePhysics(
      [
        {
          schema: "branchlab.trace_ir.v2",
          traceId: "trace",
          runId: "parent",
          spanId: "root",
          sequence: 0,
          eventKind: "run",
          redactionState: "raw",
          causalParentIds: [],
          timing: {},
          data: {},
        },
        {
          schema: "branchlab.trace_ir.v2",
          traceId: "trace",
          runId: "parent",
          spanId: "tool_result",
          parentSpanId: "root",
          sequence: 1,
          eventKind: "tool",
          redactionState: "raw",
          causalParentIds: ["root"],
          timing: {},
          data: { price: 1000 },
        },
      ],
      [
        {
          schema: "branchlab.trace_ir.v2",
          traceId: "trace",
          runId: "branch",
          spanId: "root",
          sequence: 0,
          eventKind: "run",
          redactionState: "raw",
          causalParentIds: [],
          timing: {},
          data: {},
        },
        {
          schema: "branchlab.trace_ir.v2",
          traceId: "trace",
          runId: "branch",
          spanId: "tool_result",
          parentSpanId: "root",
          sequence: 1,
          eventKind: "tool",
          redactionState: "raw",
          causalParentIds: ["root"],
          timing: {},
          data: { price: 100 },
        },
      ],
    );

    expect(compare.firstDivergenceSpanId).toBe("tool_result");
    expect(compare.heatmap.tool).toBe(1);
    expect(compare.candidates[0]?.spanId).toBe("tool_result");
    expect(compare.parent.diagnostics).toEqual([]);
    expect(compare.branch.diagnostics).toEqual([]);
  });
});

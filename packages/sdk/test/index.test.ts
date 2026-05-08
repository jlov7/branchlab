import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createTraceIrEvent, emitEvent, emitOtelGenAiSpan, emitTraceIrEvent, endRun, startRun, toOtelGenAiSpan } from "../src";

describe("sdk", () => {
  it("writes trace events as jsonl", () => {
    const dir = mkdtempSync(join(tmpdir(), "branchlab-sdk-"));
    const filePath = join(dir, "trace.jsonl");

    startRun({ runId: "run_1", filePath });
    emitEvent(filePath, {
      schema: "branchlab.trace.v1",
      run_id: "run_1",
      event_id: "e1",
      ts: new Date().toISOString(),
      type: "note",
      data: { hello: "world" },
    });
    endRun({ runId: "run_1", filePath }, "success");

    const lines = readFileSync(filePath, "utf8").trim().split("\n");
    expect(lines.length).toBe(3);

    rmSync(dir, { recursive: true, force: true });
  });

  it("creates Trace IR v2 events and OTel-compatible spans", () => {
    const dir = mkdtempSync(join(tmpdir(), "branchlab-sdk-ir-"));
    const irPath = join(dir, "trace-ir.jsonl");
    const otelPath = join(dir, "otel.jsonl");

    const event = createTraceIrEvent({
      traceId: "trace_1",
      runId: "run_1",
      spanId: "span_tool",
      parentSpanId: "span_llm",
      sequence: 2,
      eventKind: "tool",
      provider: "openai",
      model: "gpt-5.5",
      toolCallId: "call_1",
      input: { product: "ACME" },
      output: { price: 100 },
      data: { tool: "pricing.lookup" },
    });

    emitTraceIrEvent(irPath, event);
    emitOtelGenAiSpan(otelPath, event);

    const ir = JSON.parse(readFileSync(irPath, "utf8")) as { schema: string; hash: string };
    const otel = JSON.parse(readFileSync(otelPath, "utf8")) as { attributes: Record<string, unknown> };

    expect(ir.schema).toBe("branchlab.trace_ir.v2");
    expect(ir.hash).toHaveLength(64);
    expect(toOtelGenAiSpan(event).name).toBe("execute_tool pricing.lookup");
    expect(otel.attributes["gen_ai.operation.name"]).toBe("execute_tool");
    expect(otel.attributes["gen_ai.tool.call.id"]).toBe("call_1");

    rmSync(dir, { recursive: true, force: true });
  });
});

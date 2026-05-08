import { describe, expect, it } from "vitest";
import { hashTraceIrEvent, normalizeTraceIrEvent, traceIrFromNormalizedEvent } from "../src/traceIr";
import type { NormalizedEvent } from "../src/types";

describe("Trace IR v2", () => {
  it("maps BranchLab v1 events to canonical IR with deterministic hashes", () => {
    const event: NormalizedEvent = {
      schema: "branchlab.trace.v1",
      run_id: "run_demo",
      event_id: "e1",
      ts: "2026-02-27T00:00:00Z",
      type: "tool.request",
      data: { call_id: "c1", tool: "pricing.lookup", args: { product: "ACME" } },
      meta: { provider: "openai", model: "gpt-5.5", tokens_in: 12, cost_usd: 0.001 },
    };

    const first = traceIrFromNormalizedEvent(event, 7);
    const second = traceIrFromNormalizedEvent(structuredClone(event), 7);

    expect(first.schema).toBe("branchlab.trace_ir.v2");
    expect(first.eventKind).toBe("tool");
    expect(first.toolCallId).toBe("c1");
    expect(first.provider).toBe("openai");
    expect(first.usage?.tokensIn).toBe(12);
    expect(first.hash).toBe(second.hash);
    expect(hashTraceIrEvent(first)).toBe(first.hash);
  });

  it("normalizes OTel GenAI tool spans", () => {
    const event = normalizeTraceIrEvent(
      {
        trace_id: "trace_otel",
        span_id: "span_tool",
        parent_span_id: "span_llm",
        name: "execute_tool pricing.lookup",
        start_time: "2026-02-27T00:00:00Z",
        end_time: "2026-02-27T00:00:01Z",
        attributes: {
          "gen_ai.operation.name": "execute_tool",
          "gen_ai.provider.name": "openai",
          "gen_ai.request.model": "gpt-5.5",
          "gen_ai.tool.name": "pricing.lookup",
          "gen_ai.tool.call.id": "call_1",
          "gen_ai.tool.call.arguments": { product: "ACME" },
          "gen_ai.tool.call.result": { price: 100 },
        },
      },
      3,
    );

    expect(event.eventKind).toBe("tool");
    expect(event.traceId).toBe("trace_otel");
    expect(event.parentSpanId).toBe("span_llm");
    expect(event.toolCallId).toBe("call_1");
    expect(event.outputRef?.inline).toEqual({ price: 100 });
  });

  it("normalizes OpenAI Responses-style events through the existing adapter", () => {
    const event = normalizeTraceIrEvent({
      provider: "openai",
      type: "response.completed",
      run_id: "run_oai",
      ts: "2026-02-27T00:00:00Z",
      response: {
        id: "resp_1",
        output_text: "done",
        status: "completed",
      },
    });

    expect(event.eventKind).toBe("llm");
    expect(event.provider).toBeUndefined();
    expect(event.outputRef?.inline).toBe("done");
    expect(event.data.sourceSchema).toBe("branchlab.trace.v1");
  });

  it("normalizes LangSmith and MLflow-style spans", () => {
    const langSmith = normalizeTraceIrEvent({
      id: "ls_child",
      trace_id: "ls_trace",
      parent_run_id: "ls_parent",
      run_type: "tool",
      name: "pricing.lookup",
      inputs: { product: "ACME" },
      outputs: { price: 100 },
    });

    const mlflow = normalizeTraceIrEvent({
      trace_id: "ml_trace",
      span_id: "ml_span",
      parent_span_id: "ml_parent",
      span_type: "LLM",
      inputs: { messages: [] },
      outputs: { text: "ok" },
      attributes: { "gen_ai.provider.name": "openai" },
    });

    expect(langSmith.eventKind).toBe("tool");
    expect(langSmith.causalParentIds).toEqual(["ls_parent"]);
    expect(mlflow.eventKind).toBe("llm");
    expect(mlflow.provider).toBe("openai");
  });

  it("keeps malformed generic JSONL as an auditable note event", () => {
    const event = normalizeTraceIrEvent({ unexpected: true }, 4);

    expect(event.eventKind).toBe("note");
    expect(event.spanId).toBe("generic_4");
    expect(event.redactionState).toBe("unknown");
    expect(event.data.reason).toBe("unrecognized_trace_shape");
  });
});

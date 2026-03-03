import { describe, expect, it } from "vitest";
import { normalizeEvent } from "../src/trace";

describe("trace compatibility adapters", () => {
  it("normalizes legacy v0 event fields", () => {
    const event = normalizeEvent({
      schema: "branchlab.trace.v0",
      runId: "run_legacy",
      eventId: "legacy_1",
      timestamp: "2026-02-27T00:00:00Z",
      event_type: "note",
      payload: { text: "legacy" },
    });

    expect(event).toBeTruthy();
    expect(event?.schema).toBe("branchlab.trace.v1");
    expect(event?.run_id).toBe("run_legacy");
    expect(event?.event_id).toBe("legacy_1");
    expect(event?.data.text).toBe("legacy");
  });

  it("normalizes OpenAI provider events", () => {
    const event = normalizeEvent({
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

    expect(event).toBeTruthy();
    expect(event?.type).toBe("llm.response");
    expect(event?.data.call_id).toBe("resp_1");
    expect(event?.data.outcome).toBe("success");
  });

  it("normalizes Anthropic tool events", () => {
    const event = normalizeEvent({
      provider: "anthropic",
      type: "tool_use",
      run_id: "run_ant",
      ts: "2026-02-27T00:00:00Z",
      call_id: "tool_1",
      name: "pricing.lookup",
      args: { product: "ACME Widget" },
    });

    expect(event).toBeTruthy();
    expect(event?.type).toBe("tool.request");
    expect(event?.data.tool).toBe("pricing.lookup");
  });
});

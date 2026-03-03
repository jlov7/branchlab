import { describe, expect, it } from "vitest";
import { determineOutcome } from "../src/outcome";
import type { NormalizedEvent } from "../src/types";

function event(type: NormalizedEvent["type"], data: Record<string, unknown>): NormalizedEvent {
  return {
    schema: "branchlab.trace.v1",
    run_id: "run_1",
    event_id: Math.random().toString(16).slice(2),
    ts: new Date().toISOString(),
    type,
    data,
  };
}

describe("determineOutcome", () => {
  it("prefers run.end.data.status over llm outcome", () => {
    const result = determineOutcome([
      event("llm.response", { outcome: "success" }),
      event("run.end", { status: "fail" }),
    ]);

    expect(result).toBe("fail");
  });

  it("falls back to latest llm.response outcome", () => {
    const result = determineOutcome([
      event("llm.response", { outcome: "fail" }),
      event("llm.response", { outcome: "success" }),
    ]);

    expect(result).toBe("success");
  });

  it("returns unknown if no outcome markers exist", () => {
    const result = determineOutcome([event("note", { msg: "none" })]);
    expect(result).toBe("unknown");
  });
});

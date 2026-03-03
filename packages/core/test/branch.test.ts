import { describe, expect, it } from "vitest";
import { applyReplayIntervention } from "../src/branch";
import type { NormalizedEvent } from "../src/types";

const baseEvents: NormalizedEvent[] = [
  {
    schema: "branchlab.trace.v1",
    run_id: "run_demo",
    event_id: "e1",
    ts: "2026-01-01T00:00:00Z",
    type: "llm.request",
    data: {
      messages: [
        { role: "system", content: "System text" },
        { role: "user", content: "Original user prompt" },
      ],
    },
  },
  {
    schema: "branchlab.trace.v1",
    run_id: "run_demo",
    event_id: "e2",
    ts: "2026-01-01T00:00:01Z",
    type: "tool.response",
    data: {
      call_id: "c1",
      result: { value: 1 },
    },
  },
  {
    schema: "branchlab.trace.v1",
    run_id: "run_demo",
    event_id: "e3",
    ts: "2026-01-01T00:00:02Z",
    type: "run.end",
    data: {
      status: "fail",
    },
  },
];

describe("applyReplayIntervention", () => {
  it("edits first user message when prompt intervention is used", () => {
    const result = applyReplayIntervention(baseEvents, "e1", {
      kind: "prompt_edit",
      newPrompt: "Updated prompt",
    });

    const firstEvent = result.events[0];
    expect(firstEvent).toBeDefined();
    const updated = (firstEvent?.data.messages ?? []) as Array<{ role: string; content: string }>;
    expect(updated[1]?.content).toBe("Updated prompt");
    expect(updated[0]?.content).toBe("System text");
  });

  it("overrides tool output result", () => {
    const result = applyReplayIntervention(baseEvents, "e1", {
      kind: "tool_output_override",
      callId: "c1",
      result: { value: 99 },
    });

    const secondEvent = result.events[1];
    expect(secondEvent).toBeDefined();
    expect(((secondEvent?.data.result as { value: number }) ?? { value: 0 }).value).toBe(99);
  });
});

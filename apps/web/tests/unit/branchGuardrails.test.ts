import { beforeEach, describe, expect, it } from "vitest";
import type { NormalizedEvent } from "@branchlab/core";
import { createBranch } from "@/lib/branchService";
import { getAllRunEvents, getRun, resetAllData, saveRun } from "@/lib/runsRepo";
import { updateSettings } from "@/lib/settings";
import { listRuntimeExecutions } from "@/lib/runtimeService";

describe("re-exec guardrails", () => {
  beforeEach(() => {
    resetAllData();
    updateSettings({
      reexecMaxCalls: 1,
      reexecMaxTokens: 10,
      reexecMaxCostUsd: 0.01,
      liveToolAllowlist: ["pricing.lookup"],
    });
  });

  it("fails branch when live tool allowlist is violated", async () => {
    const parentEvents: NormalizedEvent[] = [
      {
        schema: "branchlab.trace.v1",
        run_id: "run_parent_tools",
        event_id: "e1",
        ts: "2026-02-27T10:00:00Z",
        type: "tool.request",
        data: { call_id: "c1", tool: "danger.delete", args: {} },
      },
      {
        schema: "branchlab.trace.v1",
        run_id: "run_parent_tools",
        event_id: "e2",
        ts: "2026-02-27T10:00:01Z",
        type: "run.end",
        data: { status: "success" },
      },
    ];

    saveRun({
      runId: "run_parent_tools",
      source: "guardrail-test",
      mode: "replay",
      events: parentEvents,
      partialParse: false,
      issues: [],
    });

    const branch = await createBranch({
      parentRunId: "run_parent_tools",
      forkEventId: "e1",
      mode: "reexec",
      allowLiveTools: true,
      liveToolAllowlist: ["pricing.lookup"],
      intervention: {
        kind: "memory_removal",
        memoryId: "mem_1",
      },
    });

    expect(getRun(branch.branchRunId)?.status).toBe("fail");
    const events = getAllRunEvents(branch.branchRunId);
    expect(events.some((event) => event.event_id.includes("allowlist") && event.type === "error")).toBe(true);
    expect(listRuntimeExecutions()[0]?.allowLiveTools).toBe(true);
  });

  it("emits call-limit guardrail error when max calls exceeded", async () => {
    const parentEvents: NormalizedEvent[] = [
      {
        schema: "branchlab.trace.v1",
        run_id: "run_parent_calls",
        event_id: "e1",
        ts: "2026-02-27T10:00:00Z",
        type: "llm.request",
        data: { call_id: "l1", messages: [{ role: "user", content: "first" }] },
      },
      {
        schema: "branchlab.trace.v1",
        run_id: "run_parent_calls",
        event_id: "e2",
        ts: "2026-02-27T10:00:01Z",
        type: "llm.response",
        data: { call_id: "l1", text: "one" },
      },
      {
        schema: "branchlab.trace.v1",
        run_id: "run_parent_calls",
        event_id: "e3",
        ts: "2026-02-27T10:00:02Z",
        type: "llm.request",
        data: { call_id: "l2", messages: [{ role: "user", content: "second" }] },
      },
      {
        schema: "branchlab.trace.v1",
        run_id: "run_parent_calls",
        event_id: "e4",
        ts: "2026-02-27T10:00:03Z",
        type: "llm.response",
        data: { call_id: "l2", text: "two" },
      },
      {
        schema: "branchlab.trace.v1",
        run_id: "run_parent_calls",
        event_id: "e5",
        ts: "2026-02-27T10:00:04Z",
        type: "run.end",
        data: { status: "success" },
      },
    ];

    saveRun({
      runId: "run_parent_calls",
      source: "guardrail-test",
      mode: "replay",
      events: parentEvents,
      partialParse: false,
      issues: [],
    });

    const branch = await createBranch({
      parentRunId: "run_parent_calls",
      forkEventId: "e1",
      mode: "reexec",
      intervention: {
        kind: "prompt_edit",
        newPrompt: "rewrite",
      },
    });

    const events = getAllRunEvents(branch.branchRunId);
    expect(events.some((event) => event.event_id.includes("guardrail_calls") && event.type === "error")).toBe(true);
    expect(getRun(branch.branchRunId)?.status).toBe("fail");
  });
});

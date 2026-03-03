import { beforeEach, describe, expect, it } from "vitest";
import { resetAllData, saveRun, getRun, getAllRunEvents } from "@/lib/runsRepo";
import type { NormalizedEvent } from "@branchlab/core";

describe("runsRepo", () => {
  beforeEach(() => {
    resetAllData();
  });

  it("persists and retrieves run summaries and events", () => {
    const events: NormalizedEvent[] = [
      {
        schema: "branchlab.trace.v1",
        run_id: "run_1",
        event_id: "e1",
        ts: "2026-02-27T10:00:00Z",
        type: "run.start",
        data: {},
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

    const saved = saveRun({
      source: "unit-test",
      mode: "replay",
      events,
      partialParse: false,
      issues: [],
    });

    const run = getRun(saved.runId);
    expect(run?.status).toBe("success");

    const loadedEvents = getAllRunEvents(saved.runId);
    expect(loadedEvents).toHaveLength(2);
  });
});

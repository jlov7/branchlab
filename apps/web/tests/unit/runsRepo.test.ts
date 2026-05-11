import { beforeEach, describe, expect, it } from "vitest";
import { resetAllData, saveRun, getRun, getAllRunEvents, getRunTraceIrEvents, getRunTraceIrIndex, getTraceFingerprint } from "@/lib/runsRepo";
import { getDb } from "@/lib/db";
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

    const traceIr = getRunTraceIrEvents(saved.runId);
    expect(traceIr).toHaveLength(2);
    expect(traceIr[0]?.hash).toHaveLength(64);
    expect(getRunTraceIrIndex(saved.runId)[0]?.data).toEqual({});
    expect(getTraceFingerprint(saved.runId)?.fingerprint).toHaveLength(64);
  });

  it("recreates query indexes after bulk save optimization", () => {
    process.env.BRANCHLAB_BULK_INDEX_REBUILD_THRESHOLD = "3";
    try {
      saveRun({
        runId: "run_bulk_index",
        source: "unit-test",
        mode: "replay",
        partialParse: false,
        issues: [],
        events: [
          {
            schema: "branchlab.trace.v1",
            run_id: "run_bulk_index",
            event_id: "e1",
            ts: "2026-02-27T10:00:00Z",
            type: "run.start",
            data: {},
          },
          {
            schema: "branchlab.trace.v1",
            run_id: "run_bulk_index",
            event_id: "e2",
            ts: "2026-02-27T10:00:01Z",
            type: "note",
            data: { text: "bulk index path" },
          },
          {
            schema: "branchlab.trace.v1",
            run_id: "run_bulk_index",
            event_id: "e3",
            ts: "2026-02-27T10:00:02Z",
            type: "run.end",
            data: { status: "success" },
          },
        ],
      });
    } finally {
      delete process.env.BRANCHLAB_BULK_INDEX_REBUILD_THRESHOLD;
    }

    const indexRows = getDb()
      .prepare(
        `
        SELECT name FROM sqlite_master
        WHERE type = 'index'
          AND name IN ('idx_events_run_ts', 'idx_trace_ir_run_sequence', 'idx_trace_ir_run_hash')
      `,
      )
      .all() as Array<{ name: string }>;

    expect(indexRows.map((row) => row.name).sort()).toEqual([
      "idx_events_run_ts",
      "idx_trace_ir_run_hash",
      "idx_trace_ir_run_sequence",
    ]);
  });
});

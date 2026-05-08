import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { NormalizedEvent } from "@branchlab/core";
import { ensureIsolatedDataRoot } from "./dataRoot";

ensureIsolatedDataRoot("branchlab-perf-");

const EVENT_BUDGET = Number(process.env.BRANCHLAB_PERF_EVENTS ?? 100000);
const MAX_INGEST_MS = Number(process.env.BRANCHLAB_PERF_MAX_INGEST_MS ?? 25000);
const MAX_COMPARE_MS = Number(process.env.BRANCHLAB_PERF_MAX_COMPARE_MS ?? 5000);
const COMPARE_SAMPLES = Number(process.env.BRANCHLAB_PERF_COMPARE_SAMPLES ?? 3);

function buildEvents(runId: string, count: number): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  const start = Date.parse("2026-02-27T00:00:00Z");
  events.push({
    schema: "branchlab.trace.v1",
    run_id: runId,
    event_id: "e000000",
    ts: new Date(start).toISOString(),
    type: "run.start",
    data: {},
  });

  for (let index = 1; index < count - 1; index += 1) {
    events.push({
      schema: "branchlab.trace.v1",
      run_id: runId,
      event_id: `e${String(index).padStart(6, "0")}`,
      ts: new Date(start + index * 10).toISOString(),
      type: index % 5 === 0 ? "tool.response" : "note",
      data:
        index % 5 === 0
          ? {
              call_id: `c_${index}`,
              tool: "pricing.lookup",
              result: { price: 100 + index },
            }
          : { text: `event-${index}` },
    });
  }

  events.push({
    schema: "branchlab.trace.v1",
    run_id: runId,
    event_id: `e${String(count - 1).padStart(6, "0")}`,
    ts: new Date(start + (count - 1) * 10).toISOString(),
    type: "run.end",
    data: { status: "success" },
  });

  return events;
}

async function run(): Promise<void> {
  const { REPO_ROOT } = await import("@/lib/paths");
  const { compareRunsById } = await import("@/lib/compareService");
  const { resetAllData, saveRun } = await import("@/lib/runsRepo");

  resetAllData();
  const base = buildEvents("run_perf_parent", EVENT_BUDGET);
  const branch = structuredClone(base);

  const t0 = performance.now();
  saveRun({
    runId: "run_perf_parent",
    source: "perf-budget",
    mode: "replay",
    events: base,
    partialParse: false,
    issues: [],
  });
  saveRun({
    runId: "run_perf_branch",
    source: "perf-budget",
    mode: "replay",
    events: branch,
    partialParse: false,
    issues: [],
  });
  const ingestMs = performance.now() - t0;

  // Warm up compare path once so budget checks measure steady-state behavior.
  compareRunsById("run_perf_parent", "run_perf_branch");

  const sampleCount = Math.max(1, COMPARE_SAMPLES);
  const compareSamples: number[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const t1 = performance.now();
    compareRunsById("run_perf_parent", "run_perf_branch");
    compareSamples.push(performance.now() - t1);
  }

  const sortedCompare = [...compareSamples].sort((a, b) => a - b);
  const middle = Math.floor(sortedCompare.length / 2);
  let compareMs = sortedCompare[middle] ?? Number.POSITIVE_INFINITY;
  if (sortedCompare.length % 2 === 0) {
    const left = sortedCompare[middle - 1];
    const right = sortedCompare[middle];
    compareMs = left !== undefined && right !== undefined ? (left + right) / 2 : Number.POSITIVE_INFINITY;
  }

  const rssMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

  const report = {
    events: EVENT_BUDGET,
    ingestMs: Number(ingestMs.toFixed(2)),
    compareMs: Number(compareMs.toFixed(2)),
    compareSamples: compareSamples.map((sample) => Number(sample.toFixed(2))),
    rssMb,
    budgets: {
      maxIngestMs: MAX_INGEST_MS,
      maxCompareMs: MAX_COMPARE_MS,
    },
    pass: ingestMs <= MAX_INGEST_MS && compareMs <= MAX_COMPARE_MS,
    generatedAt: new Date().toISOString(),
  };

  mkdirSync(join(REPO_ROOT, "artifacts"), { recursive: true });
  writeFileSync(join(REPO_ROOT, "artifacts", "perf-budget.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (!report.pass) {
    process.exit(1);
  }
}

void run();

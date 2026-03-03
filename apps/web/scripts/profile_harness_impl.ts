import type { NormalizedEvent } from "@branchlab/core";
import { compareRunsById } from "@/lib/compareService";
import { resetAllData, saveRun } from "@/lib/runsRepo";

export async function run(): Promise<Record<string, unknown>> {
  resetAllData();
  const cpuStart = process.cpuUsage();
  const memStart = process.memoryUsage();

  const events: NormalizedEvent[] = [];
  for (let index = 0; index < 30000; index += 1) {
    events.push({
      schema: "branchlab.trace.v1",
      run_id: "run_profile",
      event_id: `e${index}`,
      ts: new Date(1_706_995_200_000 + index * 10).toISOString(),
      type: index === 0 ? "run.start" : index === 29999 ? "run.end" : "note",
      data: index === 29999 ? { status: "success" } : { text: `payload-${index}` },
    });
  }

  saveRun({
    runId: "run_profile",
    source: "profile",
    mode: "replay",
    events,
    partialParse: false,
    issues: [],
  });
  saveRun({
    runId: "run_profile_branch",
    source: "profile",
    mode: "replay",
    events,
    partialParse: false,
    issues: [],
  });

  compareRunsById("run_profile", "run_profile_branch");

  const cpu = process.cpuUsage(cpuStart);
  const memEnd = process.memoryUsage();
  return {
    generatedAt: new Date().toISOString(),
    cpuMicros: cpu,
    memoryDelta: {
      rss: memEnd.rss - memStart.rss,
      heapUsed: memEnd.heapUsed - memStart.heapUsed,
      external: memEnd.external - memStart.external,
    },
    sampleSizeEvents: events.length,
  };
}

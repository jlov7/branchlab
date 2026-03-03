import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { EventType } from "@branchlab/core";

export interface SdkEvent {
  schema: "branchlab.trace.v1";
  run_id: string;
  event_id: string;
  ts: string;
  type: EventType;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface SdkRunOptions {
  runId: string;
  filePath: string;
}

export function startRun(options: SdkRunOptions): SdkEvent {
  const event: SdkEvent = {
    schema: "branchlab.trace.v1",
    run_id: options.runId,
    event_id: `run_start_${Date.now()}`,
    ts: new Date().toISOString(),
    type: "run.start",
    data: {},
  };

  emitEvent(options.filePath, event);
  return event;
}

export function emitEvent(filePath: string, event: SdkEvent): void {
  mkdirSync(dirname(filePath), { recursive: true });
  appendFileSync(filePath, `${JSON.stringify(event)}\n`, "utf8");
}

export function endRun(options: SdkRunOptions, status: "success" | "fail" | "unknown"): SdkEvent {
  const event: SdkEvent = {
    schema: "branchlab.trace.v1",
    run_id: options.runId,
    event_id: `run_end_${Date.now()}`,
    ts: new Date().toISOString(),
    type: "run.end",
    data: { status },
  };

  emitEvent(options.filePath, event);
  return event;
}

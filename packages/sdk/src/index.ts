import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { normalizeTraceIrEvent } from "@branchlab/core";
import type { EventType, RedactionState, TraceIrEventKind, TraceIrEventV2 } from "@branchlab/core";

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

export interface SdkTraceIrOptions {
  traceId?: string;
  runId: string;
  spanId: string;
  parentSpanId?: string;
  sequence?: number;
  eventKind: TraceIrEventKind;
  provider?: string;
  model?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
  redactionState?: RedactionState;
  causalParentIds?: string[];
  ts?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  data?: Record<string, unknown>;
}

export interface OtelGenAiSpan {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  name: string;
  start_time?: string;
  end_time?: string;
  duration_ms?: number;
  attributes: Record<string, unknown>;
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

export function createTraceIrEvent(options: SdkTraceIrOptions): TraceIrEventV2 {
  return normalizeTraceIrEvent(
    {
      schema: "branchlab.trace_ir.v2",
      traceId: options.traceId ?? options.runId,
      runId: options.runId,
      spanId: options.spanId,
      parentSpanId: options.parentSpanId,
      sequence: options.sequence ?? 0,
      eventKind: options.eventKind,
      provider: options.provider,
      model: options.model,
      toolCallId: options.toolCallId,
      inputRef: options.input === undefined ? undefined : { inline: options.input },
      outputRef: options.output === undefined ? undefined : { inline: options.output },
      redactionState: options.redactionState ?? "raw",
      causalParentIds: options.causalParentIds ?? (options.parentSpanId ? [options.parentSpanId] : []),
      timing: {
        ts: options.ts,
        startedAt: options.startedAt,
        endedAt: options.endedAt,
        durationMs: options.durationMs,
      },
      data: options.data ?? {},
    },
    options.sequence,
  );
}

export function emitTraceIrEvent(filePath: string, event: TraceIrEventV2): void {
  mkdirSync(dirname(filePath), { recursive: true });
  appendFileSync(filePath, `${JSON.stringify(event)}\n`, "utf8");
}

export function toOtelGenAiSpan(event: TraceIrEventV2): OtelGenAiSpan {
  const attributes: Record<string, unknown> = {
    "gen_ai.operation.name": event.eventKind === "tool" ? "execute_tool" : event.eventKind,
  };

  if (event.provider) {
    attributes["gen_ai.provider.name"] = event.provider;
  }
  if (event.model) {
    attributes["gen_ai.request.model"] = event.model;
  }
  if (event.inputRef?.inline !== undefined) {
    attributes[event.eventKind === "tool" ? "gen_ai.tool.call.arguments" : "gen_ai.input.messages"] =
      event.inputRef.inline;
  }
  if (event.outputRef?.inline !== undefined) {
    attributes[event.eventKind === "tool" ? "gen_ai.tool.call.result" : "gen_ai.output.messages"] =
      event.outputRef.inline;
  }
  if (event.toolCallId) {
    attributes["gen_ai.tool.call.id"] = event.toolCallId;
  }
  if (typeof event.data.tool === "string") {
    attributes["gen_ai.tool.name"] = event.data.tool;
  }

  return {
    trace_id: event.traceId,
    span_id: event.spanId,
    parent_span_id: event.parentSpanId,
    name: spanName(event),
    start_time: event.timing.startedAt ?? event.timing.ts,
    end_time: event.timing.endedAt,
    duration_ms: event.timing.durationMs,
    attributes,
  };
}

export function emitOtelGenAiSpan(filePath: string, event: TraceIrEventV2): void {
  mkdirSync(dirname(filePath), { recursive: true });
  appendFileSync(filePath, `${JSON.stringify(toOtelGenAiSpan(event))}\n`, "utf8");
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

function spanName(event: TraceIrEventV2): string {
  if (event.eventKind === "tool" && typeof event.data.tool === "string") {
    return `execute_tool ${event.data.tool}`;
  }
  if (event.eventKind === "llm" && event.model) {
    return `chat ${event.model}`;
  }
  return event.eventKind;
}

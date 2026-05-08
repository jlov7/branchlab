import { createHash } from "node:crypto";
import type { NormalizedEvent } from "./types";
import { normalizeEvent } from "./trace";

export type TraceIrEventKind =
  | "run"
  | "llm"
  | "tool"
  | "memory"
  | "policy"
  | "retrieval"
  | "handoff"
  | "approval"
  | "error"
  | "note"
  | "workflow"
  | "unknown";

export type RedactionState = "raw" | "redacted" | "mixed" | "unknown";

export interface TraceIrRef {
  blobSha?: string;
  inline?: unknown;
  mediaType?: string;
}

export interface TraceIrTiming {
  ts?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
}

export interface TraceIrUsage {
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
}

export interface TraceIrPolicy {
  decision?: "allow" | "deny" | "hold";
  severity?: "low" | "medium" | "high" | "critical";
  ruleId?: string;
  reason?: string;
}

export interface TraceIrEventV2 {
  schema: "branchlab.trace_ir.v2";
  traceId: string;
  runId: string;
  spanId: string;
  parentSpanId?: string;
  sequence: number;
  eventKind: TraceIrEventKind;
  provider?: string;
  model?: string;
  toolCallId?: string;
  inputRef?: TraceIrRef;
  outputRef?: TraceIrRef;
  hash: string;
  redactionState: RedactionState;
  causalParentIds: string[];
  timing: TraceIrTiming;
  usage?: TraceIrUsage;
  policy?: TraceIrPolicy;
  data: Record<string, unknown>;
}

export function normalizeTraceIrEvent(raw: Record<string, unknown>, sequence = 0): TraceIrEventV2 {
  if (raw.schema === "branchlab.trace_ir.v2") {
    return finalizeTraceIrEvent(raw, sequence);
  }

  const otel = normalizeOtelGenAiSpan(raw, sequence);
  if (otel) {
    return otel;
  }

  const langSmith = normalizeLangSmithRun(raw, sequence);
  if (langSmith) {
    return langSmith;
  }

  const mlflow = normalizeMlflowSpan(raw, sequence);
  if (mlflow) {
    return mlflow;
  }

  const normalized = normalizeEvent(raw);
  if (normalized) {
    return traceIrFromNormalizedEvent(normalized, sequence);
  }

  return withHash({
    schema: "branchlab.trace_ir.v2",
    traceId: "generic_partial",
    runId: "generic_partial",
    spanId: stringField(raw, "event_id") ?? stringField(raw, "id") ?? `generic_${sequence}`,
    sequence,
    eventKind: "note",
    redactionState: "unknown",
    causalParentIds: [],
    timing: { ts: stringField(raw, "ts") ?? stringField(raw, "timestamp") },
    data: {
      raw,
      reason: "unrecognized_trace_shape",
    },
  });
}

export function traceIrFromNormalizedEvent(event: NormalizedEvent, sequence = 0): TraceIrEventV2 {
  const eventKind = eventKindFromV1(event.type);
  const toolCallId = stringDataField(event, "call_id");
  const model = stringMetaField(event, "model");
  const provider = stringMetaField(event, "provider");

  return withHash({
    schema: "branchlab.trace_ir.v2",
    traceId: event.run_id,
    runId: event.run_id,
    spanId: event.event_id,
    parentSpanId: event.parent_event_id,
    sequence,
    eventKind,
    provider,
    model,
    toolCallId,
    inputRef: inputRefForV1(event),
    outputRef: outputRefForV1(event),
    redactionState: "raw",
    causalParentIds: event.parent_event_id ? [event.parent_event_id] : [],
    timing: { ts: event.ts },
    usage: usageFromMeta(event.meta),
    policy: policyFromV1(event),
    data: traceIrMetadataFromV1(event),
  });
}

export function hashTraceIrEvent(event: Omit<TraceIrEventV2, "hash"> | TraceIrEventV2): string {
  const { hash: _hash, traceId: _traceId, runId: _runId, ...withoutHash } = event as TraceIrEventV2;
  return createHash("sha256").update(stableStringify(withoutHash)).digest("hex");
}

function finalizeTraceIrEvent(raw: Record<string, unknown>, sequence: number): TraceIrEventV2 {
  const traceId = stringField(raw, "traceId") ?? "trace_unknown";
  const runId = stringField(raw, "runId") ?? traceId;
  const spanId = stringField(raw, "spanId") ?? stringField(raw, "eventId") ?? `span_${sequence}`;
  const eventKind = eventKindValue(raw.eventKind);
  const redactionState = redactionValue(raw.redactionState);
  const causalParentIds = Array.isArray(raw.causalParentIds)
    ? raw.causalParentIds.filter((item): item is string => typeof item === "string")
    : [];

  return withHash({
    schema: "branchlab.trace_ir.v2",
    traceId,
    runId,
    spanId,
    parentSpanId: stringField(raw, "parentSpanId"),
    sequence: numberField(raw, "sequence") ?? sequence,
    eventKind,
    provider: stringField(raw, "provider"),
    model: stringField(raw, "model"),
    toolCallId: stringField(raw, "toolCallId"),
    inputRef: refValue(raw.inputRef),
    outputRef: refValue(raw.outputRef),
    redactionState,
    causalParentIds,
    timing: timingValue(raw.timing),
    usage: usageValue(raw.usage),
    policy: policyValue(raw.policy),
    data: objectField(raw, "data") ?? {},
  });
}

function normalizeOtelGenAiSpan(raw: Record<string, unknown>, sequence: number): TraceIrEventV2 | null {
  const attributes = objectField(raw, "attributes");
  const traceId = stringField(raw, "traceId") ?? stringField(raw, "trace_id");
  const spanId = stringField(raw, "spanId") ?? stringField(raw, "span_id");
  if (!attributes || !traceId || !spanId) {
    return null;
  }

  const operation = stringFromObject(attributes, "gen_ai.operation.name");
  const toolName = stringFromObject(attributes, "gen_ai.tool.name");
  const eventKind = operation === "execute_tool" || toolName ? "tool" : "llm";

  return withHash({
    schema: "branchlab.trace_ir.v2",
    traceId,
    runId: stringFromObject(attributes, "gen_ai.conversation.id") ?? traceId,
    spanId,
    parentSpanId: stringField(raw, "parentSpanId") ?? stringField(raw, "parent_span_id"),
    sequence,
    eventKind,
    provider: stringFromObject(attributes, "gen_ai.provider.name"),
    model: stringFromObject(attributes, "gen_ai.request.model") ?? stringFromObject(attributes, "gen_ai.response.model"),
    toolCallId: stringFromObject(attributes, "gen_ai.tool.call.id"),
    inputRef: refFromInline(attributes["gen_ai.input.messages"] ?? attributes["gen_ai.tool.call.arguments"]),
    outputRef: refFromInline(attributes["gen_ai.output.messages"] ?? attributes["gen_ai.tool.call.result"]),
    redactionState: "unknown",
    causalParentIds: causalParents(raw),
    timing: {
      startedAt: stringField(raw, "startTime") ?? stringField(raw, "start_time"),
      endedAt: stringField(raw, "endTime") ?? stringField(raw, "end_time"),
      durationMs: numberField(raw, "durationMs") ?? numberField(raw, "duration_ms"),
    },
    usage: {
      tokensIn: numberFromObject(attributes, "gen_ai.usage.input_tokens"),
      tokensOut: numberFromObject(attributes, "gen_ai.usage.output_tokens"),
    },
    data: {
      source: "otel_genai",
      name: stringField(raw, "name"),
      attributes,
    },
  });
}

function normalizeLangSmithRun(raw: Record<string, unknown>, sequence: number): TraceIrEventV2 | null {
  const runType = stringField(raw, "run_type");
  const id = stringField(raw, "id");
  if (!runType || !id || (!raw.inputs && !raw.outputs)) {
    return null;
  }

  const traceId = stringField(raw, "trace_id") ?? id;
  return withHash({
    schema: "branchlab.trace_ir.v2",
    traceId,
    runId: traceId,
    spanId: id,
    parentSpanId: stringField(raw, "parent_run_id"),
    sequence,
    eventKind: eventKindFromRunType(runType),
    provider: stringField(raw, "provider"),
    model: stringField(raw, "model"),
    inputRef: refFromInline(raw.inputs),
    outputRef: refFromInline(raw.outputs),
    redactionState: "unknown",
    causalParentIds: causalParents(raw),
    timing: {
      startedAt: stringField(raw, "start_time"),
      endedAt: stringField(raw, "end_time"),
    },
    data: {
      source: "langsmith",
      name: stringField(raw, "name"),
      runType,
      inputs: raw.inputs,
      outputs: raw.outputs,
      extra: raw.extra,
    },
  });
}

function normalizeMlflowSpan(raw: Record<string, unknown>, sequence: number): TraceIrEventV2 | null {
  const traceId = stringField(raw, "trace_id") ?? stringField(raw, "traceId");
  const spanId = stringField(raw, "span_id") ?? stringField(raw, "spanId");
  if (!traceId || !spanId || (!raw.inputs && !raw.outputs && !raw.attributes)) {
    return null;
  }

  const spanType = stringField(raw, "span_type") ?? stringField(raw, "spanType");
  const attributes = objectField(raw, "attributes") ?? {};

  return withHash({
    schema: "branchlab.trace_ir.v2",
    traceId,
    runId: traceId,
    spanId,
    parentSpanId: stringField(raw, "parent_span_id") ?? stringField(raw, "parentSpanId"),
    sequence,
    eventKind: eventKindFromRunType(spanType ?? stringField(raw, "name") ?? "unknown"),
    provider: stringFromObject(attributes, "gen_ai.provider.name"),
    model: stringFromObject(attributes, "gen_ai.request.model"),
    inputRef: refFromInline(raw.inputs ?? attributes["mlflow.spanInputs"]),
    outputRef: refFromInline(raw.outputs ?? attributes["mlflow.spanOutputs"]),
    redactionState: "unknown",
    causalParentIds: causalParents(raw),
    timing: {
      startedAt: stringField(raw, "start_time") ?? stringField(raw, "startTime"),
      endedAt: stringField(raw, "end_time") ?? stringField(raw, "endTime"),
      durationMs: numberField(raw, "duration_ms") ?? numberField(raw, "durationMs"),
    },
    data: {
      source: "mlflow",
      name: stringField(raw, "name"),
      spanType,
      attributes,
      inputs: raw.inputs,
      outputs: raw.outputs,
    },
  });
}

function withHash(event: Omit<TraceIrEventV2, "hash">): TraceIrEventV2 {
  return {
    ...event,
    hash: hashTraceIrEvent(event),
  };
}

function eventKindFromV1(type: NormalizedEvent["type"]): TraceIrEventKind {
  if (type.startsWith("run.")) {
    return "run";
  }
  if (type.startsWith("llm.")) {
    return "llm";
  }
  if (type.startsWith("tool.")) {
    return "tool";
  }
  if (type.startsWith("memory.")) {
    return "memory";
  }
  if (type === "policy.decision") {
    return "policy";
  }
  if (type === "error") {
    return "error";
  }
  if (type === "note") {
    return "note";
  }
  return "unknown";
}

function eventKindFromRunType(value: string): TraceIrEventKind {
  const normalized = value.toLowerCase();
  if (normalized.includes("llm") || normalized.includes("chat")) {
    return "llm";
  }
  if (normalized.includes("tool")) {
    return "tool";
  }
  if (normalized.includes("retriev")) {
    return "retrieval";
  }
  if (normalized.includes("chain") || normalized.includes("workflow")) {
    return "workflow";
  }
  if (normalized.includes("error")) {
    return "error";
  }
  return "unknown";
}

function eventKindValue(value: unknown): TraceIrEventKind {
  const allowed = new Set<TraceIrEventKind>([
    "run",
    "llm",
    "tool",
    "memory",
    "policy",
    "retrieval",
    "handoff",
    "approval",
    "error",
    "note",
    "workflow",
    "unknown",
  ]);
  return typeof value === "string" && allowed.has(value as TraceIrEventKind)
    ? (value as TraceIrEventKind)
    : "unknown";
}

function redactionValue(value: unknown): RedactionState {
  return value === "raw" || value === "redacted" || value === "mixed" || value === "unknown"
    ? value
    : "unknown";
}

function timingValue(value: unknown): TraceIrTiming {
  if (!value || typeof value !== "object") {
    return {};
  }
  const record = value as Record<string, unknown>;
  return {
    ts: typeof record.ts === "string" ? record.ts : undefined,
    startedAt: typeof record.startedAt === "string" ? record.startedAt : undefined,
    endedAt: typeof record.endedAt === "string" ? record.endedAt : undefined,
    durationMs: typeof record.durationMs === "number" ? record.durationMs : undefined,
  };
}

function usageFromMeta(meta: NormalizedEvent["meta"]): TraceIrUsage | undefined {
  if (!meta) {
    return undefined;
  }
  return usageValue({
    tokensIn: meta.tokens_in,
    tokensOut: meta.tokens_out,
    costUsd: meta.cost_usd,
  });
}

function usageValue(value: unknown): TraceIrUsage | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const usage: TraceIrUsage = {};
  if (typeof record.tokensIn === "number") {
    usage.tokensIn = record.tokensIn;
  }
  if (typeof record.tokensOut === "number") {
    usage.tokensOut = record.tokensOut;
  }
  if (typeof record.costUsd === "number") {
    usage.costUsd = record.costUsd;
  }
  return Object.keys(usage).length > 0 ? usage : undefined;
}

function policyFromV1(event: NormalizedEvent): TraceIrPolicy | undefined {
  if (event.type !== "policy.decision") {
    return undefined;
  }
  return policyValue({
    decision: event.data.decision,
    severity: event.data.severity,
    ruleId: event.data.rule_id,
    reason: event.data.reason,
  });
}

function policyValue(value: unknown): TraceIrPolicy | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const policy: TraceIrPolicy = {};
  if (record.decision === "allow" || record.decision === "deny" || record.decision === "hold") {
    policy.decision = record.decision;
  }
  if (
    record.severity === "low" ||
    record.severity === "medium" ||
    record.severity === "high" ||
    record.severity === "critical"
  ) {
    policy.severity = record.severity;
  }
  if (typeof record.ruleId === "string") {
    policy.ruleId = record.ruleId;
  }
  if (typeof record.reason === "string") {
    policy.reason = record.reason;
  }
  return Object.keys(policy).length > 0 ? policy : undefined;
}

function inputRefForV1(event: NormalizedEvent): TraceIrRef | undefined {
  if (event.type === "llm.request") {
    return refFromInline(event.data.messages);
  }
  if (event.type === "tool.request") {
    return refFromInline(event.data.args);
  }
  return undefined;
}

function outputRefForV1(event: NormalizedEvent): TraceIrRef | undefined {
  if (event.type === "llm.response") {
    return refFromInline(event.data.text ?? event.data.output);
  }
  if (event.type === "tool.response") {
    return refFromInline(event.data.result ?? event.data.error);
  }
  if (event.type === "llm.request" || event.type === "tool.request") {
    return undefined;
  }
  return refFromInline(event.data);
}

function traceIrMetadataFromV1(event: NormalizedEvent): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    sourceSchema: event.schema,
    type: event.type,
  };
  if (typeof event.data.tool === "string") {
    metadata.tool = event.data.tool;
  }
  if (event.meta && Object.keys(event.meta).length > 0) {
    metadata.meta = event.meta;
  }
  return metadata;
}

function refFromInline(value: unknown): TraceIrRef | undefined {
  return value === undefined ? undefined : { inline: value };
}

function refValue(value: unknown): TraceIrRef | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  return {
    blobSha: typeof record.blobSha === "string" ? record.blobSha : undefined,
    inline: record.inline,
    mediaType: typeof record.mediaType === "string" ? record.mediaType : undefined,
  };
}

function causalParents(raw: Record<string, unknown>): string[] {
  const candidates = raw.causalParentIds ?? raw.causal_parent_ids;
  if (Array.isArray(candidates)) {
    return candidates.filter((item): item is string => typeof item === "string");
  }
  const parent = stringField(raw, "parentSpanId") ?? stringField(raw, "parent_span_id") ?? stringField(raw, "parent_run_id");
  return parent ? [parent] : [];
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  return typeof record[key] === "string" ? record[key] : undefined;
}

function numberField(record: Record<string, unknown>, key: string): number | undefined {
  return typeof record[key] === "number" && Number.isFinite(record[key]) ? record[key] : undefined;
}

function objectField(record: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = record[key];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function stringFromObject(record: Record<string, unknown>, key: string): string | undefined {
  return typeof record[key] === "string" ? record[key] : undefined;
}

function numberFromObject(record: Record<string, unknown>, key: string): number | undefined {
  return typeof record[key] === "number" && Number.isFinite(record[key]) ? record[key] : undefined;
}

function stringDataField(event: NormalizedEvent, key: string): string | undefined {
  return typeof event.data[key] === "string" ? event.data[key] : undefined;
}

function stringMetaField(event: NormalizedEvent, key: string): string | undefined {
  return typeof event.meta?.[key] === "string" ? event.meta[key] : undefined;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);
  return `{${entries.join(",")}}`;
}

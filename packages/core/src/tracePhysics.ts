import { createHash } from "node:crypto";
import {
  buildCausalGraph,
  compareCausalTraces,
  rankCausalCandidates,
  replayFingerprint,
  type CausalCandidate,
  type CausalChange,
  type CausalCompareResult,
  type CausalGraph,
} from "./causal";
import { hashTraceIrEvent, normalizeTraceIrEvent, type TraceIrEventV2 } from "./traceIr";

export type TracePhysicsDiagnosticCode =
  | "duplicate_span_id"
  | "hash_mismatch"
  | "negative_sequence"
  | "non_finite_sequence"
  | "dangling_parent_span"
  | "dangling_causal_parent";

export interface TracePhysicsDiagnostic {
  code: TracePhysicsDiagnosticCode;
  severity: "warning" | "error";
  spanId: string;
  message: string;
  ref?: string;
}

export interface TracePhysicsEvidence {
  eventCount: number;
  roots: string[];
  eventKinds: Record<string, number>;
  providers: Record<string, number>;
  models: Record<string, number>;
  toolCallCount: number;
  policyDecisionCount: number;
  firstSequence: number | null;
  lastSequence: number | null;
  evidenceHash: string;
}

export interface TracePhysicsSummary {
  events: TraceIrEventV2[];
  graph: CausalGraph;
  fingerprint: string;
  diagnostics: TracePhysicsDiagnostic[];
  evidence: TracePhysicsEvidence;
}

export interface TracePhysicsCompare {
  parent: TracePhysicsSummary;
  branch: TracePhysicsSummary;
  parentFingerprint: string;
  branchFingerprint: string;
  firstDivergenceSpanId: string | null;
  firstDivergenceSequence: number;
  changes: CausalChange[];
  heatmap: Record<string, number>;
  candidates: CausalCandidate[];
  diagnostics: TracePhysicsDiagnostic[];
}

export interface TracePhysicsOptions {
  trustExistingHashes?: boolean;
}

export type TracePhysicsInputRecord = Record<string, unknown> | TraceIrEventV2;

export function analyzeTracePhysics(
  records: TracePhysicsInputRecord[],
  options: TracePhysicsOptions = {},
): TracePhysicsSummary {
  const events = records.map((record, index) => normalizeTracePhysicsEvent(record, index, options));
  const graph = buildCausalGraph(events);
  const fingerprint = replayFingerprint(events);
  const diagnostics = validateTracePhysics(records, events, options);
  const evidence = buildEvidence(events, graph, fingerprint);

  return {
    events,
    graph,
    fingerprint,
    diagnostics,
    evidence,
  };
}

export function compareTracePhysics(
  parentRecords: TracePhysicsInputRecord[],
  branchRecords: TracePhysicsInputRecord[],
  options: TracePhysicsOptions = {},
): TracePhysicsCompare {
  const parent = analyzeTracePhysics(parentRecords, options);
  const branch = analyzeTracePhysics(branchRecords, options);
  const compare = compareCausalTraces(parent.events, branch.events);

  return {
    parent,
    branch,
    parentFingerprint: compare.parentFingerprint,
    branchFingerprint: compare.branchFingerprint,
    firstDivergenceSpanId: compare.firstDivergenceSpanId,
    firstDivergenceSequence: compare.firstDivergenceSequence,
    changes: compare.changes,
    heatmap: compare.heatmap,
    candidates: rankCausalCandidates(compare),
    diagnostics: [...parent.diagnostics, ...branch.diagnostics],
  };
}

function validateTracePhysics(
  records: TracePhysicsInputRecord[],
  events: TraceIrEventV2[],
  options: TracePhysicsOptions,
): TracePhysicsDiagnostic[] {
  const diagnostics: TracePhysicsDiagnostic[] = [];
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  const spanIds = new Set(events.map((event) => event.spanId));

  for (const event of events) {
    if (seen.has(event.spanId) && !duplicates.has(event.spanId)) {
      duplicates.add(event.spanId);
      diagnostics.push({
        code: "duplicate_span_id",
        severity: "error",
        spanId: event.spanId,
        message: `Duplicate span id '${event.spanId}' appears more than once in the trace.`,
      });
    }
    seen.add(event.spanId);
  }

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const record = records[index];
    if (!event) {
      continue;
    }
    if (
      !options.trustExistingHashes &&
      record?.schema === "branchlab.trace_ir.v2" &&
      typeof record.hash === "string" &&
      record.hash !== event.hash
    ) {
      diagnostics.push({
        code: "hash_mismatch",
        severity: "error",
        spanId: event.spanId,
        message: `Span '${event.spanId}' hash does not match its canonical Trace IR payload.`,
      });
    }

    if (typeof record?.sequence === "number" && !Number.isFinite(record.sequence)) {
      diagnostics.push({
        code: "non_finite_sequence",
        severity: "error",
        spanId: event.spanId,
        message: `Span '${event.spanId}' has a non-finite sequence value.`,
      });
    }

    if (event.sequence < 0) {
      diagnostics.push({
        code: "negative_sequence",
        severity: "error",
        spanId: event.spanId,
        message: `Span '${event.spanId}' has a negative sequence value.`,
      });
    }
  }

  for (const event of events) {
    if (event.parentSpanId && !spanIds.has(event.parentSpanId)) {
      diagnostics.push({
        code: "dangling_parent_span",
        severity: "error",
        spanId: event.spanId,
        ref: event.parentSpanId,
        message: `Span '${event.spanId}' references missing parent span '${event.parentSpanId}'.`,
      });
    }

    for (const parent of event.causalParentIds) {
      if (parent === event.parentSpanId) {
        continue;
      }
      if (!spanIds.has(parent)) {
        diagnostics.push({
          code: "dangling_causal_parent",
          severity: "error",
          spanId: event.spanId,
          ref: parent,
          message: `Span '${event.spanId}' references missing causal parent '${parent}'.`,
        });
      }
    }
  }

  return diagnostics;
}

function normalizeTracePhysicsEvent(
  record: TracePhysicsInputRecord,
  index: number,
  options: TracePhysicsOptions,
): TraceIrEventV2 {
  const event = normalizeTraceIrEvent(record as unknown as Record<string, unknown>, index);
  if (options.trustExistingHashes && record.schema === "branchlab.trace_ir.v2" && typeof record.hash === "string") {
    return {
      ...event,
      hash: record.hash,
    };
  }
  return event;
}

function buildEvidence(events: TraceIrEventV2[], graph: CausalGraph, fingerprint: string): TracePhysicsEvidence {
  const eventKinds: Record<string, number> = {};
  const providers: Record<string, number> = {};
  const models: Record<string, number> = {};
  let toolCallCount = 0;
  let policyDecisionCount = 0;
  let firstSequence: number | null = null;
  let lastSequence: number | null = null;

  for (const event of events) {
    eventKinds[event.eventKind] = (eventKinds[event.eventKind] ?? 0) + 1;
    if (event.provider) {
      providers[event.provider] = (providers[event.provider] ?? 0) + 1;
    }
    if (event.model) {
      models[event.model] = (models[event.model] ?? 0) + 1;
    }
    if (event.toolCallId) {
      toolCallCount += 1;
    }
    if (event.policy?.decision) {
      policyDecisionCount += 1;
    }
    firstSequence = firstSequence === null ? event.sequence : Math.min(firstSequence, event.sequence);
    lastSequence = lastSequence === null ? event.sequence : Math.max(lastSequence, event.sequence);
  }

  const evidenceWithoutHash = {
    eventCount: events.length,
    roots: graph.roots,
    eventKinds,
    providers,
    models,
    toolCallCount,
    policyDecisionCount,
    firstSequence,
    lastSequence,
    fingerprint,
    eventHashes: events
      .map((event) => ({ sequence: event.sequence, spanId: event.spanId, hash: hashTraceIrEvent(event) }))
      .sort((a, b) => a.sequence - b.sequence || a.spanId.localeCompare(b.spanId)),
  };

  return {
    eventCount: events.length,
    roots: graph.roots,
    eventKinds,
    providers,
    models,
    toolCallCount,
    policyDecisionCount,
    firstSequence,
    lastSequence,
    evidenceHash: sha256(stableStringify(evidenceWithoutHash)),
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
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

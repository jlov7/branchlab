import { createHash } from "node:crypto";
import type { TraceIrEventKind, TraceIrEventV2 } from "./traceIr";

export interface CausalNode {
  spanId: string;
  parentSpanId?: string;
  sequence: number;
  eventKind: TraceIrEventKind;
  hash: string;
  causalParentIds: string[];
}

export interface CausalEdge {
  from: string;
  to: string;
  kind: "parent" | "causal";
}

export interface CausalGraph {
  nodes: CausalNode[];
  edges: CausalEdge[];
  roots: string[];
  byEventKind: Record<string, number>;
}

export interface CausalChange {
  spanId: string;
  kind: "added" | "removed" | "modified";
  before?: TraceIrEventV2;
  after?: TraceIrEventV2;
}

export interface CausalCompareResult {
  parentFingerprint: string;
  branchFingerprint: string;
  firstDivergenceSpanId: string | null;
  firstDivergenceSequence: number;
  changes: CausalChange[];
  heatmap: Record<string, number>;
}

export interface CausalCandidate {
  spanId: string;
  eventKind: TraceIrEventKind;
  confidence: number;
  rationale: string;
}

export function replayFingerprint(events: TraceIrEventV2[]): string {
  const stable = [...events]
    .sort((a, b) => a.sequence - b.sequence || a.spanId.localeCompare(b.spanId))
    .map((event) => `${event.sequence}:${event.spanId}:${event.hash}`)
    .join("\n");
  return createHash("sha256").update(stable).digest("hex");
}

export function buildCausalGraph(events: TraceIrEventV2[]): CausalGraph {
  const nodes: CausalNode[] = [];
  const edges: CausalEdge[] = [];
  const childIds = new Set<string>();
  const byEventKind: Record<string, number> = {};

  for (const event of events) {
    nodes.push({
      spanId: event.spanId,
      parentSpanId: event.parentSpanId,
      sequence: event.sequence,
      eventKind: event.eventKind,
      hash: event.hash,
      causalParentIds: event.causalParentIds,
    });
    byEventKind[event.eventKind] = (byEventKind[event.eventKind] ?? 0) + 1;

    if (event.parentSpanId) {
      edges.push({ from: event.parentSpanId, to: event.spanId, kind: "parent" });
      childIds.add(event.spanId);
    }

    for (const parent of event.causalParentIds) {
      if (parent !== event.parentSpanId) {
        edges.push({ from: parent, to: event.spanId, kind: "causal" });
      }
      childIds.add(event.spanId);
    }
  }

  const roots = nodes
    .filter((node) => !childIds.has(node.spanId) && !node.parentSpanId && node.causalParentIds.length === 0)
    .map((node) => node.spanId);

  return {
    nodes: nodes.sort((a, b) => a.sequence - b.sequence || a.spanId.localeCompare(b.spanId)),
    edges,
    roots,
    byEventKind,
  };
}

export function compareCausalTraces(parent: TraceIrEventV2[], branch: TraceIrEventV2[]): CausalCompareResult {
  const parentBySpan = new Map(parent.map((event) => [event.spanId, event]));
  const branchBySpan = new Map(branch.map((event) => [event.spanId, event]));
  const spanIds = new Set([...parentBySpan.keys(), ...branchBySpan.keys()]);
  const changes: CausalChange[] = [];

  for (const spanId of spanIds) {
    const before = parentBySpan.get(spanId);
    const after = branchBySpan.get(spanId);
    if (!before && after) {
      changes.push({ spanId, kind: "added", after });
      continue;
    }
    if (before && !after) {
      changes.push({ spanId, kind: "removed", before });
      continue;
    }
    if (before && after && before.hash !== after.hash) {
      changes.push({ spanId, kind: "modified", before, after });
    }
  }

  changes.sort((a, b) => sequenceOf(a) - sequenceOf(b) || a.spanId.localeCompare(b.spanId));
  const first = changes[0];
  const heatmap: Record<string, number> = {};
  for (const change of changes) {
    const kind = change.after?.eventKind ?? change.before?.eventKind ?? "unknown";
    heatmap[kind] = (heatmap[kind] ?? 0) + 1;
  }

  return {
    parentFingerprint: replayFingerprint(parent),
    branchFingerprint: replayFingerprint(branch),
    firstDivergenceSpanId: first?.spanId ?? null,
    firstDivergenceSequence: first ? sequenceOf(first) : -1,
    changes,
    heatmap,
  };
}

export function rankCausalCandidates(compare: CausalCompareResult): CausalCandidate[] {
  return compare.changes
    .map((change): CausalCandidate => {
      const event = change.after ?? change.before;
      const eventKind = event?.eventKind ?? "unknown";
      const base =
        eventKind === "tool"
          ? 0.92
          : eventKind === "llm"
            ? 0.86
            : eventKind === "policy"
              ? 0.82
              : eventKind === "memory" || eventKind === "retrieval"
                ? 0.72
                : 0.55;
      return {
        spanId: change.spanId,
        eventKind,
        confidence: Number(Math.max(0.1, base - Math.max(0, sequenceOf(change)) * 0.001).toFixed(3)),
        rationale: rationaleFor(change.kind, eventKind),
      };
    })
    .sort((a, b) => b.confidence - a.confidence || a.spanId.localeCompare(b.spanId))
    .slice(0, 5);
}

function sequenceOf(change: CausalChange): number {
  return change.after?.sequence ?? change.before?.sequence ?? Number.MAX_SAFE_INTEGER;
}

function rationaleFor(kind: CausalChange["kind"], eventKind: TraceIrEventKind): string {
  if (eventKind === "tool") {
    return `A ${kind} tool span can directly alter downstream observations and final outcome.`;
  }
  if (eventKind === "llm") {
    return `A ${kind} model span changes reasoning or generation before later actions.`;
  }
  if (eventKind === "policy") {
    return `A ${kind} policy span changes allow/deny/hold behavior for the run.`;
  }
  if (eventKind === "memory" || eventKind === "retrieval") {
    return `A ${kind} context span can alter what information the agent reasons over.`;
  }
  return `A ${kind} span is part of the first causal diff set.`;
}

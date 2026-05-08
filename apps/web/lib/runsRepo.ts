import { rmSync } from "node:fs";
import { determineOutcome, replayFingerprint, scoreRun, traceIrFromNormalizedEvent } from "@branchlab/core";
import type { BranchExecutionMode, NormalizedEvent, TraceIrEventV2 } from "@branchlab/core";
import { readBlobJson, resetBlobCache, writeBlobJson } from "./blobStore";
import { assertSafeDataReset } from "./dataSafety";
import { resetDbConnection } from "./db";
import { getDb } from "./db";
import { newId } from "./ids";
import { ATL_DIR, DEFAULT_ATL_DIR } from "./paths";

export interface RunSummary {
  id: string;
  createdAt: string;
  source: string;
  mode: BranchExecutionMode;
  status: "success" | "fail" | "unknown";
  durationMs: number;
  costUsd: number;
  tools: string[];
  tags: string[];
  partialParse: boolean;
}

export interface RunAnnotation {
  runId: string;
  tags: string[];
  note: string;
  updatedAt: string;
}

export interface BranchSummary {
  id: string;
  parentRunId: string;
  forkEventId: string;
  branchRunId: string;
  createdAt: string;
  intervention: Record<string, unknown>;
}

export interface TraceFingerprint {
  runId: string;
  fingerprint: string;
  eventCount: number;
  generatedAt: string;
}

export interface ListRunsOptions {
  status?: string;
  search?: string;
  mode?: string;
  tool?: string;
  tag?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface SaveRunInput {
  runId?: string;
  source: string;
  mode: BranchExecutionMode;
  events: NormalizedEvent[];
  partialParse: boolean;
  issues: Array<{ line: number; reason: string }>;
}

export function saveRun(input: SaveRunInput): { runId: string; insertedEvents: number } {
  const db = getDb();
  const now = new Date().toISOString();
  const runId = input.runId ?? input.events[0]?.run_id ?? newId("run");
  const events = input.events.map((event) => ({ ...event, run_id: runId }));
  const status = determineOutcome(events);
  const score = scoreRun(events);

  const firstTs = events[0]?.ts ?? now;
  const lastTs = events[events.length - 1]?.ts ?? firstTs;
  const durationMs = Math.max(0, Date.parse(lastTs) - Date.parse(firstTs));

  db.exec("BEGIN");
  try {
    db.prepare(
      `
      INSERT INTO runs (id, created_at, source, mode, status, duration_ms, cost_usd, meta_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        created_at = excluded.created_at,
        source = excluded.source,
        mode = excluded.mode,
        status = excluded.status,
        duration_ms = excluded.duration_ms,
        cost_usd = excluded.cost_usd,
        meta_json = excluded.meta_json
    `,
    ).run(
      runId,
      firstTs,
      input.source,
      input.mode,
      status,
      durationMs,
      score.costUsd,
      JSON.stringify({
        imported_at: now,
        partial_parse: input.partialParse,
        issues: input.issues,
      }),
    );

    const insertEvent = db.prepare(
      `
      INSERT OR REPLACE INTO events (run_id, event_id, ts, type, call_id, parent_event_id, data_blob_sha, meta_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    );
    const insertTraceIr = db.prepare(
      `
      INSERT OR REPLACE INTO trace_ir_events (
        run_id, span_id, trace_id, sequence, event_kind, parent_span_id, causal_parent_ids_json,
        provider, model, tool_call_id, hash, redaction_state, timing_json, usage_json, policy_json, data_blob_sha
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    );

    db.prepare(`DELETE FROM events WHERE run_id = ?`).run(runId);
    db.prepare(`DELETE FROM trace_ir_events WHERE run_id = ?`).run(runId);

    const traceIrEvents = events.map((event, sequence) => traceIrFromNormalizedEvent(event, sequence));

    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];
      const traceIr = traceIrEvents[index];
      if (!event || !traceIr) {
        continue;
      }
      const callId = typeof event.data.call_id === "string" ? event.data.call_id : null;
      const dataBlobSha = writeBlobJson(event.data);
      insertEvent.run(
        runId,
        event.event_id,
        event.ts,
        event.type,
        callId,
        event.parent_event_id ?? null,
        dataBlobSha,
        JSON.stringify(event.meta ?? {}),
      );

      insertTraceIr.run(
        runId,
        traceIr.spanId,
        traceIr.traceId,
        traceIr.sequence,
        traceIr.eventKind,
        traceIr.parentSpanId ?? null,
        JSON.stringify(traceIr.causalParentIds),
        traceIr.provider ?? null,
        traceIr.model ?? null,
        traceIr.toolCallId ?? null,
        traceIr.hash,
        traceIr.redactionState,
        JSON.stringify(traceIr.timing),
        traceIr.usage ? JSON.stringify(traceIr.usage) : null,
        traceIr.policy ? JSON.stringify(traceIr.policy) : null,
        writeBlobJson(traceIr.data),
      );
    }

    db.prepare(
      `
      INSERT INTO trace_fingerprints (run_id, fingerprint, event_count, generated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(run_id) DO UPDATE SET
        fingerprint = excluded.fingerprint,
        event_count = excluded.event_count,
        generated_at = excluded.generated_at
    `,
    ).run(runId, replayFingerprint(traceIrEvents), traceIrEvents.length, now);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return { runId, insertedEvents: events.length };
}

export function getRun(runId: string): RunSummary | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, created_at, source, mode, status, duration_ms, cost_usd, meta_json FROM runs WHERE id = ?`,
    )
    .get(runId) as
    | {
        id: string;
        created_at: string;
        source: string;
        mode: BranchExecutionMode;
        status: "success" | "fail" | "unknown";
        duration_ms: number;
        cost_usd: number;
        meta_json: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  const tools = listRunTools(runId);
  const annotation = getRunAnnotation(runId);
  const meta = JSON.parse(row.meta_json) as Record<string, unknown>;

  return {
    id: row.id,
    createdAt: row.created_at,
    source: row.source,
    mode: row.mode,
    status: row.status,
    durationMs: row.duration_ms,
    costUsd: row.cost_usd,
    tools,
    tags: annotation?.tags ?? [],
    partialParse: Boolean(meta.partial_parse),
  };
}

export function listRuns(options: ListRunsOptions = {}): RunSummary[] {
  const db = getDb();
  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;

  const rows = db
    .prepare(
      `
      SELECT id, created_at, source, mode, status, duration_ms, cost_usd, meta_json
      FROM runs
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
    )
    .all(limit, offset) as Array<{
    id: string;
    created_at: string;
    source: string;
    mode: BranchExecutionMode;
    status: "success" | "fail" | "unknown";
    duration_ms: number;
    cost_usd: number;
    meta_json: string;
  }>;

  const annotations = listRunAnnotationsByRunId(rows.map((row) => row.id));

  return rows
    .map((row) => {
      const tools = listRunTools(row.id);
      const meta = JSON.parse(row.meta_json) as Record<string, unknown>;
      const annotation = annotations.get(row.id);

      return {
        id: row.id,
        createdAt: row.created_at,
        source: row.source,
        mode: row.mode,
        status: row.status,
        durationMs: row.duration_ms,
        costUsd: row.cost_usd,
        tools,
        tags: annotation?.tags ?? [],
        partialParse: Boolean(meta.partial_parse),
      } satisfies RunSummary;
    })
    .filter((run) => {
      if (options.status && run.status !== options.status) {
        return false;
      }

      if (options.mode && run.mode !== options.mode) {
        return false;
      }

      if (options.tool) {
        const needle = options.tool.toLowerCase();
        if (!run.tools.some((tool) => tool.toLowerCase().includes(needle))) {
          return false;
        }
      }

      if (options.tag) {
        const needle = options.tag.toLowerCase();
        if (!run.tags.some((tag) => tag.toLowerCase().includes(needle))) {
          return false;
        }
      }

      if (options.dateFrom && Date.parse(run.createdAt) < Date.parse(options.dateFrom)) {
        return false;
      }

      if (options.dateTo && Date.parse(run.createdAt) > Date.parse(options.dateTo)) {
        return false;
      }

      if (options.search) {
        const needle = options.search.toLowerCase();
        return (
          run.id.toLowerCase().includes(needle) ||
          run.source.toLowerCase().includes(needle) ||
          run.tools.some((tool) => tool.toLowerCase().includes(needle)) ||
          run.tags.some((tag) => tag.toLowerCase().includes(needle))
        );
      }

      return true;
    });
}

export function getRunEvents(runId: string, offset = 0, limit = 200): NormalizedEvent[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT event_id, ts, type, call_id, parent_event_id, data_blob_sha, meta_json
      FROM events
      WHERE run_id = ?
      ORDER BY ts ASC
      LIMIT ? OFFSET ?
    `,
    )
    .all(runId, limit, offset) as Array<{
    event_id: string;
    ts: string;
    type: NormalizedEvent["type"];
    call_id: string | null;
    parent_event_id: string | null;
    data_blob_sha: string;
    meta_json: string | null;
  }>;

  return rows.map((row) => ({
    schema: "branchlab.trace.v1",
    run_id: runId,
    event_id: row.event_id,
    ts: row.ts,
    type: row.type,
    parent_event_id: row.parent_event_id ?? undefined,
    data: readBlobJson<Record<string, unknown>>(row.data_blob_sha),
    meta: row.meta_json ? (JSON.parse(row.meta_json) as Record<string, unknown>) : undefined,
  }));
}

export function getAllRunEvents(runId: string): NormalizedEvent[] {
  return getRunEvents(runId, 0, 1_000_000);
}

export function getRunTraceIrEvents(runId: string): TraceIrEventV2[] {
  return getRunTraceIrRows(runId, true);
}

export function getRunTraceIrIndex(runId: string): TraceIrEventV2[] {
  return getRunTraceIrRows(runId, false);
}

function getRunTraceIrRows(runId: string, includeData: boolean): TraceIrEventV2[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT trace_id, span_id, sequence, event_kind, parent_span_id, causal_parent_ids_json,
        provider, model, tool_call_id, hash, redaction_state, timing_json, usage_json, policy_json
        ${includeData ? ", data_blob_sha" : ""}
      FROM trace_ir_events
      WHERE run_id = ?
      ORDER BY sequence ASC, span_id ASC
    `,
    )
    .all(runId) as Array<{
    trace_id: string;
    span_id: string;
    sequence: number;
    event_kind: TraceIrEventV2["eventKind"];
    parent_span_id: string | null;
    causal_parent_ids_json: string;
    provider: string | null;
    model: string | null;
    tool_call_id: string | null;
    hash: string;
    redaction_state: TraceIrEventV2["redactionState"];
    timing_json: string;
    usage_json: string | null;
    policy_json: string | null;
    data_blob_sha?: string;
  }>;

  return rows.map((row) => ({
    schema: "branchlab.trace_ir.v2",
    traceId: row.trace_id,
    runId,
    spanId: row.span_id,
    parentSpanId: row.parent_span_id ?? undefined,
    sequence: row.sequence,
    eventKind: row.event_kind,
    provider: row.provider ?? undefined,
    model: row.model ?? undefined,
    toolCallId: row.tool_call_id ?? undefined,
    inputRef: undefined,
    outputRef: undefined,
    hash: row.hash,
    redactionState: row.redaction_state,
    causalParentIds: parseStringArray(row.causal_parent_ids_json),
    timing: parseJson(row.timing_json, {}),
    usage: row.usage_json ? parseJson(row.usage_json, undefined) : undefined,
    policy: row.policy_json ? parseJson(row.policy_json, undefined) : undefined,
    data: includeData && row.data_blob_sha ? readBlobJson<Record<string, unknown>>(row.data_blob_sha) : {},
  }));
}

export function getTraceFingerprint(runId: string): TraceFingerprint | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT run_id, fingerprint, event_count, generated_at FROM trace_fingerprints WHERE run_id = ?`)
    .get(runId) as
    | {
        run_id: string;
        fingerprint: string;
        event_count: number;
        generated_at: string;
      }
    | undefined;

  return row
    ? {
        runId: row.run_id,
        fingerprint: row.fingerprint,
        eventCount: row.event_count,
        generatedAt: row.generated_at,
      }
    : null;
}

export function createBranchRecord(args: {
  parentRunId: string;
  forkEventId: string;
  branchRunId: string;
  intervention: Record<string, unknown>;
}): string {
  const db = getDb();
  const id = newId("branch");

  db.prepare(
    `
    INSERT INTO branches (id, parent_run_id, fork_event_id, created_at, branch_run_id, intervention_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    args.parentRunId,
    args.forkEventId,
    new Date().toISOString(),
    args.branchRunId,
    JSON.stringify(args.intervention),
  );

  return id;
}

export function listBranchesForRun(runId: string): BranchSummary[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT id, parent_run_id, fork_event_id, created_at, branch_run_id, intervention_json
      FROM branches
      WHERE parent_run_id = ? OR branch_run_id = ?
      ORDER BY created_at DESC
    `,
    )
    .all(runId, runId) as Array<{
    id: string;
    parent_run_id: string;
    fork_event_id: string;
    created_at: string;
    branch_run_id: string;
    intervention_json: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    parentRunId: row.parent_run_id,
    forkEventId: row.fork_event_id,
    branchRunId: row.branch_run_id,
    createdAt: row.created_at,
    intervention: parseJson(row.intervention_json, {}),
  }));
}

export function getRunAnnotation(runId: string): RunAnnotation | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT run_id, tags_json, note, updated_at FROM run_annotations WHERE run_id = ?`)
    .get(runId) as
    | {
        run_id: string;
        tags_json: string;
        note: string;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  const parsed = JSON.parse(row.tags_json) as unknown;
  const tags = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  return {
    runId: row.run_id,
    tags,
    note: row.note,
    updatedAt: row.updated_at,
  };
}

export function upsertRunAnnotation(args: { runId: string; tags: string[]; note: string }): RunAnnotation {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO run_annotations (run_id, tags_json, note, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(run_id) DO UPDATE SET
      tags_json = excluded.tags_json,
      note = excluded.note,
      updated_at = excluded.updated_at
  `,
  ).run(args.runId, JSON.stringify(args.tags), args.note, now);

  return {
    runId: args.runId,
    tags: args.tags,
    note: args.note,
    updatedAt: now,
  };
}

export function resetAllData(options: { allowDefaultRoot?: boolean } = {}): void {
  assertSafeDataReset({
    targetDir: ATL_DIR,
    defaultDataDir: DEFAULT_ATL_DIR,
    customRoot: process.env.BRANCHLAB_ROOT,
    allowDefaultRoot: options.allowDefaultRoot,
  });
  resetDbConnection();
  rmSync(ATL_DIR, { recursive: true, force: true });
  resetBlobCache();
}

function listRunTools(runId: string): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT data_blob_sha FROM events WHERE run_id = ? AND type = 'tool.request'
    `,
    )
    .all(runId) as Array<{ data_blob_sha: string }>;

  const tools = new Set<string>();
  for (const row of rows) {
    const data = readBlobJson<Record<string, unknown>>(row.data_blob_sha);
    if (typeof data.tool === "string") {
      tools.add(data.tool);
    }
  }

  return [...tools].sort();
}

function listRunAnnotationsByRunId(runIds: string[]): Map<string, RunAnnotation> {
  if (runIds.length === 0) {
    return new Map();
  }

  const db = getDb();
  const placeholders = runIds.map(() => "?").join(", ");
  const rows = db
    .prepare(`SELECT run_id, tags_json, note, updated_at FROM run_annotations WHERE run_id IN (${placeholders})`)
    .all(...runIds) as Array<{
    run_id: string;
    tags_json: string;
    note: string;
    updated_at: string;
  }>;

  const map = new Map<string, RunAnnotation>();
  for (const row of rows) {
    const parsed = JSON.parse(row.tags_json) as unknown;
    const tags = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    map.set(row.run_id, {
      runId: row.run_id,
      tags,
      note: row.note,
      updatedAt: row.updated_at,
    });
  }

  return map;
}

function parseStringArray(value: string): string[] {
  const parsed = parseJson<unknown>(value, []);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

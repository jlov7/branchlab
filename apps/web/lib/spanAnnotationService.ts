import { getDb } from "./db";
import { newId } from "./ids";

export interface SpanAnnotation {
  id: string;
  runId: string;
  investigationId?: string;
  spanId: string;
  note: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpanAnnotationInput {
  runId: string;
  investigationId?: string;
  spanId: string;
  note: string;
  tags?: string[];
}

export function createSpanAnnotation(input: CreateSpanAnnotationInput): SpanAnnotation {
  const runId = input.runId.trim();
  const spanId = input.spanId.trim();
  const note = input.note.trim();
  if (!runId) {
    throw new Error("runId is required");
  }
  if (!spanId) {
    throw new Error("spanId is required");
  }
  if (!note) {
    throw new Error("note is required");
  }

  const now = new Date().toISOString();
  const annotation: SpanAnnotation = {
    id: newId("span_note"),
    runId,
    investigationId: input.investigationId?.trim() || undefined,
    spanId,
    note,
    tags: normalizeTags(input.tags ?? []),
    createdAt: now,
    updatedAt: now,
  };

  getDb()
    .prepare(
      `
      INSERT INTO span_annotations (
        id, run_id, investigation_id, span_id, note, tags_json, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      annotation.id,
      annotation.runId,
      annotation.investigationId ?? null,
      annotation.spanId,
      annotation.note,
      JSON.stringify(annotation.tags),
      annotation.createdAt,
      annotation.updatedAt,
    );

  return annotation;
}

export function listSpanAnnotations(args: { runId?: string; spanId?: string; limit?: number } = {}): SpanAnnotation[] {
  const db = getDb();
  const limit = args.limit ?? 100;
  const runId = args.runId?.trim();
  const spanId = args.spanId?.trim();
  const rows =
    runId && spanId
      ? db
          .prepare(
            `
            SELECT id, run_id, investigation_id, span_id, note, tags_json, created_at, updated_at
            FROM span_annotations
            WHERE run_id = ? AND span_id = ?
            ORDER BY updated_at DESC
            LIMIT ?
          `,
          )
          .all(runId, spanId, limit)
      : runId
        ? db
            .prepare(
              `
              SELECT id, run_id, investigation_id, span_id, note, tags_json, created_at, updated_at
              FROM span_annotations
              WHERE run_id = ?
              ORDER BY updated_at DESC
              LIMIT ?
            `,
            )
            .all(runId, limit)
        : db
            .prepare(
              `
              SELECT id, run_id, investigation_id, span_id, note, tags_json, created_at, updated_at
              FROM span_annotations
              ORDER BY updated_at DESC
              LIMIT ?
            `,
            )
            .all(limit);

  return (rows as unknown as SpanAnnotationRow[]).map(rowToAnnotation);
}

interface SpanAnnotationRow {
  id: string;
  run_id: string;
  investigation_id: string | null;
  span_id: string;
  note: string;
  tags_json: string;
  created_at: string;
  updated_at: string;
}

function rowToAnnotation(row: SpanAnnotationRow): SpanAnnotation {
  return {
    id: row.id,
    runId: row.run_id,
    investigationId: row.investigation_id ?? undefined,
    spanId: row.span_id,
    note: row.note,
    tags: parseTags(row.tags_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].sort();
}

function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

import { getDb } from "./db";
import { newId } from "./ids";

export interface SavedInvestigation {
  id: string;
  runId: string;
  branchRunId?: string;
  title: string;
  hypothesis: string;
  pinnedSpanIds: string[];
  evidenceHash: string;
  status: "open" | "resolved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface SaveInvestigationInput {
  runId: string;
  branchRunId?: string;
  title: string;
  hypothesis: string;
  pinnedSpanIds: string[];
  evidenceHash: string;
  status?: "open" | "resolved" | "rejected";
}

export interface UpdateInvestigationInput {
  id: string;
  title?: string;
  hypothesis?: string;
  pinnedSpanIds?: string[];
  status?: "open" | "resolved" | "rejected";
}

export function saveInvestigation(input: SaveInvestigationInput): SavedInvestigation {
  const title = input.title.trim();
  const hypothesis = input.hypothesis.trim();
  const evidenceHash = input.evidenceHash.trim();
  if (!input.runId.trim()) {
    throw new Error("runId is required");
  }
  if (!title) {
    throw new Error("title is required");
  }
  if (!hypothesis) {
    throw new Error("hypothesis is required");
  }
  if (!/^[a-f0-9]{64}$/i.test(evidenceHash)) {
    throw new Error("evidenceHash must be a 64-character hex string");
  }

  const now = new Date().toISOString();
  const id = newId("investigation");
  const pinnedSpanIds = normalizePinnedSpanIds(input.pinnedSpanIds);
  const status = input.status ?? "open";

  getDb()
    .prepare(
      `
      INSERT INTO saved_investigations (
        id, run_id, branch_run_id, title, hypothesis, pinned_span_ids_json,
        evidence_hash, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      id,
      input.runId,
      input.branchRunId ?? null,
      title,
      hypothesis,
      JSON.stringify(pinnedSpanIds),
      evidenceHash,
      status,
      now,
      now,
    );

  return {
    id,
    runId: input.runId,
    branchRunId: input.branchRunId,
    title,
    hypothesis,
    pinnedSpanIds,
    evidenceHash,
    status,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateInvestigation(input: UpdateInvestigationInput): SavedInvestigation {
  const id = input.id.trim();
  if (!id) {
    throw new Error("id is required");
  }

  const existing = getInvestigation(id);
  if (!existing) {
    throw new Error("investigation not found");
  }

  const title = input.title === undefined ? existing.title : input.title.trim();
  const hypothesis = input.hypothesis === undefined ? existing.hypothesis : input.hypothesis.trim();
  if (!title) {
    throw new Error("title is required");
  }
  if (!hypothesis) {
    throw new Error("hypothesis is required");
  }

  const pinnedSpanIds =
    input.pinnedSpanIds === undefined ? existing.pinnedSpanIds : normalizePinnedSpanIds(input.pinnedSpanIds);
  const status = input.status ?? existing.status;
  if (!isInvestigationStatus(status)) {
    throw new Error("status must be open, resolved, or rejected");
  }

  const now = new Date().toISOString();
  getDb()
    .prepare(
      `
      UPDATE saved_investigations
      SET title = ?, hypothesis = ?, pinned_span_ids_json = ?, status = ?, updated_at = ?
      WHERE id = ?
    `,
    )
    .run(title, hypothesis, JSON.stringify(pinnedSpanIds), status, now, id);

  return {
    ...existing,
    title,
    hypothesis,
    pinnedSpanIds,
    status,
    updatedAt: now,
  };
}

export function listInvestigations(runId?: string, limit = 50): SavedInvestigation[] {
  const db = getDb();
  const rows = runId
    ? db
        .prepare(
          `
          SELECT id, run_id, branch_run_id, title, hypothesis, pinned_span_ids_json,
            evidence_hash, status, created_at, updated_at
          FROM saved_investigations
          WHERE run_id = ?
          ORDER BY updated_at DESC
          LIMIT ?
        `,
        )
        .all(runId, limit)
    : db
        .prepare(
          `
          SELECT id, run_id, branch_run_id, title, hypothesis, pinned_span_ids_json,
            evidence_hash, status, created_at, updated_at
          FROM saved_investigations
          ORDER BY updated_at DESC
          LIMIT ?
        `,
        )
        .all(limit);

  return (rows as unknown as InvestigationRow[]).map(rowToInvestigation);
}

function getInvestigation(id: string): SavedInvestigation | null {
  const row = getDb()
    .prepare(
      `
      SELECT id, run_id, branch_run_id, title, hypothesis, pinned_span_ids_json,
        evidence_hash, status, created_at, updated_at
      FROM saved_investigations
      WHERE id = ?
    `,
    )
    .get(id) as unknown as InvestigationRow | undefined;

  return row ? rowToInvestigation(row) : null;
}

interface InvestigationRow {
  id: string;
  run_id: string;
  branch_run_id: string | null;
  title: string;
  hypothesis: string;
  pinned_span_ids_json: string;
  evidence_hash: string;
  status: "open" | "resolved" | "rejected";
  created_at: string;
  updated_at: string;
}

function rowToInvestigation(row: InvestigationRow): SavedInvestigation {
  return {
    id: row.id,
    runId: row.run_id,
    branchRunId: row.branch_run_id ?? undefined,
    title: row.title,
    hypothesis: row.hypothesis,
    pinnedSpanIds: parseStringArray(row.pinned_span_ids_json),
    evidenceHash: row.evidence_hash,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function normalizePinnedSpanIds(value: string[]): string[] {
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))].sort();
}

function isInvestigationStatus(value: string): value is SavedInvestigation["status"] {
  return value === "open" || value === "resolved" || value === "rejected";
}

import { getDb } from "./db";

export interface EvidencePackRecord {
  id: string;
  runId: string;
  branchRunId?: string;
  exportId?: string;
  provenance: Record<string, unknown>;
  createdAt: string;
}

export function listEvidencePacks(limit = 50): EvidencePackRecord[] {
  const rows = getDb()
    .prepare(
      `
      SELECT id, run_id, branch_run_id, export_id, provenance_json, created_at
      FROM evidence_packs
      ORDER BY created_at DESC
      LIMIT ?
    `,
    )
    .all(limit) as Array<{
    id: string;
    run_id: string;
    branch_run_id: string | null;
    export_id: string | null;
    provenance_json: string;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    runId: row.run_id,
    branchRunId: row.branch_run_id ?? undefined,
    exportId: row.export_id ?? undefined,
    provenance: parseJson(row.provenance_json),
    createdAt: row.created_at,
  }));
}

function parseJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

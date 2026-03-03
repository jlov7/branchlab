import { getDb } from "./db";
import { newId } from "./ids";
import { readBlobJson, writeBlobJson } from "./blobStore";

export interface ImportIssue {
  line: number;
  reason: string;
}

export interface ImportReport {
  id: string;
  runId: string;
  issues: ImportIssue[];
  createdAt: string;
}

export function createImportReport(runId: string, issues: ImportIssue[]): ImportReport {
  const id = newId("import_report");
  const createdAt = new Date().toISOString();
  const blobSha = writeBlobJson({ runId, issues, createdAt });
  const db = getDb();

  db.prepare(`INSERT INTO import_reports (id, run_id, blob_sha, created_at) VALUES (?, ?, ?, ?)`).run(
    id,
    runId,
    blobSha,
    createdAt,
  );

  db.prepare(`INSERT INTO artifacts (id, owner_type, owner_id, kind, blob_sha, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
    newId("artifact"),
    "run",
    runId,
    "import_validation_report",
    blobSha,
    createdAt,
  );

  return {
    id,
    runId,
    issues,
    createdAt,
  };
}

export function getImportReport(reportId: string): ImportReport | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, run_id, blob_sha, created_at FROM import_reports WHERE id = ?`)
    .get(reportId) as
    | { id: string; run_id: string; blob_sha: string; created_at: string }
    | undefined;

  if (!row) {
    return null;
  }

  const payload = readBlobJson<{ runId: string; issues: ImportIssue[]; createdAt: string }>(row.blob_sha);
  return {
    id: row.id,
    runId: payload.runId,
    issues: payload.issues,
    createdAt: payload.createdAt,
  };
}

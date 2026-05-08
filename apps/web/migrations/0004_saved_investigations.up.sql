CREATE TABLE IF NOT EXISTS saved_investigations (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  branch_run_id TEXT,
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  pinned_span_ids_json TEXT NOT NULL,
  evidence_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_investigations_run_updated ON saved_investigations(run_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_saved_investigations_evidence_hash ON saved_investigations(evidence_hash);

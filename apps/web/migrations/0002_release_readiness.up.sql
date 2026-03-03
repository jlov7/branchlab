CREATE TABLE IF NOT EXISTS run_annotations (
  run_id TEXT PRIMARY KEY,
  tags_json TEXT NOT NULL DEFAULT '[]',
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_run_annotations_updated ON run_annotations(updated_at);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL DEFAULT '',
  payload_json TEXT,
  result_json TEXT,
  error_json TEXT,
  cancel_requested INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_updated ON jobs(status, updated_at);

CREATE TABLE IF NOT EXISTS import_reports (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  blob_sha TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_import_reports_run_created ON import_reports(run_id, created_at);

CREATE TABLE IF NOT EXISTS span_annotations (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  investigation_id TEXT,
  span_id TEXT NOT NULL,
  note TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE,
  FOREIGN KEY (investigation_id) REFERENCES saved_investigations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_span_annotations_run_updated ON span_annotations(run_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_span_annotations_run_span ON span_annotations(run_id, span_id);
CREATE INDEX IF NOT EXISTS idx_span_annotations_investigation ON span_annotations(investigation_id);

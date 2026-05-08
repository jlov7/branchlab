CREATE TABLE IF NOT EXISTS trace_ir_events (
  run_id TEXT NOT NULL,
  span_id TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  event_kind TEXT NOT NULL,
  parent_span_id TEXT,
  causal_parent_ids_json TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  tool_call_id TEXT,
  hash TEXT NOT NULL,
  redaction_state TEXT NOT NULL,
  timing_json TEXT NOT NULL,
  usage_json TEXT,
  policy_json TEXT,
  data_blob_sha TEXT NOT NULL,
  PRIMARY KEY (run_id, span_id),
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trace_ir_run_sequence ON trace_ir_events(run_id, sequence);
CREATE INDEX IF NOT EXISTS idx_trace_ir_run_kind ON trace_ir_events(run_id, event_kind);
CREATE INDEX IF NOT EXISTS idx_trace_ir_run_hash ON trace_ir_events(run_id, hash);
CREATE INDEX IF NOT EXISTS idx_trace_ir_tool_call ON trace_ir_events(run_id, tool_call_id);

CREATE TABLE IF NOT EXISTS trace_fingerprints (
  run_id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  event_count INTEGER NOT NULL,
  generated_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS runtime_executions (
  id TEXT PRIMARY KEY,
  parent_run_id TEXT,
  branch_run_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  provider_id TEXT,
  allow_live_tools INTEGER NOT NULL,
  live_tool_allowlist_json TEXT NOT NULL,
  budget_json TEXT NOT NULL,
  side_effects_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (branch_run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_runtime_executions_branch ON runtime_executions(branch_run_id, created_at);

CREATE TABLE IF NOT EXISTS eval_datasets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  run_ids_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eval_runs (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  results_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (dataset_id) REFERENCES eval_datasets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_eval_runs_dataset_created ON eval_runs(dataset_id, created_at);

CREATE TABLE IF NOT EXISTS evidence_packs (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  branch_run_id TEXT,
  export_id TEXT,
  provenance_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_evidence_packs_run_created ON evidence_packs(run_id, created_at);

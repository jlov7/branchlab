CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  source TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  meta_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  run_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  type TEXT NOT NULL,
  call_id TEXT,
  parent_event_id TEXT,
  data_blob_sha TEXT NOT NULL,
  meta_json TEXT,
  PRIMARY KEY (run_id, event_id),
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_run_ts ON events(run_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_run_type ON events(run_id, type);
CREATE INDEX IF NOT EXISTS idx_events_run_call ON events(run_id, call_id);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  parent_run_id TEXT NOT NULL,
  fork_event_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  branch_run_id TEXT NOT NULL,
  intervention_json TEXT NOT NULL,
  FOREIGN KEY (parent_run_id) REFERENCES runs(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  backend TEXT NOT NULL,
  policy_blob_sha TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS policy_evals (
  id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE,
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS policy_decisions (
  policy_eval_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  call_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  severity TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  meta_json TEXT,
  PRIMARY KEY (policy_eval_id, run_id, call_id),
  FOREIGN KEY (policy_eval_id) REFERENCES policy_evals(id) ON DELETE CASCADE,
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_policy_decisions_run_decision ON policy_decisions(run_id, decision);
CREATE INDEX IF NOT EXISTS idx_policy_decisions_run_severity ON policy_decisions(run_id, severity);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key_env TEXT NOT NULL,
  model TEXT NOT NULL,
  enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  branch_run_id TEXT,
  folder_path TEXT NOT NULL,
  redacted INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exports_run_created ON exports(run_id, created_at);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  blob_sha TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_artifacts_owner ON artifacts(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_kind_created ON artifacts(kind, created_at);

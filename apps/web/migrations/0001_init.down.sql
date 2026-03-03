DROP INDEX IF EXISTS idx_artifacts_kind_created;
DROP INDEX IF EXISTS idx_artifacts_owner;
DROP TABLE IF EXISTS artifacts;

DROP INDEX IF EXISTS idx_exports_run_created;
DROP TABLE IF EXISTS exports;

DROP TABLE IF EXISTS provider_configs;
DROP TABLE IF EXISTS settings;

DROP INDEX IF EXISTS idx_policy_decisions_run_severity;
DROP INDEX IF EXISTS idx_policy_decisions_run_decision;
DROP TABLE IF EXISTS policy_decisions;
DROP TABLE IF EXISTS policy_evals;
DROP TABLE IF EXISTS policies;

DROP TABLE IF EXISTS branches;

DROP INDEX IF EXISTS idx_events_run_call;
DROP INDEX IF EXISTS idx_events_run_type;
DROP INDEX IF EXISTS idx_events_run_ts;
DROP TABLE IF EXISTS events;

DROP TABLE IF EXISTS runs;

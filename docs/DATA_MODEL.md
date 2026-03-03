# Data Model (SQLite)

This is a suggested schema for MVP. Adjust as needed but keep the semantics.

## Runs
`runs`
- `id` TEXT PRIMARY KEY
- `created_at` TEXT (ISO)
- `source` TEXT (e.g., upload filename)
- `mode` TEXT (`replay` | `reexec`)
- `status` TEXT (`success` | `fail` | `unknown`)
- `duration_ms` INTEGER
- `cost_usd` REAL
- `meta_json` TEXT

## Events
`events`
- `run_id` TEXT
- `event_id` TEXT
- `ts` TEXT
- `type` TEXT
- `call_id` TEXT NULL
- `parent_event_id` TEXT NULL
- `data_blob_sha` TEXT (content-addressed JSON)
- `meta_json` TEXT
PRIMARY KEY (`run_id`, `event_id`)

Indexes:
- `(run_id, ts)`
- `(run_id, type)`
- `(run_id, call_id)`

## Branches
`branches`
- `id` TEXT PRIMARY KEY
- `parent_run_id` TEXT
- `fork_event_id` TEXT
- `created_at` TEXT
- `branch_run_id` TEXT
- `intervention_json` TEXT

## Policy versions
`policies`
- `id` TEXT PRIMARY KEY
- `name` TEXT
- `description` TEXT
- `backend` TEXT (`yaml` | `rego_wasm`)
- `policy_blob_sha` TEXT
- `created_at` TEXT

## Policy evaluations
`policy_evals`
- `id` TEXT PRIMARY KEY
- `policy_id` TEXT
- `run_id` TEXT
- `created_at` TEXT
- `summary_json` TEXT

`policy_decisions`
- `policy_eval_id` TEXT
- `run_id` TEXT
- `call_id` TEXT
- `decision` TEXT
- `severity` TEXT
- `rule_id` TEXT
- `reason` TEXT
- `meta_json` TEXT
PRIMARY KEY (`policy_eval_id`, `run_id`, `call_id`)

Indexes:
- `(run_id, decision)`
- `(run_id, severity)`

## Settings
`settings`
- `key` TEXT PRIMARY KEY
- `value_json` TEXT
- `updated_at` TEXT

## Provider configs
`provider_configs`
- `id` TEXT PRIMARY KEY
- `name` TEXT
- `kind` TEXT (`openai` | `anthropic` | `compatible`)
- `base_url` TEXT
- `api_key_env` TEXT
- `model` TEXT
- `enabled` INTEGER
- `created_at` TEXT
- `updated_at` TEXT

## Exports
`exports`
- `id` TEXT PRIMARY KEY
- `run_id` TEXT
- `branch_run_id` TEXT NULL
- `folder_path` TEXT
- `redacted` INTEGER
- `created_at` TEXT

Indexes:
- `(run_id, created_at)`

## Artifacts
`artifacts`
- `id` TEXT PRIMARY KEY
- `owner_type` TEXT (`run` | `policy` | `export`)
- `owner_id` TEXT
- `kind` TEXT (`trace` | `policy_wasm` | `policy_source` | `report_html` | `json`)
- `blob_sha` TEXT
- `created_at` TEXT

Indexes:
- `(owner_type, owner_id)`
- `(kind, created_at)`

## Run annotations
`run_annotations`
- `run_id` TEXT PRIMARY KEY
- `tags_json` TEXT
- `note` TEXT
- `updated_at` TEXT

Indexes:
- `(updated_at)`

## Jobs
`jobs`
- `id` TEXT PRIMARY KEY
- `type` TEXT (`import` | `policy_eval` | `export`)
- `status` TEXT (`queued` | `running` | `succeeded` | `failed` | `canceled`)
- `progress` INTEGER (`0..100`)
- `message` TEXT
- `payload_json` TEXT NULL
- `result_json` TEXT NULL
- `error_json` TEXT NULL
- `cancel_requested` INTEGER
- `created_at` TEXT
- `updated_at` TEXT

Indexes:
- `(status, updated_at)`

## Import reports
`import_reports`
- `id` TEXT PRIMARY KEY
- `run_id` TEXT
- `blob_sha` TEXT
- `created_at` TEXT

Indexes:
- `(run_id, created_at)`

## Blob store
Blobs are JSON stored at:
- `.atl/blobs/<sha256>.json`

Keep blobs immutable.

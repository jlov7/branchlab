# Architecture — Agent Twin Lab (BranchLab)

## 1) Overview

BranchLab is a local-first app composed of:

- **Web UI** (Next.js) — timeline, forking, compare, policy lab
- **Core library** (`packages/core`) — trace normalization, diff, blame heuristics, scoring
- **Policy engine** (`packages/policy`) — policy evaluation with:
  - Built-in rule DSL (YAML)
  - Rego/WASM (OPA) adapter (required in v1)
- **Local persistence**
  - SQLite for metadata + indexes
  - filesystem blobs for large payloads under `.atl/blobs/`

## 2) Data flow (high level)

1. Import JSONL → stream parse → normalize → store events
2. Build derived views:
   - event index (by time, type)
   - tool-call join (request/response pairs)
   - memory read/write links
3. UI queries:
   - run summary
   - timeline slices
   - event inspector
4. Fork:
   - create branch record with intervention specification
   - generate derived run:
     - replay-only: apply overlay patches to the event stream
     - re-execution: run “demo agent” pipeline, stubbing tools by trace unless enabled
5. Compare:
   - compute diff graph between original and branch
   - compute “first divergence” + blame candidates
6. Policy:
   - run policy evaluation over tool call events
   - attach decisions/violations to runs
7. Export:
   - assemble bundle (report + normalized JSON + diffs + policy)

## 3) Determinism model

### Replay (deterministic)
- No external calls are permitted.
- UI must clearly show: “Replay: deterministic”.

### Re-execution (non-deterministic)
- Model calls may be re-run (requires user to configure API keys).
- Tool calls are stubbed by recorded artifacts by default.
- Live tool calls require an explicit opt-in per run + per tool allowlist.

## 4) Storage

### SQLite tables (suggested)
See `docs/DATA_MODEL.md`.

### Blob store
- Large payloads stored as content-addressed files:
  - path: `.atl/blobs/<sha256>.json`
- SQLite stores only the hash + metadata.

## 5) Trace ingestion adapters

- Internal normalized schema is stable and versioned.
- Adapters convert other trace formats to the normalized schema.

## 6) Performance

- Streaming ingestion; avoid loading entire trace into memory.
- Timeline UI uses virtualization.
- Derived indexes computed incrementally.

## 7) Security

- Treat traces as untrusted input.
- Escape all HTML.
- Never eval code from traces.
- Redaction pipeline:
  - optional PII detection heuristics
  - render redacted by default in share mode

## 8) Extensibility

- Plugin interface:
  - trace adapters
  - scoring plugins
  - policy backends
- Export format designed for later “ProofPack” style signing if desired.

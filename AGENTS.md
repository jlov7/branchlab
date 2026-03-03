# Agent Twin Lab (BranchLab) — Codex build instructions

This repo is designed for autonomous end-to-end implementation by Codex.

## Non-negotiables (Definition of Done)

Codex must not stop until ALL of the following are true:

- `make dev` starts the product locally and the UI is usable end-to-end.
- `make check` passes (lint + typecheck + unit tests).
- `make e2e` passes (Playwright).
- `make demo` imports the included sample traces and shows a complete replay + fork + compare flow.
- Docs in `/docs` and the main `README.md` match the shipped behavior.
- UI is **not** default-template bland (see `/docs/UX_UI_SPEC.md` for concrete requirements).

## Quickstart commands (Codex should use these)

- `make setup` — install dependencies
- `make dev` — run locally
- `make check` — run quality gates
- `make e2e` — run browser tests
- `make demo` — seed demo data + open viewer

If a command fails, fix the root cause, update docs, and re-run the full gate.

## Build constraints

- Local-first by default (no cloud accounts required).
- Secure-by-default: never execute arbitrary code from traces; treat trace payloads as untrusted input.
- Deterministic replay must never call external tools/models unless the user explicitly chooses "Re-execution" mode.
- All data persistence must be explicit and inspectable (SQLite + files under `.atl/`).

## UX quality bar

Codex must implement the UX/UI requirements in `/docs/UX_UI_SPEC.md`, including:

- purposeful landing page
- strong visual hierarchy + typography
- smooth but subtle motion
- rich empty states and onboarding
- trace timeline + diff views that feel like professional developer tooling

## Repo conventions

- TypeScript everywhere for the web app.
- Keep a clean architecture:
  - `apps/web` (Next.js UI)
  - `packages/core` (trace model, parsing, diff, scoring)
  - `packages/policy` (policy engine + Rego/WASM adapter)
  - `packages/sdk` (instrumentation helpers)
- Prefer pure functions in `packages/core` for testability.
- Add unit tests for core algorithms (diff, blame, policy decisions).
- Add Playwright tests for the main golden flows.

## What to read first

Codex must read these files before coding:

- `/docs/PRD.md`
- `/docs/UX_UI_SPEC.md`
- `/docs/ARCHITECTURE.md`
- `/docs/TRACE_FORMATS.md`
- `/docs/COUNTERFACTUALS.md`
- `/docs/POLICY_ENGINE.md`
- `/docs/ACCEPTANCE_CHECKLIST.md`

## Known “gotchas”

- File upload limits: implement chunked upload or stream-to-disk for large traces.
- Time zones: render timestamps consistently; store as ISO-8601 UTC.
- PII: implement redaction toggles and safe defaults (see `/docs/SECURITY_PRIVACY.md`).

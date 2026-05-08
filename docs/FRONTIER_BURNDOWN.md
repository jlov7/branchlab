# Frontier Burn-Down

Status date: May 8, 2026

This is the implementation burn-down for taking BranchLab from the Phase 0 + Trace IR foundation to the remaining frontier-grade system.

## Workstream Status

- [x] `F01` Trace IR persistence: store Trace IR v2 rows, hashes, causal parents, provider/model/tool metadata, and fingerprints during ingest/branch save.
- [x] `F02` Trace IR compare/export: expose Trace IR rows, replay fingerprints, causal diff, divergence heatmap, and provenance in compare and exports.
- [x] `F03` Causal Debugger: branch DAG, intervention ledger, causal graph, candidate ranking, first-divergence explanation, and UI/API surface.
- [x] `F04` Eval Lab: datasets from runs, deterministic rubric checks, pairwise branch comparison, regression gates, history, API, and UI.
- [x] `F05` Policy Lab v2: richer YAML conditions, PII/secrets detectors, dataflow warnings, tool-risk scoring, impact explanation, tests.
- [x] `F06` Runtime Lab: re-exec execution records, budgets, side-effect audit trail, live-tool allowlist evidence, API, and UI.
- [x] `F07` Evidence Pack: redacted HTML, normalized v1 trace, Trace IR v2, causal diff, eval results, policy results, provenance hashes, environment metadata, and executive summary.
- [x] `F08` Workbench UX: navigation and dense debugger-grade screens for Causality, Eval Lab, Runtime Lab, and Evidence Packs.
- [x] `F09` Verification: unit tests, E2E smoke for new pages, perf budget, dependency audit, SAST, secret scan.
- [x] `F10` Investigation workflow: saved investigations, status-scoped saved views, resolve/reject/reopen lifecycle, span pins, selected-investigation reviewer span notes, and evidence-pack exports.
- [x] `F11` Import telemetry: structured sync/async import telemetry, recent job ledger, and cockpit cancellation controls.
- [x] `F12` Dependency posture: clear production dependency audit at moderate-or-higher severity.
- [x] `F13` Public repo polish: automated docs-link gate, README/PR/contribution gate alignment, and docs hub path cleanup.

## Definition Of Done

- Existing replay, fork, compare, policy, export, settings, and demo flows remain green.
- New frontier APIs return deterministic, evidence-oriented JSON.
- Every destructive or side-effectful runtime path has an explicit audit record.
- Exports contain enough provenance to validate what was analyzed without trusting UI state.
- Reviewer hypotheses and span notes are exported as redacted evidence artifacts.
- `pnpm check`, `pnpm e2e`, `pnpm audit --prod --audit-level moderate`, `pnpm sast`, and `pnpm scan:secrets` pass.

## Verification Evidence

- `pnpm check`: passed on May 8, 2026.
- `pnpm e2e`: passed on May 8, 2026 with 13 Playwright tests.
- `pnpm e2e:matrix`: passed on May 8, 2026 across Chromium, Firefox, and WebKit visual snapshots.
- `pnpm audit --prod --audit-level moderate`: passed with no known vulnerabilities.
- `pnpm sast`: passed.
- `pnpm scan:secrets`: passed.
- `pnpm --filter @branchlab/web perf:budget`: passed at 100k events with ingest `22972.79ms`, compare `0.08ms`, RSS `460MB`.
- 1M-event scale run: passed in a throwaway temp root with ingest `280738.28ms`, compare `0.06ms`, RSS `1737MB`.
- `pnpm --filter @branchlab/web benchmark:suite`: passed.
- `pnpm demo`: passed.
- `pnpm smoke:prod`: passed.
- `pnpm docs:links`: passed with 61 Markdown files checked.
- `pnpm preflight`: passed on May 8, 2026 with the docs-link gate included.

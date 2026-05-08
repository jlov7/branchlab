# Frontier Audit

Status date: May 8, 2026

## Current Position

BranchLab has moved from a polished March 2026 MVP/release baseline to a frontier-grade local reliability lab implementation slice with canonical Trace IR persistence, causal debugging, evals, policy impact checks, runtime audit records, and evidence packs.

The March 2026 release artifacts remain useful historical evidence, but they are no longer treated as proof that the current system has no residual risk. The current quality source of truth is the live gate output plus this audit.

## Phase 0 Findings

- Dependency security: the May 2026 audit found a high-severity Next.js advisory in the installed 15.5.x line. The baseline must stay on a patched Next 15 release unless and until a separate Next 16 compatibility pass is completed.
- Linting: `next lint` is deprecated and should not be part of the future release gate.
- Data safety: tests and benchmark scripts must run under isolated `BRANCHLAB_ROOT` data directories so they never reset the user's real `.atl` folder.
- Documentation: older “100/100” and “no residual risk” claims are historical, not current frontier status.

## Implemented In This Slice

- Patched Next.js to the safe 15.5 patch line.
- Switched the web lint command to ESLint CLI with flat config.
- Added explicit reset safety checks for destructive local data deletion.
- Isolated Vitest, Playwright, performance, benchmark, and profile harness data roots.
- Added Trace IR v2 as a provider-neutral canonical event model with deterministic hashing.
- Added initial Trace IR adapters for BranchLab v1, OTel GenAI, OpenAI/Anthropic provider envelopes, LangSmith-style runs, MLflow-style spans, and malformed generic JSONL.
- Upgraded the SDK to emit Trace IR v2 and OTel-compatible GenAI spans.
- Persisted Trace IR v2 rows, replay fingerprints, causal parent IDs, and content-addressed payload references during ingest and branch save.
- Added causal compare/fingerprint fast paths, branch DAG summaries, first-divergence heatmaps, and causal candidate ranking.
- Added Eval Lab datasets, deterministic rubric checks, pairwise regression gates, history API, and UI.
- Added Policy Lab v2 YAML conditions for PII/secrets, content matching, tool risk scoring, and decision metadata.
- Added Runtime Lab execution records for re-exec/replay budgets, live-tool allowlist state, and side-effect audit trails.
- Added Evidence Pack exports with redacted HTML, normalized trace, Trace IR v2, causal diff, eval results, policy results, provenance, and environment metadata.
- Added dense workbench pages for Causality, Eval Lab, Runtime, and Evidence Packs.
- Optimized large-run persistence with cached/sharded blob writes and Trace IR fingerprint fast-path compare.
- Added saved investigations, span-level reviewer annotations, evidence-pack investigation/span-note artifacts, import telemetry, and cockpit import cancellation controls.

## Current Residual Risks

- Re-execution still uses the existing lightweight provider adapter path, not a full hosted OpenAI Responses/Agents runtime with hosted-tool traces, sandbox state, and approval semantics.
- Next 16, React, Vitest, Playwright, and other larger dependency upgrades remain separate compatibility work.
- `pnpm audit --prod --audit-level high` passes, but 11 moderate dependency advisories remain.
- The 1M-event scale gate passed with a temporary local data root; import telemetry is now visible, but chunk-level streaming progress and throughput charts remain future work.

## Required Gate For This Slice

- [x] `pnpm check`
- [x] `pnpm e2e`
- [x] `pnpm audit --prod --audit-level high`
- [x] `pnpm sast`
- [x] `pnpm scan:secrets`
- [x] `pnpm --filter @branchlab/web perf:budget`
- [x] `pnpm --filter @branchlab/web benchmark:suite`
- [x] `pnpm e2e:matrix`
- [x] `pnpm demo`
- [x] `pnpm smoke:prod`

Gate notes:
- `pnpm audit --prod --audit-level high` exits cleanly; 11 moderate advisories remain.
- E2E ran with an isolated data root (`playwright:dataRoot=/tmp/branchlab-e2e-*`).
- 100k-event perf budget passed with ingest `23631.74ms`, compare `0.07ms`, RSS `483MB`.
- 1M-event scale gate passed in a throwaway temp root with ingest `280738.28ms`, compare `0.06ms`, RSS `1737MB`.

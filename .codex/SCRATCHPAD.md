## Current Task
Autonomous frontier burn-down: Trace Physics workflow, span annotations, evidence packs, import telemetry, and causal navigation.

## Status
Trace physics kernel, golden corpus, product-service integration, UI exposure, saved investigations, lifecycle updates, span pinning, span annotations, evidence-pack investigation/span-note exports, import telemetry, cancellation controls, and causal annotation navigation complete and verified.

## Active Plan
1. [x] Write design spec and implementation plan
2. [x] Add RED tests for trace physics kernel
3. [x] Implement `analyzeTracePhysics()` / `compareTracePhysics()`
4. [x] Add golden trace corpus fixtures and disk-backed tests
5. [x] Wire compare, causal, and evidence services to trace physics
6. [x] Add web integration tests
7. [x] Surface trace-physics evidence in Compare, Causality, and Evidence UI
8. [x] Add saved investigations keyed by evidence hash
9. [x] Run targeted tests, `pnpm check`, `pnpm e2e`, and `pnpm e2e:matrix`
10. [x] Add investigation resolve/reject/reopen lifecycle updates
11. [x] Make causal graph spans selectable investigation pins
12. [x] Export redacted `investigations.json` and investigation provenance counts in evidence packs
13. [x] Add durable span annotations linked to runs, optional investigations, and span IDs
14. [x] Export redacted `span_annotations.json` and span-note provenance counts in evidence packs
15. [x] Add structured import telemetry to sync and async import results
16. [x] Surface recent import job telemetry on the home workbench
17. [x] Add workbench cancel control for active import jobs
18. [x] Make candidate rows select spans in the Causal Debugger
19. [x] Add all/selected-span filtering for span annotations

## Decisions Made
- Add a deep `tracePhysics` module on top of existing Trace IR and causal utilities instead of rewriting persistence or UI callers in this slice.
- Treat the golden corpus as the core quality gate for adapter and causal semantics.
- Keep validation diagnostics deterministic and compact, with stable diagnostic codes.
- Add `trustExistingHashes` for persisted Trace IR rows because the database stores canonical hashes but not full input/output refs.
- Keep existing API response fields intact while adding `tracePhysics` payloads for new consumers.
- Store investigations as first-class local domain artifacts, not settings, because they are evidence-linked workflow records.
- Keep graph span selection as the first annotation affordance in this slice, reserving generalized annotations for the next data-model pass.
- Keep span annotations append-only for now because reviewer notes are evidence artifacts and edit semantics need a stronger audit trail.
- Use persisted async job `result_json` as the import telemetry artifact instead of adding a redundant table.
- Reuse the existing job cancellation API in the cockpit rather than adding a second import-specific cancel endpoint.
- Use keyboard-accessible candidate rows to focus causal spans instead of adding separate tiny row controls.

## Open Questions
- Next Karpathy move: add richer causal graph manipulation, annotation edit history, and saved investigation views.

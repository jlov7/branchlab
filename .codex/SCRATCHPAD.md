## Current Task
Autonomous Karpathy-grade final audit: remove residual dependency advisories, close remaining product/debugger gaps, and refresh trust artifacts.

## Status
Final hardening slice implemented. Production dependency audit is clean at moderate-or-higher severity, Causal Debugger investigation views are improved, docs are refreshed, and release-style gates are passing.

## Active Plan
1. [x] Inspect repo state, existing plans, scripts, TODOs, and dependency posture
2. [x] Clear moderate production audit advisories
3. [x] Add durable saved-investigation filtering/views to the Causal Debugger
4. [x] Add final audit scorecard and refresh docs that mention residual advisories
5. [x] Run security, quality, E2E, visual, and repo hygiene gates
6. [ ] Commit and push the completed slice

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
- Use narrow `pnpm` overrides for vulnerable transitive packages instead of a broad toolchain upgrade in this hardening slice.
- Attach new causal span notes to the explicitly selected investigation, not the first investigation in the payload.

## Open Questions
- Whether the remaining OpenAI hosted re-exec/sandbox roadmap should be a separate explicit milestone after this repo-hardening slice.

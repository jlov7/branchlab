## Current Task
Autonomous public-readiness final pass: repo structure, README/docs quality, automated docs-link hygiene, and release gate alignment.

## Status
Final preflight passed on the patched Next 15.5.16 line. A fresh `pnpm preflight` exposed a real 100k-event ingest regression and a state-coupled visual matrix baseline; both are fixed.

## Active Plan
1. [x] Inspect repo state, docs hub, README, ignored junk, and existing release scripts
2. [x] Add Markdown/local asset link checker
3. [x] Wire docs link gate into package scripts, Makefile, PR template, contributing guide, and preflight
4. [x] Align dependency audit script with moderate-or-higher public standard
5. [x] Fix docs hub diagram paths and remove ignored `.DS_Store` files
6. [x] Run final gates
7. [x] Fix 100k-event ingest regression found during final preflight
8. [x] Rerun full preflight after the perf fix, Next patch, and visual determinism fix
9. [x] Commit and push the completed slice

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

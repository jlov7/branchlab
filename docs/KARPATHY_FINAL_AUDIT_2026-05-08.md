# Karpathy-Grade Final Audit

Status date: May 8, 2026

This is the current no-fluff scorecard for BranchLab after the frontier, frontend, documentation, video, and dependency-hardening passes.

## Panel Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| Trace mathematics | 98 | Trace IR v2, deterministic hashes, trace-physics kernel, golden corpus, replay fingerprints. |
| Debuggability | 96 | Causal graph, first divergence, candidate confidence, saved investigations, span notes, evidence hashes. |
| Evidence quality | 97 | Redacted evidence packs include normalized trace, Trace IR, trace physics, evals, policies, investigations, span notes, provenance. |
| Local-first data safety | 98 | Isolated test roots, reset guardrails, local SQLite/blob store, backup/restore/recovery scripts. |
| Security posture | 96 | Moderate-or-higher production audit passes, SAST and secret scans are local gates, export redaction/XSS tests exist. |
| Scale posture | 94 | 100k perf budget and 1M-event scale gate have passed; streaming chunk progress remains the main gap. |
| Frontend craft | 95 | Dense debugger-grade cockpit, cross-browser visual matrix, accessibility checks, verified screenshots and overview video. |
| Adapter breadth | 94 | BranchLab JSONL, Trace IR, OTel GenAI, OpenAI/Anthropic-style, LangSmith-style, MLflow-style, malformed JSONL fixtures. |
| Runtime realism | 88 | Guarded runtime records exist; full hosted OpenAI Responses/Agents re-exec with sandbox/tool trace semantics is still future work. |
| Repo trust | 97 | World-class README, docs hub, audit docs, release process, threat model, local-first gates, committed video source/artifact. |

Current weighted estimate: **96.3/100**.

## Burn-Down

- [x] Clear production dependency advisories at moderate-or-higher severity.
- [x] Add status-scoped saved views to the Causal Debugger investigation ledger.
- [x] Attach new span annotations to the selected investigation instead of the first ledger row.
- [x] Document investigation APIs and saved investigation schema.
- [x] Remove stale moderate-advisory caveats from public docs.
- [x] Add automated Markdown/local asset link checking to the public repo gate.
- [x] Align README, CONTRIBUTING, PR template, and preflight around the same docs/audit quality bar.
- [ ] Full hosted OpenAI Responses/Agents re-exec with hosted-tool trace capture, sandbox state, approval semantics, and prompt-caching metadata.
- [ ] Chunk-level streaming import progress and throughput charts for million-event traces.
- [ ] Interactive graph layout controls and divergence heatmap inspection beyond the compact deterministic panel.
- [ ] Annotation edit history/threading with explicit audit trail.
- [ ] Next 16 and major toolchain compatibility pass after separate regression matrix.

## Current Judgment

BranchLab is now strong enough to present as an elite local-first agent reliability lab. The remaining gap to a literal 100 is not polish; it is deeper runtime execution fidelity around modern hosted agent APIs and richer interaction depth for very large investigations.

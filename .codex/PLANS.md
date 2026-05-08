# BranchLab Public-Release ExecPlan

## Purpose / Big Picture

Take BranchLab from pre-release quality to true public-release quality with explicit, verifiable completion criteria across reliability, security, performance, developer experience, and operational readiness.

Canonical task board: `docs/plans/2026-03-03-release-readiness-master.md`.

## Progress

- [x] Initialize exhaustive release tracker (`R01`-`R45`)
- [x] Complete all `P0` items (`R01`-`R31`, `R42`, `R44`, `R45`)
- [x] Complete all `P1` items (`R32`-`R41`, `R43`)
- [x] Produce final release report and sign-off artifact

## Surprises & Discoveries

- Date: 2026-03-03
  Discovery: Next.js dev server reuse and stale `.next` artifacts can invalidate otherwise healthy E2E runs.
  Impact: Release gates must enforce deterministic startup conditions.
- Date: 2026-03-03
  Discovery: secret/sast scans can false-positive after build artifacts unless `.next` and test fixtures are excluded.
  Impact: security scripts now include explicit glob exclusions while preserving source coverage.
- Date: 2026-03-03
  Discovery: restore workflow broke when backups lived under `.atl/backups` and when argv passed `--`.
  Impact: restore script now handles absolute paths, in-place backups, and safe rename targets.

## Decision Log

- Date: 2026-03-03
  Decision: Treat `make preflight` as mandatory local source-of-truth gate independent of hosted CI.
  Rationale: User requirement to avoid paid GitHub dependencies and maintain repeatable release checks.
  Alternatives considered: hosted-only gating.

## Outcomes & Retrospective

- Completed `R01`-`R45` with all tracker items marked done.
- Added release-hardened data safety, security, async jobs, UX productivity features, and expanded test coverage.
- Produced release artifacts and final go/no-go report.

## Verification Evidence

- See `docs/plans/2026-03-03-release-readiness-master.md` (per-ID evidence).
- See `docs/RELEASE_REPORT.md` (gate summary + artifacts).

---

# BranchLab Frontend 100/100 ExecPlan

## Purpose / Big Picture

Raise BranchLab frontend quality from current strong beta to world-class release-grade UX/UI quality across 12 explicit scoring pillars, with objective verification evidence and no paid-CI dependency.

Canonical task board: `docs/plans/2026-03-03-frontend-100-master-plan.md`.

## Progress

- [x] Baseline scorecard established with current pillar scores
- [x] 12-pillar target model defined (100/100 target per pillar)
- [x] Exhaustive task backlog created (`UX001`-`UX120`)
- [x] Execute Wave A (design foundations and component system)
- [x] Execute Wave B (core screen rewrites and IA polish)
- [x] Execute Wave C (interaction, data UX, responsive, a11y, performance)
- [x] Execute Wave D (final QA gates + panel-style re-score)

## Surprises & Discoveries

- Date: 2026-03-03
  Discovery: Frontend quality is bottlenecked less by missing features and more by design-system consistency + interaction polish depth.
  Impact: Prioritize component/token unification before further feature layering.
- Date: 2026-03-03
  Discovery: Existing local-first quality gates are strong and should remain source-of-truth.
  Impact: Keep GitHub CI optional/non-blocking and improve local visual/a11y/perf gates.

## Decision Log

- Date: 2026-03-03
  Decision: Use a 12-pillar score model rather than a single blended UX score.
  Rationale: Makes progress measurable and prevents overfocusing on visuals while neglecting accessibility/performance/reliability.
  Alternatives considered: one weighted aggregate score only.
- Date: 2026-03-03
  Decision: Keep one master frontend tracker with 120 tasks instead of multiple fragmented plans.
  Rationale: Reduces drift and ensures no release-critical UX tasks are lost.
  Alternatives considered: separate plans per screen.

## Outcomes & Retrospective

- Completed task backlog `UX001`-`UX120` and checked all trackers.
- Added/updated component primitives, shell/navigation, core journey surfaces, responsive/a11y hardening, and compare/policy/run-report UX polish.
- Added matrix visual gate to `preflight` and reconfirmed full local gate pass.

## Verification Evidence

- `make preflight` (green on 2026-03-03, includes `e2e:matrix`).
- `make check`, `make e2e`, `make demo`, `make e2e-matrix`.
- Master tracker: `docs/plans/2026-03-03-frontend-100-master-plan.md`.

---

# BranchLab Frontier Upgrade ExecPlan

## Purpose / Big Picture

Take BranchLab from a polished MVP/reference implementation to a frontier-grade, local-first agent reliability lab that can ingest modern agent traces, replay them deterministically, run counterfactual investigations, evaluate quality and policy impact, and export evidence-grade reports.

Success for the current implementation slice means Phase 0 is stable again, stale quality claims are recalibrated, and Trace IR v2 exists as a tested foundation for later runtime, eval, policy, and UX upgrades.

## Progress

- [x] Complete repo audit and identify current baseline risks
- [x] Patch high-severity Next.js advisory and remove deprecated `next lint`
- [x] Isolate tests, E2E, perf, and benchmark data roots from the real `.atl`
- [x] Replace stale “100/100/no residual risk” docs with living frontier-audit status
- [x] Add Trace IR v2 core types, deterministic hashing, and provider-neutral adapter outputs
- [x] Add adapter fixtures/tests for BranchLab v1, OTel GenAI, OpenAI Responses/Agents-style, Anthropic, LangSmith, MLflow, and malformed generic JSONL
- [x] Upgrade the SDK to emit richer BranchLab and OTel-compatible events
- [x] Run Phase 0 quality gates without relying on stale assumptions
- [x] F01 Trace IR persistence: store Trace IR v2 rows, hashes, causal parents, provider/model/tool metadata, and fingerprints
- [x] F02 Trace IR compare/export: expose Trace IR rows, replay fingerprints, causal diff, divergence heatmap, and provenance
- [x] F03 Causal Debugger: branch DAG, intervention ledger, causal graph, candidate ranking, first-divergence explanation, API, and UI
- [x] F04 Eval Lab: datasets from runs, deterministic rubric checks, pairwise branch comparison, regression gates, history, API, and UI
- [x] F05 Policy Lab v2: richer YAML conditions, PII/secrets detectors, dataflow warnings, tool-risk scoring, impact explanation, tests
- [x] F06 Runtime Lab: re-exec execution records, budgets, side-effect audit trail, live-tool allowlist evidence, API, and UI
- [x] F07 Evidence Pack: redacted HTML, normalized trace, Trace IR v2, causal diff, evals, policies, provenance, metadata, executive summary
- [x] F08 Workbench UX: navigation and dense debugger-grade screens for Causality, Eval Lab, Runtime Lab, and Evidence Packs
- [x] F09 Verification: unit tests, E2E smoke for new pages, perf budget, dependency audit, SAST, secret scan

## Surprises & Discoveries

- Date: 2026-05-07
  Discovery: `pnpm audit --prod --audit-level high` currently fails because `next@15.5.12` is affected by a high-severity Server Components denial-of-service advisory fixed in `>=15.5.15`.
  Impact: dependency/security modernization is a Phase 0 blocker, not optional roadmap work.
- Date: 2026-05-07
  Discovery: Existing tests and performance scripts can call `resetAllData()`, which deletes `.atl` under `BRANCHLAB_ROOT`; without explicit temp-root setup this can affect real local data.
  Impact: test/data isolation must be fixed before broad frontier work.
- Date: 2026-05-07
  Discovery: Current docs contain absolute quality claims from 2026-03-03 that no longer reflect the May 2026 audit.
  Impact: replace static perfection claims with a living audit scorecard.
- Date: 2026-05-08
  Discovery: Treating branch `run_id` as semantic event content made compares noisy and inflated visual snapshots.
  Impact: compare semantics now ignore `run_id`, Trace IR fingerprints drive equal-artifact fast paths, and visual baselines were regenerated.
- Date: 2026-05-08
  Discovery: Trace IR persistence doubled the initial 100k-event ingest cost until blob writes and compare reads were optimized.
  Impact: blob writes are cached/sharded, Trace IR compare reads use metadata-only rows, and equal fingerprints avoid full event diffing.

## Decision Log

- Date: 2026-05-07
  Decision: Implement in phases, with Phase 0 plus Trace IR v2 foundation first.
  Rationale: The full frontier plan touches nearly every subsystem; stabilizing security/data safety first reduces risk before adding new capabilities.
  Alternatives considered: attempt full product sweep immediately.
- Date: 2026-05-07
  Decision: Use open standards as the canonical trace spine and keep OpenAI-specific support at adapter/runtime boundaries.
  Rationale: This keeps BranchLab broadly useful while still enabling deep modern OpenAI Responses/Agents support.
  Alternatives considered: OpenAI-only runtime or equal first-class support for every framework immediately.

## Outcomes & Retrospective

- Completed: Phase 0 stabilization, lint migration, high-severity audit fix, data reset safety, isolated script/test data roots, Trace IR v2 foundation, SDK Trace IR/OTel emitters, Trace IR persistence/fingerprints, causal debugger, Eval Lab, Policy Lab v2 checks, Runtime Lab records, Evidence Pack exports, Frontier workbench navigation, scale/perf hardening, and living frontier audit docs.
- Deferred: major Next 16/toolchain upgrade and full hosted OpenAI Responses/Agents re-execution with sandbox state, hosted-tool traces, and approval semantics.
- Risks left: 11 moderate dependency advisories remain; million-event imports pass the scale gate but should expose richer progress telemetry for interactive UX.
- Follow-ups: deepen provider-specific re-exec around the canonical Trace IR rather than bypassing it.

## Verification Evidence

- Commands run before implementation: `pnpm check`, `pnpm e2e`, `pnpm audit --prod --audit-level high`.
- `pnpm check`: passed on 2026-05-07.
- `pnpm e2e`: passed on 2026-05-07, 12 Playwright tests, isolated `/tmp/branchlab-e2e-*` data root.
- `pnpm audit --prod --audit-level high`: passed on 2026-05-07; 11 moderate advisories remain.
- `pnpm sast`: passed on 2026-05-07.
- `pnpm scan:secrets`: passed on 2026-05-07.
- `pnpm --filter @branchlab/web perf:budget`: passed on 2026-05-07 with 100k events, ingest 24136.15ms, compare 4592.01ms.
- `pnpm --filter @branchlab/web benchmark:suite`: passed on 2026-05-07.
- `pnpm check`: passed on 2026-05-08.
- `pnpm e2e`: passed on 2026-05-08, 13 Playwright tests.
- `pnpm e2e:matrix`: passed on 2026-05-08 across Chromium, Firefox, and WebKit.
- `pnpm audit --prod --audit-level high`: passed on 2026-05-08; 11 moderate advisories remain.
- `pnpm sast`: passed on 2026-05-08.
- `pnpm scan:secrets`: passed on 2026-05-08.
- `pnpm --filter @branchlab/web perf:budget`: passed on 2026-05-08 with 100k events, ingest 23631.74ms, compare 0.07ms.
- 1M-event scale gate: passed on 2026-05-08 in a throwaway temp root, ingest 280738.28ms, compare 0.06ms, RSS 1737MB.
- `pnpm --filter @branchlab/web benchmark:suite`: passed on 2026-05-08.
- `pnpm demo`: passed on 2026-05-08.
- `pnpm smoke:prod`: passed on 2026-05-08.

---

# BranchLab Taste/Impeccable Frontend Redesign ExecPlan

## Purpose / Big Picture

Use the newly available TasteSkill guidance, Impeccable audit framework, and Awesome Design MD reference material to move the BranchLab frontend from a polished MVP dashboard to a debugger-grade local workbench for agent reliability evidence.

The design target is a dense, calm, keyboard-first cockpit where trace time, causality, replay state, evals, policy impact, runtime guardrails, and export provenance are visible without a marketing-page layer.

## Progress

- [x] Load frontend app-builder workflow and identify required concept/verification flow
- [x] Load TasteSkill, design-taste-frontend, and Impeccable local skill guidance
- [x] Inspect Awesome Design MD output and adapt it into BranchLab-specific design context
- [x] Generate initial visual concept for the BranchLab investigation cockpit
- [x] Audit current UI against product/design context
- [x] Rewrite core shell and design tokens
- [x] Upgrade home/workbench and Frontier lab pages
- [x] Verify with Impeccable detector, screenshots, type/lint/tests, and E2E gates

## Surprises & Discoveries

- Date: 2026-05-08
  Discovery: The installed `impeccable` CLI exposes `detect` and skill-management commands, not the slash-command workflow documented in the skill files.
  Impact: Use the local Impeccable references directly and run `impeccable detect` as an automated sanity check.
- Date: 2026-05-08
  Discovery: Awesome Design MD seeded a VoltAgent-inspired `DESIGN.md`, but the raw template was landing-page oriented and brand-specific.
  Impact: Rewrite it as a BranchLab product workbench design system before coding.

## Decision Log

- Date: 2026-05-08
  Decision: Keep the rewrite inside the existing Next.js app and component primitives rather than replacing the stack.
  Rationale: The app already has strong local-first behavior and verification gates; the problem is workbench composition and polish, not framework choice.
- Date: 2026-05-08
  Decision: Use a near-black warm forensic palette with emerald as sparse verified-signal color.
  Rationale: It fits the trace/debugger domain and avoids generic purple/blue AI gradients.

## Outcomes & Retrospective

Completed the frontend redesign slice:

- Added BranchLab-specific `PRODUCT.md` and `DESIGN.md` so Impeccable has product/design context.
- Rebuilt the global visual system around warm near-black panels, hairline borders, compact type, high-contrast labels, sparse emerald signal, and amber/coral risk colors.
- Reworked the app shell into grouped workbench navigation, deterministic replay status, local Trace IR status, command palette refinements, and a status dock.
- Replaced the home page with an operational cockpit: import/seed controls, investigation minimap, evidence stack, drop zone, lab launchers, and guided first-run state.
- Upgraded Causality, Eval Lab, Runtime Lab, Evidence Packs, Compare, and Policy surfaces toward debugger-grade panels, ledgers, graph/minimap views, and inspectors.
- Regenerated visual regression baselines for default and Chromium/Firefox/WebKit matrix screenshots.

Verification:

- `impeccable detect --fast --json apps/web`: passed with `[]`.
- `pnpm check`: passed on 2026-05-08.
- `pnpm e2e`: passed on 2026-05-08, 13 Playwright tests.
- `pnpm e2e:matrix`: passed on 2026-05-08, 9 cross-browser visual tests.

---

# BranchLab Frontend Expert Panel 100 Burndown ExecPlan

## Purpose / Big Picture

Critically review the redesigned BranchLab frontend as if judged by a world-class panel of design, SaaS, developer-tool, and AI reliability experts. Convert the gaps into a concrete burndown and push the product surface closer to 100 without faking unavailable capabilities.

## Progress

- [x] Establish 10-criterion panel scorecard
- [x] Identify below-100 gaps and write `docs/FRONTEND_EXPERT_AUDIT_2026-05-08.md`
- [x] Replace hard-coded first-viewport demo values with live local system state
- [x] Improve first-viewport hierarchy, live metrics, and evidence stack credibility
- [x] Improve Causal Debugger loading/empty states
- [x] Remove fake empty-state timeline activity and hide framework dev overlay from visual baselines
- [x] Regenerate visual baselines after polish pass
- [x] Rerun `pnpm check`, `pnpm e2e`, `pnpm e2e:matrix`, and Impeccable detector

## Surprises & Discoveries

- Date: 2026-05-08
  Discovery: The strongest credibility gap was the first viewport showing convincing but hard-coded operational values.
  Impact: The cockpit now reads live local runs, causal graph, eval, runtime, and evidence state instead of implying unavailable activity.
- Date: 2026-05-08
  Discovery: Empty visual baselines are legitimate because the visual test starts from an isolated temp root.
  Impact: Empty states need to look intentional and honest rather than decorative.
- Date: 2026-05-08
  Discovery: Playwright screenshot tolerance allowed small stale regions to pass, and Next dev overlay chrome was visible in baselines.
  Impact: Force-regenerated snapshots with `--update-snapshots=all` and hid only the framework dev overlay in visual tests.

## Decision Log

- Date: 2026-05-08
  Decision: Optimize for evidence honesty over visual drama.
  Rationale: BranchLab is an agent reliability lab; world-class trust requires visible provenance and explicit empty/loading states.
- Date: 2026-05-08
  Decision: Stop short of claiming 100/100 after this pass.
  Rationale: The remaining gaps require deeper interaction systems such as saved investigations, pervasive annotations, and true graph/heatmap manipulation.

## Outcomes & Retrospective

- Initial expert-panel estimate: 88.5/100.
- Final expert-panel estimate after this burndown: 93.5/100.
- Completed: live first-viewport state, tighter cockpit hierarchy, live evidence stack, Causal Debugger loading/empty states, honest no-data timeline labels, dev-overlay-free visual snapshots, and full E2E/matrix verification.
- Remaining path to 100: cross-lab saved investigations, annotation workflows, richer import progress telemetry, and a real interactive causal graph/divergence heatmap canvas.

## Verification Evidence

- `impeccable detect --fast --json apps/web`: passed with `[]`.
- `pnpm check`: passed on 2026-05-08.
- `pnpm --filter @branchlab/web exec tsx scripts/run_playwright.ts tests/e2e/visual-regression.spec.ts --update-snapshots=all --reporter=line`: passed, 3 snapshots force-regenerated from an isolated data root.
- `pnpm --filter @branchlab/web exec tsx scripts/run_playwright.ts -c playwright.matrix.config.ts tests/e2e/visual-regression.spec.ts --update-snapshots=all --reporter=line`: passed, 9 matrix snapshots force-regenerated from an isolated data root.
- `pnpm e2e`: passed on 2026-05-08, 13 Playwright tests.
- `pnpm e2e:matrix`: passed on 2026-05-08, 9 cross-browser visual tests.

---

# BranchLab Autonomous Frontier Completion Burndown

## Purpose / Big Picture

Continue the approved "do it all" frontier work by turning BranchLab's new Trace Physics foundation into a complete local investigation workflow: evidence-linked hypotheses, pinned causal spans, lifecycle status, and exported proof artifacts.

This burndown stays honest about scope: each slice must leave runnable code, tests, and durable evidence rather than broad claims about being complete.

## Progress

- [x] Trace Physics kernel with deterministic graph/evidence/hash semantics
- [x] Golden trace corpus for canonical and malformed trace semantics
- [x] Compare, Causality, and Evidence service integration
- [x] Compare, Causality, and Evidence UI exposure
- [x] Saved investigations MVP keyed by evidence hash
- [x] Investigation lifecycle updates: edit, resolve, reject
- [x] Span graph selection as investigation pins
- [x] Evidence packs include investigation ledger and provenance counts
- [x] E2E coverage for save and resolve workflow
- [x] Targeted unit coverage and full quality gates

## Surprises & Discoveries

- Date: 2026-05-08
  Discovery: Saved investigations were durable but one-way.
  Impact: Added PATCH semantics and status transitions before deeper annotation work.
- Date: 2026-05-08
  Discovery: Evidence packs exported trace physics but not the human hypothesis trail tied to those hashes.
  Impact: Evidence packs now include redacted `investigations.json`, investigation counts, and investigation evidence hashes.

## Decision Log

- Date: 2026-05-08
  Decision: Keep investigations in the local SQLite domain model and export them as JSON evidence artifacts.
  Rationale: They are replay/debugging evidence, not transient UI state.
  Alternatives considered: keep annotations only in client state.
- Date: 2026-05-08
  Decision: Use graph span selection as the first annotation affordance instead of introducing a separate annotation table in this slice.
  Rationale: It directly improves saved investigations while keeping persistence and export semantics focused.
  Alternatives considered: add a generalized annotation model immediately.

## Outcomes & Retrospective

- Added investigation update lifecycle support with `open`, `resolved`, and `rejected` transitions.
- Causal Debugger graph nodes are selectable span pins, and saved investigations include the selected causal span.
- Evidence packs now export redacted investigation ledgers and provenance counts alongside trace physics evidence.
- Remaining path: a generalized annotation table, richer graph layout/editing, and import progress telemetry.

## Verification Evidence

- `pnpm --filter @branchlab/web test -- investigationService.test.ts exportXss.test.ts`: passed, 11 web unit files and 22 tests.
- `pnpm check`: passed.
- `pnpm --filter @branchlab/web exec tsx scripts/run_playwright.ts tests/e2e/frontier-workbench.spec.ts --reporter=line`: passed.
- `pnpm e2e`: passed, 13 Playwright tests.
- `pnpm e2e:matrix`: passed, 9 cross-browser visual tests.
- `git diff --check`: passed.

---

# BranchLab Span Annotation Evidence ExecPlan

## Purpose / Big Picture

Move from saved investigation pins to first-class span-level reviewer notes. BranchLab should preserve the human reasoning trail at the same granularity as Trace IR spans, and evidence packs should carry those notes through redaction and provenance.

## Progress

- [x] Inspect existing run annotation APIs and schema
- [x] Add `span_annotations` migration
- [x] Add span annotation persistence service
- [x] Add `/api/span-annotations` GET/POST route
- [x] Attach span annotations to Causal Debugger payloads
- [x] Add Causal Debugger span-note controls and ledger
- [x] Include `span_annotations.json` and span-note provenance counts in evidence packs
- [x] Update API and data-model docs
- [x] Add unit and E2E coverage
- [x] Run targeted and full gates

## Surprises & Discoveries

- Date: 2026-05-08
  Discovery: Existing run annotations are intentionally run-scoped and power the run library/search workflow.
  Impact: Added a separate span-level model instead of overloading `run_annotations`.

## Decision Log

- Date: 2026-05-08
  Decision: Make span notes append-only in this slice.
  Rationale: Investigator comments are evidence artifacts; append-only behavior is simpler and avoids ambiguous overwrites before a richer review workflow exists.
  Alternatives considered: unique upsert per run/span/investigation.

## Outcomes & Retrospective

- Added durable span annotations linked to runs, optional investigations, and concrete span IDs.
- Causal Debugger now saves reviewer notes for the selected graph span.
- Evidence packs now export redacted `span_annotations.json` and include `spanAnnotationCount` in provenance.
- Remaining path: edit/delete workflows, note threading, and annotation filters across Compare/Evidence views.

## Verification Evidence

- `pnpm --filter @branchlab/web test -- spanAnnotationService.test.ts investigationService.test.ts exportXss.test.ts`: passed, 12 web unit files and 24 tests.
- `pnpm check`: passed.
- `pnpm --filter @branchlab/web exec tsx scripts/run_playwright.ts tests/e2e/frontier-workbench.spec.ts --reporter=line`: passed.
- `pnpm e2e`: passed, 13 Playwright tests.
- `pnpm e2e:matrix`: passed, 9 cross-browser visual tests.
- `git diff --check`: passed.

---

# BranchLab Import Telemetry ExecPlan

## Purpose / Big Picture

Make large-trace imports inspectable after the fact. Async imports already existed, but the main workbench did not expose enough durable telemetry for users to understand parser throughput, event counts, issues, and job status.

## Progress

- [x] Inspect import route, jobs service, import reports, and home cockpit
- [x] Add structured telemetry to sync import responses
- [x] Add structured telemetry to async import job results
- [x] Add visible Import Telemetry ledger to the home workbench
- [x] Add cockpit cancellation control for queued/running import jobs
- [x] Extend frontier E2E flow to create an async import job and verify cockpit telemetry
- [x] Update API contract docs
- [x] Regenerate default and matrix visual snapshots
- [x] Run full quality and security gates

## Surprises & Discoveries

- Date: 2026-05-08
  Discovery: Async import jobs already persisted enough state to serve as the durable telemetry artifact.
  Impact: Store richer telemetry in `result_json` rather than adding a redundant import telemetry table.

## Decision Log

- Date: 2026-05-08
  Decision: Surface recent import jobs on the first workbench screen.
  Rationale: Large imports are the entry point for scale workflows; users should see whether the pipeline is idle, running, succeeded, failed, and how many events/issues were observed.
  Alternatives considered: hide telemetry in the jobs API only.

## Outcomes & Retrospective

- Import responses and async job results now include telemetry: file name, byte length, parsed/inserted event counts, issue count, partial-parse state, and duration.
- Home cockpit now shows a recent import telemetry ledger with job id, status, file, progress, event count, and issue count.
- Queued/running import jobs can now be canceled directly from the workbench telemetry panel.
- Visual baselines were regenerated because the landing page gained a verified telemetry panel.
- Remaining path: cancellation controls directly on the cockpit, import throughput charts, and streaming chunk-level progress for very large files.

## Verification Evidence

- `pnpm check`: passed.
- `pnpm e2e`: passed, 13 Playwright tests.
- `pnpm e2e:matrix`: passed, 9 cross-browser visual tests.
- `pnpm check`: passed again after adding the cancellation control.
- `pnpm e2e`: passed again, 13 Playwright tests.
- `pnpm e2e:matrix`: passed again, 9 cross-browser visual tests.
- `pnpm audit --prod --audit-level high`: passed with 11 known moderate advisories.
- `pnpm sast`: passed.
- `pnpm scan:secrets`: passed.
- `git diff --check`: passed.

---

# BranchLab Causal Annotation Navigation ExecPlan

## Purpose / Big Picture

Make the Causal Debugger behave more like a real investigation surface: causal candidate rows should focus spans, and reviewer notes should be filterable to the selected span rather than forcing users to scan a flat ledger.

## Progress

- [x] Add candidate-row click handling to select the candidate span
- [x] Add all-notes versus selected-span annotation filtering
- [x] Add E2E assertion for selected-span note filtering
- [x] Add CSS reset for clickable list rows
- [x] Run check, targeted browser flow, full E2E, and visual matrix

## Surprises & Discoveries

- Date: 2026-05-08
  Discovery: Reusing `button` for list rows inherits global button chrome unless reset.
  Impact: Added a narrow `button.list-row` rule to preserve debugger row layout while making rows keyboard-accessible.

## Decision Log

- Date: 2026-05-08
  Decision: Make candidate rows keyboard-accessible buttons instead of adding separate tiny action buttons.
  Rationale: The row itself is the natural target in a dense debugger workflow.
  Alternatives considered: a separate "pin" button per candidate.

## Outcomes & Retrospective

- Candidate rows now select the candidate span for pinning and annotation.
- Span annotations now filter between all notes and the selected span.
- Remaining path: graph layout manipulation, edge filtering, and persistent saved views for investigations.

## Verification Evidence

- `pnpm check`: passed.
- `pnpm --filter @branchlab/web exec tsx scripts/run_playwright.ts tests/e2e/frontier-workbench.spec.ts --reporter=line`: passed.
- `pnpm e2e`: passed, 13 Playwright tests.
- `pnpm e2e:matrix`: passed, 9 cross-browser visual tests.
- `git diff --check`: passed.

---

# BranchLab Trace Physics + Golden Corpus ExecPlan

## Purpose / Big Picture

Make the BranchLab core more Karpathy-esque: simple, inspectable trace physics first, then everything else proves itself against that core. This slice adds one deep module for trace analysis and a disk-backed golden corpus so adapters, hashes, causal graphs, divergence, and evidence summaries are tested together.

## Progress

- [x] Write design spec at `docs/superpowers/specs/2026-05-08-trace-physics-golden-corpus-design.md`
- [x] Write implementation plan at `docs/superpowers/plans/2026-05-08-trace-physics-golden-corpus.md`
- [x] Add RED tests for `analyzeTracePhysics()` and `compareTracePhysics()`
- [x] Implement `packages/core/src/tracePhysics.ts`
- [x] Export the trace physics kernel from `packages/core/src/index.ts`
- [x] Add golden corpus fixtures under `examples/traces/golden`
- [x] Add disk-backed golden corpus tests
- [x] Update trace format docs and scratchpad
- [x] Run targeted and full gates

## Surprises & Discoveries

- Date: 2026-05-08
  Discovery: Adapter records that set both `parentSpanId` and matching `causalParentIds` produced duplicate dangling-parent diagnostics when the parent was outside the fixture.
  Impact: Validation now suppresses the duplicate causal-parent diagnostic when it is the same missing structural parent.

## Decision Log

- Date: 2026-05-08
  Decision: Add `tracePhysics` as a deep module over existing Trace IR and causal utilities rather than rewriting persistence or UI callers.
  Rationale: This creates leverage and locality for the core trace semantics while keeping the slice small and verifiable.
- Date: 2026-05-08
  Decision: Keep the first golden corpus compact and adapter-focused.
  Rationale: The corpus should be easy to inspect and extend; huge scale fixtures belong in perf gates, not baseline semantic tests.

## Outcomes & Retrospective

- Added `TracePhysicsSummary`, `TracePhysicsEvidence`, and deterministic validation diagnostics.
- Added `analyzeTracePhysics()` for normalization, validation, graph construction, fingerprinting, and evidence hashing.
- Added `compareTracePhysics()` for pairwise fingerprints, first divergence, changes, heatmap, candidate ranking, and combined diagnostics.
- Added golden fixtures for BranchLab v1, Trace IR v2 parent/branch, OTel GenAI, OpenAI-style, Anthropic-style, LangSmith-style, MLflow-style, and malformed generic JSONL.
- Remaining path: wire this kernel into web ingest, compare, causal, eval, and evidence services so every product surface consumes the same trace-physics output.

## Verification Evidence

- `pnpm --filter @branchlab/core test -- tracePhysics.test.ts`: failed before implementation because `tracePhysics` did not exist, then passed after implementation.
- `pnpm --filter @branchlab/core test -- goldenCorpus.test.ts tracePhysics.test.ts`: passed.
- `pnpm --filter @branchlab/core test`: passed, 10 test files and 31 tests.
- `pnpm check`: passed.

---

# BranchLab Trace Physics Product Integration ExecPlan

## Purpose / Big Picture

Wire the new Trace Physics kernel into the product paths that make evidence claims today: compare, causal debugger, and evidence-pack export. The goal is one canonical evidence-producing module behind product surfaces rather than parallel service-specific causal logic.

## Progress

- [x] Inspect compare, causal, evidence, and persisted Trace IR service contracts
- [x] Add `trustExistingHashes` option for persisted Trace IR rows
- [x] Add core test for stored-hash trust behavior
- [x] Wire `compareRunsById()` to `compareTracePhysics()`
- [x] Wire `getCausalDebugger()` to `analyzeTracePhysics()` / `compareTracePhysics()`
- [x] Add compact `trace_physics.json` artifact and provenance fields to evidence packs
- [x] Add web integration tests for compare, causal debugger, and evidence export
- [x] Run targeted and full gates

## Surprises & Discoveries

- Date: 2026-05-08
  Discovery: Persisted Trace IR rows keep canonical event hashes but do not persist full `inputRef` / `outputRef` payload references.
  Impact: Product services must trust stored hashes when analyzing persisted rows; raw trace analysis still validates hash mismatches by default.

## Decision Log

- Date: 2026-05-08
  Decision: Keep existing API fields stable and add a `tracePhysics` payload instead of replacing response shapes in place.
  Rationale: This lets current UI and E2E flows keep working while new panels migrate to the canonical evidence summary.
- Date: 2026-05-08
  Decision: Export compact trace-physics artifacts without raw event payloads.
  Rationale: Evidence packs need reproducibility hashes and diagnostics without increasing redaction risk.

## Outcomes & Retrospective

- Compare service now returns canonical trace-physics compare output alongside existing normalized diff, blame, causal, candidate, and fingerprint fields.
- Causal debugger graph and branch compare now come from the trace-physics kernel.
- Evidence packs now include `trace_physics.json`, `tracePhysicsEvidence`, and `tracePhysicsDiagnostics`.
- Remaining path: expose this evidence in the UI, persist saved investigations keyed by evidence hashes, and eventually make ingest store compact trace-physics summaries for faster reads.

## Verification Evidence

- `pnpm --filter @branchlab/web test -- tracePhysicsIntegration.test.ts`: failed before persisted-hash trust behavior, then passed after implementation.
- `pnpm --filter @branchlab/core test -- tracePhysics.test.ts`: passed, 10 files and 32 tests due package test matching.
- `pnpm --filter @branchlab/core test`: passed, 10 test files and 32 tests.
- `pnpm --filter @branchlab/web typecheck`: passed.
- `pnpm --filter @branchlab/core typecheck`: passed.
- `pnpm check`: passed.
- `pnpm e2e`: passed, 13 Playwright tests.
- `pnpm e2e:matrix`: passed, 9 cross-browser visual tests.

---

# BranchLab Saved Investigations ExecPlan

## Purpose / Big Picture

Turn causal debugging from a transient screen into a replayable investigation workflow. Users should be able to save a hypothesis against the current trace-physics evidence hash, branch, and pinned candidate spans, then revisit that local ledger from the Causal Debugger.

## Progress

- [x] Inspect migration style and causal API routes
- [x] Add `saved_investigations` migration
- [x] Add local investigation persistence service
- [x] Add `/api/investigations` GET/POST route
- [x] Attach investigations to causal debugger payloads
- [x] Add Causal Debugger controls for saving hypotheses
- [x] Add unit tests for investigation persistence
- [x] Add E2E coverage for saving an investigation
- [x] Run full gates

## Surprises & Discoveries

- Date: 2026-05-08
  Discovery: The typed `node:sqlite` row result needs an explicit unknown cast before mapping into a domain row shape.
  Impact: `investigationService` uses an explicit `unknown` cast at the database seam and keeps the rest of the module strongly typed.

## Decision Log

- Date: 2026-05-08
  Decision: Save investigations as local records keyed by evidence hash rather than as UI-only settings.
  Rationale: Investigations are domain artifacts, not preferences; they need queryability, ordering, and future export potential.
- Date: 2026-05-08
  Decision: Pin the first divergence and top candidates automatically.
  Rationale: This keeps the workflow fast while still letting the saved record point back to concrete trace spans.

## Outcomes & Retrospective

- Added `saved_investigations` with run, branch, title, hypothesis, pinned spans, evidence hash, status, and timestamps.
- Added `saveInvestigation()` / `listInvestigations()` and an API route for local investigation workflows.
- Causal Debugger now displays a saved hypothesis ledger and can save the current trace-physics evidence state.
- Remaining path: add editing/resolution states, evidence-pack inclusion for saved investigations, and richer annotation affordances on individual graph nodes.

## Verification Evidence

- `pnpm --filter @branchlab/web test -- investigationService.test.ts tracePhysicsIntegration.test.ts`: passed.
- `pnpm --filter @branchlab/web exec tsx scripts/run_playwright.ts tests/e2e/frontier-workbench.spec.ts --reporter=line`: passed.
- `pnpm check`: failed once on a SQLite row cast, then passed after fix.
- `pnpm e2e`: passed, 13 Playwright tests.
- `pnpm e2e:matrix`: passed, 9 cross-browser visual tests.

---

# BranchLab Trace Physics UI Exposure ExecPlan

## Purpose / Big Picture

Make canonical trace-physics evidence visible in the workbench so users can see the hashes, diagnostics, and candidate evidence behind compare, causality, and evidence packs without opening raw JSON exports.

## Progress

- [x] Inspect compare, causal, and evidence page payload usage
- [x] Add compare-page canonical evidence summary panel
- [x] Add causal-debugger trace-physics evidence and graph metrics
- [x] Add evidence-pack trace-physics contract, hash signal, and ledger field
- [x] Add E2E assertions for visible trace-physics evidence
- [x] Regenerate default and cross-browser visual baselines
- [x] Run full gates

## Surprises & Discoveries

- Date: 2026-05-08
  Discovery: Existing E2E selectors for generic text like `cases` became strict-mode ambiguous after richer UI rerenders.
  Impact: E2E assertions now target the first matching cases label and exact `trace physics` ledger text.

## Decision Log

- Date: 2026-05-08
  Decision: Surface compact evidence hashes and diagnostic counts, not raw Trace IR payloads.
  Rationale: The UI should make confidence visible without increasing noise or redaction exposure.

## Outcomes & Retrospective

- Compare now shows parent/branch evidence hash prefixes, kernel diagnostics, physics divergence, and top canonical candidates.
- Causality now shows trace-physics evidence hash, diagnostic count, roots, and tool counts.
- Evidence Packs now list Trace physics summary as an included artifact and show trace-physics hash/diagnostic signals in provenance and ledger rows.
- Remaining path: persist saved investigation hypotheses against trace-physics evidence hashes.

## Verification Evidence

- `pnpm --filter @branchlab/web typecheck`: passed.
- `pnpm --filter @branchlab/web exec tsx scripts/run_playwright.ts tests/e2e/frontier-workbench.spec.ts tests/e2e/golden-flow.spec.ts --reporter=line`: failed on strict selectors, then passed after selector fixes.
- `pnpm --filter @branchlab/web exec tsx scripts/run_playwright.ts tests/e2e/visual-regression.spec.ts --update-snapshots=all --reporter=line`: passed, default snapshots regenerated.
- `pnpm --filter @branchlab/web exec tsx scripts/run_playwright.ts -c playwright.matrix.config.ts tests/e2e/visual-regression.spec.ts --update-snapshots=all --reporter=line`: passed, matrix snapshots regenerated.
- `pnpm check`: passed.
- `pnpm e2e`: passed, 13 Playwright tests.
- `pnpm e2e:matrix`: passed, 9 cross-browser visual tests.

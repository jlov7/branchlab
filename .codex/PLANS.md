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

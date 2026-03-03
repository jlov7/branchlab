# BranchLab Frontend 100/100 Implementation Plan

> **For Codex:** Execute this plan in strict order, update checkboxes as each task lands, and attach verification evidence per gate.

**Goal:** Raise BranchLab from current UX maturity to world-class frontend quality (target 100/100 panel-ready) across 12 scoring pillars.

**Architecture:** Keep the existing Next.js App Router + component architecture, but move from page-local styling/interaction patterns to a coherent design system, stronger information hierarchy, richer micro-interactions, and hardened accessibility/responsiveness/performance guarantees.

**Tech Stack:** Next.js, React, TypeScript, CSS tokens, Monaco, TanStack Virtual, Playwright, Axe, Vitest.

---

## Scoring Model (12 Pillars)

| Pillar | Current | Target |
|---|---:|---:|
| 1. Visual Language & Brand Craft | 76 | 100 |
| 2. Design System Consistency | 62 | 100 |
| 3. IA & Navigation Clarity | 78 | 100 |
| 4. Core Journey UX (Import -> Inspect -> Fork -> Compare -> Policy) | 84 | 100 |
| 5. Interaction & Micro-Motion Quality | 67 | 100 |
| 6. Data UX (Timeline/Diff/Analysis Legibility) | 69 | 100 |
| 7. Accessibility (WCAG + keyboard excellence) | 74 | 100 |
| 8. Responsive/Mobile/Cross-Browser Quality | 63 | 100 |
| 9. Performance at Scale | 86 | 100 |
| 10. Reliability/Error-State UX | 72 | 100 |
| 11. Product Copy, Trust, Onboarding | 79 | 100 |
| 12. Frontend QA/Release Confidence | 88 | 100 |

## Non-Negotiables

1. Local-first quality gates remain source-of-truth (`make preflight`, `make check`, `make e2e`, `make demo`).
2. GitHub CI remains optional and must not block local release readiness.
3. No regressions to deterministic replay/re-exec safety labeling.
4. Every UX change ships with tests (unit/e2e/visual/a11y where relevant).

## Execution Waves

1. Wave A: Design foundations and component system.
2. Wave B: High-value screen rewrites (Runs, Run Report, Compare, Policy, Settings).
3. Wave C: Motion, data UX, and interaction polish.
4. Wave D: Accessibility + responsive hardening.
5. Wave E: Performance and resilience.
6. Wave F: Documentation, UX audits, and final acceptance review.

---

## Exhaustive Task Backlog (120 Tasks)

### Pillar 1 - Visual Language & Brand Craft (UX001-UX010)

- [x] UX001 Define v1 visual direction board with typography/color/spacing principles in `docs/UX_UI_SPEC.md`.
- [x] UX002 Replace ad-hoc color usage with full semantic token sets (`surface`, `text`, `accent`, `status`, `focus`) in `apps/web/app/globals.css`.
- [x] UX003 Add light theme token set and theme switcher (persisted preference) in `apps/web/app/layout.tsx` + `AppShell`.
- [x] UX004 Introduce subtle background texture/noise layer with reduced-motion fallback.
- [x] UX005 Normalize heading/body/mono type scale and line-height rhythm across all pages.
- [x] UX006 Introduce branded icon treatment and size scale rules for nav/actions/status.
- [x] UX007 Standardize card elevation/border/radius/shadow language across pages.
- [x] UX008 Add visual hierarchy guidelines for metric strips, section headers, and action groups.
- [x] UX009 Create visual lint checklist and enforce during PR/review (`docs/RELEASE_CHECKLIST.md`).
- [x] UX010 Capture refreshed golden screenshots for all primary screens.

### Pillar 2 - Design System Consistency (UX011-UX020)

- [x] UX011 Create component primitives: `Button`, `Input`, `Select`, `Textarea`, `Card`, `Badge`, `Tabs` under `apps/web/components/ui/`.
- [x] UX012 Replace inline style blocks in landing/runs/run-report/compare/policy/settings with primitives.
- [x] UX013 Introduce layout primitives: `Page`, `Section`, `Stack`, `Inline`, `SplitPane`.
- [x] UX014 Add form field wrapper component with label/help/error/description states.
- [x] UX015 Centralize spacing scale (`--space-1`..`--space-10`) and remove magic numbers.
- [x] UX016 Centralize border-radius and elevation scale tokens.
- [x] UX017 Add skeleton/loading primitives for list/table/detail states.
- [x] UX018 Add empty-state primitive with icon/title/next-action slots.
- [x] UX019 Add danger/critical action primitives with consistent affordances.
- [x] UX020 Create frontend style guide doc with canonical component examples.

### Pillar 3 - IA & Navigation Clarity (UX021-UX030)

- [x] UX021 Add active-route highlighting in left rail and keyboard focus clarity.
- [x] UX022 Add top-bar global actions: Import, Export, Theme toggle, Help/shortcuts.
- [x] UX023 Add breadcrumbs for deep pages (`Runs / {runId}`, Compare context).
- [x] UX024 Add global command palette (`Cmd/Ctrl+K`) for run search and fast nav.
- [x] UX025 Add contextual quick actions (fork/compare/export) near relevant content.
- [x] UX026 Redesign landing information architecture around “Start in 30s / Import / Learn”.
- [x] UX027 Add global status surface for background jobs and errors (non-blocking toast center).
- [x] UX028 Add consistent page-level intros and outcome-focused section ordering.
- [x] UX029 Add run context switcher on run report page for quick neighboring run navigation.
- [x] UX030 Validate IA with scenario walkthrough script in `docs/DEMO_SCRIPT.md`.

### Pillar 4 - Core Journey UX (UX031-UX040)

- [x] UX031 Upgrade import flow to drag/drop zone with validation preview and file size hints.
- [x] UX032 Add import progress drawer with structured counts (parsed/failed/warned).
- [x] UX033 Replace runs list row layout with clearer columns and sticky header.
- [x] UX034 Add richer filters: date range, tools multi-select, mode, tags.
- [x] UX035 Improve run report summary strip (outcome, mode, cost/tokens, policy counts, warnings).
- [x] UX036 Add phase grouping in timeline with collapse/expand controls.
- [x] UX037 Add event relationship highlighting (tool request <-> response; llm req <-> resp).
- [x] UX038 Add run-level saved search and sharable local URL query state.
- [x] UX039 Improve fork modal with diff preview panel before submit.
- [x] UX040 Add post-fork success flow with CTA options (open branch, compare now, stay).

### Pillar 5 - Interaction & Micro-Motion Quality (UX041-UX050)

- [x] UX041 Add motion tokens and duration/easing scale in CSS variables.
- [x] UX042 Add subtle enter/exit transitions for modal, inspector, and toasts.
- [x] UX043 Add timeline hover/scrub highlights with deterministic performance budget.
- [x] UX044 Add optimistic UI transitions for save actions (views/presets/annotations).
- [x] UX045 Add tactile button press/hover/focus states with consistent feedback timings.
- [x] UX046 Improve keyboard shortcut discoverability with in-app cheatsheet modal.
- [x] UX047 Add reduced-motion treatment for all animated surfaces.
- [x] UX048 Add compare divergence jump interaction (click minimap -> scroll changed event).
- [x] UX049 Add policy job status timeline component (queued/running/succeeded/failed/canceled).
- [x] UX050 Add undo affordance for destructive local actions when feasible.

### Pillar 6 - Data UX (Timeline/Diff/Analysis) (UX051-UX060)

- [x] UX051 Replace raw JSON-only diff with semantic diff renderer (added/removed/changed badges).
- [x] UX052 Add collapsed large-payload sections with byte-size indicators and expand controls.
- [x] UX053 Add side-by-side diff mode toggle in compare page.
- [x] UX054 Add first-divergence narrative summary block above changed events.
- [x] UX055 Add filter chips for changed-event kinds (added/removed/modified).
- [x] UX056 Add blame candidate cards with confidence bars and rationale evidence links.
- [x] UX057 Add event inspector tabs parity: Rendered / Raw JSON / Diff (where relevant).
- [x] UX058 Add copy/export affordances for compare insights (JSON + Markdown summary).
- [x] UX059 Upgrade policy analytics from raw JSON blocks to concise chart components.
- [x] UX060 Add run scorecard panel with explicit metric definitions and tooltip help.

### Pillar 7 - Accessibility Excellence (UX061-UX070)

- [x] UX061 Audit and fix heading hierarchy across all pages (single H1, ordered sections).
- [x] UX062 Add robust focus trap + Escape semantics for all modals/drawers.
- [x] UX063 Add visible focus rings with non-color-only state indicators.
- [x] UX064 Ensure all icon-only controls have accessible names/tooltips.
- [x] UX065 Add ARIA live regions for async job status/progress updates.
- [x] UX066 Ensure color contrast >= WCAG AA for badges, helper text, warning states.
- [x] UX067 Add table/list semantics where screen readers need structure.
- [x] UX068 Add skip-to-content and landmark roles for shell/navigation/content regions.
- [x] UX069 Expand automated axe coverage to all top-level routes and modal states.
- [x] UX070 Execute manual keyboard + SR pass and record results in `docs/ACCESSIBILITY_AUDIT.md`.

### Pillar 8 - Responsive/Mobile/Cross-Browser Quality (UX071-UX080)

- [x] UX071 Redesign left rail behavior for mobile (collapsible drawer + overlay).
- [x] UX072 Add responsive breakpoints for summary strips and action clusters.
- [x] UX073 Rework runs and compare layouts for small screens (<768px) with stacked panels.
- [x] UX074 Ensure fork modal and policy editor are fully usable on tablet widths.
- [x] UX075 Add touch target normalization (minimum 44px) for mobile interactions.
- [x] UX076 Add horizontal overflow guards and truncation rules for long IDs/text.
- [x] UX077 Add responsive typography adjustments per breakpoint.
- [x] UX078 Capture cross-browser visual baselines (Chromium/Firefox/WebKit).
- [x] UX079 Fix browser-specific rendering quirks identified from matrix run.
- [x] UX080 Add dedicated responsive e2e flows for import, fork, compare, settings.

### Pillar 9 - Performance at Scale (UX081-UX090)

- [x] UX081 Add render budget instrumentation for run report and compare views.
- [x] UX082 Add memoization/selective rendering for timeline and inspector components.
- [x] UX083 Defer heavy panels (Monaco, large diff render) behind lazy loading boundaries.
- [x] UX084 Add chunking/windowing for changed-events rendering in compare.
- [x] UX085 Add API pagination/streaming hooks for very large compare datasets.
- [x] UX086 Optimize font loading strategy and avoid layout shifts.
- [x] UX087 Add performance CI gate for largest demo traces and thresholds.
- [x] UX088 Add flamegraph snapshots for key routes and track regressions.
- [x] UX089 Reduce unnecessary JSON stringify/parse in hot render paths.
- [x] UX090 Re-validate 100k event usability with no main-thread jank regressions.

### Pillar 10 - Reliability/Error-State UX (UX091-UX100)

- [x] UX091 Standardize error boundary behavior and fallback components per route.
- [x] UX092 Add empty-state guidance for no-runs/no-policies/no-compare-results.
- [x] UX093 Add offline/local-fs failure messaging with actionable recovery steps.
- [x] UX094 Add retry controls and idempotent behaviors for failing async operations.
- [x] UX095 Add guardrails for invalid form input with inline validation messaging.
- [x] UX096 Add branch operation cancellation UX with deterministic status updates.
- [x] UX097 Add import partial-parse summary banner with direct report download link.
- [x] UX098 Add provider health warning surfaces where re-exec can fail.
- [x] UX099 Ensure all destructive actions require confirm dialog with contextual consequences.
- [x] UX100 Add unified toast system with severity levels and deduplication.

### Pillar 11 - Product Copy, Trust, Onboarding (UX101-UX110)

- [x] UX101 Create product copy style guide (`docs/UX_COPY_GUIDE.md`) with tone/terminology.
- [x] UX102 Enforce deterministic-vs-reexec labels consistently across all relevant UI surfaces.
- [x] UX103 Improve onboarding checklist with measurable milestones and progress persistence.
- [x] UX104 Add contextual help text/tooltips for advanced concepts (replay, reexec, policy, blame).
- [x] UX105 Add settings trust copy for storage location, deletion impact, and diagnostics opt-in.
- [x] UX106 Add export safety copy with default-redacted rationale and opt-out warning quality.
- [x] UX107 Add demo script parity walkthrough screenshots tied to current UI.
- [x] UX108 Add in-app keyboard shortcuts/help modal and doc linkage.
- [x] UX109 Add “what changed” release notes view for internal demo readiness.
- [x] UX110 Run copy consistency sweep for labels, tense, casing, and terminology.

### Pillar 12 - Frontend QA/Release Confidence (UX111-UX120)

- [x] UX111 Expand unit tests for component primitives and interaction edge states.
- [x] UX112 Expand integration tests for API+UI sync around filters/saved views/presets.
- [x] UX113 Expand golden e2e coverage for import failures, empty states, and retries.
- [x] UX114 Expand keyboard-only e2e scenarios across all routes and modal paths.
- [x] UX115 Expand accessibility checks to modal-open states and dynamic announcements.
- [x] UX116 Add deterministic visual verification protocol doc + tooling script.
- [x] UX117 Add per-route visual snapshots for mobile/tablet/desktop matrix.
- [x] UX118 Ensure `make preflight` includes frontend UX gates (visual + a11y + perf budgets).
- [x] UX119 Keep GitHub workflow optional/non-blocking; local gates remain authoritative.
- [x] UX120 Run final panel-style score re-evaluation and publish `docs/FRONTEND_SCORECARD.md`.

---

## Phase-by-Phase Implementation Sequence

### Phase 0 - Baseline and Guardrails

- Complete: UX111, UX112, UX116, UX118, UX119.
- Exit gate: Baseline tests are deterministic, fast-enough, and reproducible locally.

### Phase 1 - Design System Foundation

- Complete: UX001-UX020.
- Exit gate: No inline page-specific style blocks for core controls/layout.

### Phase 2 - IA and Core Journey Rebuild

- Complete: UX021-UX040.
- Exit gate: import -> run report -> fork -> compare path is frictionless and coherent.

### Phase 3 - Interaction + Data UX Polish

- Complete: UX041-UX060.
- Exit gate: compare/timeline/policy surfaces are analyst-grade and legible under load.

### Phase 4 - Accessibility and Responsive Hardening

- Complete: UX061-UX080.
- Exit gate: WCAG AA checks pass + responsive matrix fully green.

### Phase 5 - Performance and Reliability Hardening

- Complete: UX081-UX100.
- Exit gate: 100k event and large compare flows meet budget with resilient UX under failures.

### Phase 6 - Trust Copy, Onboarding, Final QA

- Complete: UX101-UX110, UX113-UX117, UX120.
- Exit gate: documentation, copy, and panel-style scorecard all finalized.

---

## Verification Gates

1. `pnpm --filter @branchlab/web test`
2. `pnpm --filter @branchlab/web test:e2e`
3. `pnpm --filter @branchlab/web build`
4. `make check`
5. `make e2e`
6. `make preflight`
7. `make demo`

## 100/100 Acceptance Definition

A pillar is considered 100/100 only when:

1. All its tasks are complete.
2. Related automated tests pass.
3. Visual/a11y/perf evidence is captured.
4. No open P0/P1 UX bugs remain in that pillar.
5. Final scorecard review marks the pillar as “release-ready world-class”.

## Reporting Artifacts to Produce

- `docs/FRONTEND_SCORECARD.md` (current vs target vs achieved)
- `docs/UX_AUDIT_WORLD_CLASS.md` (evidence screenshots + notes)
- `docs/visual-verification-protocol.md` (deterministic visual checks)
- Updated `docs/RELEASE_REPORT.md` frontend section


# Acceptance Checklist

Historical status date: March 3, 2026
Current audit reference: [FRONTIER_AUDIT.md](FRONTIER_AUDIT.md)

This checklist records the March 2026 MVP/release baseline. It should not be read as current proof that the frontier upgrade has no open risks.

## Current Frontier Gate

- [x] `pnpm check`
- [x] `pnpm e2e`
- [x] `pnpm audit --prod --audit-level moderate`
- [x] `pnpm sast`
- [x] `pnpm scan:secrets`
- [x] `pnpm docs:links`
- [x] Trace IR v2 foundation tests pass
- [x] Data reset safety tests pass

## Historical March 2026 Baseline

## Build & quality gates
- [x] `make setup` succeeds on a clean machine
- [x] `make dev` runs and UI loads
- [x] `make check` passes (lint/typecheck/unit tests)
- [x] `make e2e` passes (Playwright)
- [x] `make demo` imports demo traces and opens viewer
- [x] `make preflight` passes (release gate: check + e2e + demo + visual)

## Core product
- [x] Import JSONL traces (streaming)
- [x] Runs list with filters + search
- [x] Run report timeline with inspector drawer
- [x] Forking works for:
  - [x] tool output override
  - [x] prompt edit
  - [x] policy override
  - [x] memory removal (demo trace includes memory events)
- [x] Compare view shows:
  - [x] first divergence
  - [x] changed event counts
  - [x] semantic JSON diff
  - [x] outcome/cost/policy deltas
- [x] Blame suggestions appear and are plausible
- [x] Policy Lab loads a policy and evaluates tool calls
- [x] Export bundle produces an HTML report + JSON artifacts

## UX/UI (must be true)
- [x] Landing page is custom and branded (not default template)
- [x] Timeline is smooth and virtualized
- [x] Compare view is clearly legible and feels diff-like
- [x] All empty states are designed
- [x] App uses consistent design tokens
- [x] Keyboard shortcuts implemented (J/K/Enter/F)
- [x] Accessibility baseline checks added and passing (critical violations)

## Security
- [x] No unsafe HTML rendering from trace payloads
- [x] Re-execution mode is opt-in and clearly labeled
- [x] Export defaults to redacted mode
- [x] CSP and browser hardening headers are set

## Test mapping (required)
- [x] `packages/core/test/outcome.test.ts` covers deterministic outcome precedence
- [x] `packages/core/test/branch.test.ts` covers prompt/tool interventions
- [x] `packages/core/test/replayDeterminism.test.ts` covers replay determinism
- [x] `packages/core/test/traceAdapters.test.ts` covers legacy/OpenAI/Anthropic adapter normalization
- [x] `packages/core/test/diff.test.ts` covers first divergence + deltas
- [x] `packages/policy/test/yamlBackend.test.ts` covers YAML policy decisions
- [x] `packages/policy/test/regoBackend.test.ts` covers Rego/WASM compile path behavior
- [x] `apps/web/tests/e2e/golden-flow.spec.ts` covers replay + fork + compare + policy UI flow
- [x] `apps/web/tests/e2e/accessibility.spec.ts` covers critical accessibility violations
- [x] `apps/web/tests/unit/csp.test.ts` covers dev/prod CSP behavior
- [x] `apps/web/tests/unit/exportXss.test.ts` and `apps/web/tests/e2e/xss.spec.ts` cover XSS regressions
- [x] `apps/web/tests/e2e/keyboard-flow.spec.ts` covers keyboard workflow behavior
- [x] `apps/web/tests/e2e/visual-regression.spec.ts` covers visual regressions

## Evidence commands
- `make check`
- `make e2e`
- `make demo`
- `make preflight`

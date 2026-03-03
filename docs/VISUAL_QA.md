# Visual QA & “Non-boring UI” guardrails

The goal is to avoid a functional-but-generic dashboard.

## Required visual checks
- Run `make dev`
- Verify each screen has:
  - clear hierarchy
  - consistent spacing tokens
  - designed empty state
  - polished loading states (skeletons)
  - consistent iconography
  - focus states for keyboard use

## Screenshot list (for README)
Capture these and add to `README.md`:
1. Landing page (empty state)
2. Runs list with demo runs
3. Run report with timeline + inspector open
4. Fork modal with intervention preview
5. Compare view with first divergence highlighted
6. Policy Lab results view

## Visual regression tests (recommended)
Add Playwright screenshot tests for:
- landing
- run report
- compare view
Use stable deterministic demo traces.

## “Bland UI” anti-patterns (avoid)
- Default create-next-app landing page
- Generic table-only views with no hierarchy
- No empty states / “No data” text only
- Inconsistent padding, borders, shadows
- No keyboard shortcuts for timeline navigation

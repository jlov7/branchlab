# Accessibility Audit Checklist

Automated baseline is covered by Playwright + Axe (`apps/web/tests/e2e/accessibility.spec.ts`).

Manual checks required before release:

1. Keyboard-only navigation on landing, runs, run report, compare, policy, settings.
2. Focus visibility for all primary action buttons and form controls.
3. Modal interaction:
   - fork modal opens with keyboard (`F`)
   - modal close via visible cancel action
4. Color contrast spot-check for status badges and warning text.
5. Reduced motion and loading states remain readable and do not trap focus.

Pass criteria: no unresolved blocking issues (`critical` or `serious`) and no keyboard dead-ends.

## Current Automated Coverage (March 3, 2026)

Passing tests:

1. landing page has no critical a11y violations
2. runs page has no critical a11y violations
3. compare and policy pages have no blocking a11y violations
4. modal states remain free of blocking a11y violations
5. keyboard workflow covers `J/K/Enter/F`
6. responsive mobile flow remains navigable

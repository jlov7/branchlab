# Visual Verification Protocol

## Goal

Keep visual regressions deterministic and reviewable across high-value pages.

## Baseline Commands

1. Update baselines intentionally:

```bash
cd apps/web
pnpm exec playwright test tests/e2e/visual-regression.spec.ts --update-snapshots
```

2. Validate baselines in normal gate:

```bash
pnpm --filter @branchlab/web e2e
```

3. Validate cross-browser matrix:

```bash
pnpm --filter @branchlab/web e2e:matrix
```

4. Run full release gate (includes matrix):

```bash
make preflight
```

## Covered Surfaces

- Landing
- Runs list
- Compare

Snapshots live in `apps/web/tests/e2e/visual-regression.spec.ts-snapshots/`.

## Review Rules

1. Never update snapshots without reviewing diff images.
2. Snapshot updates must be accompanied by intentional UI changes.
3. If visual changes are expected, update `docs/DEMO_SCRIPT.md` and screenshots in README/docs as needed.

## Matrix Projects

`e2e:matrix` runs Chromium, Firefox, and WebKit using project-specific snapshot baselines.

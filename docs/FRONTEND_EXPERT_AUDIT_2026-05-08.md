# BranchLab Frontend Expert Audit

Date: 2026-05-08

## Panel Score

| Criterion | Score | Critical Read |
| --- | ---: | --- |
| Visual craft | 88 | Strong identity and restraint, but some panels still feel template-like. |
| Information architecture | 87 | Clear workbench model; cross-lab continuity can be stronger. |
| Evidence credibility | 82 | First viewport still reads partly static/demo unless live state is visible. |
| Workflow ergonomics | 86 | Primary flows pass, but expert shortcuts and saved investigation affordances are not yet pervasive. |
| Data density and scannability | 88 | Good density; some surfaces need better hierarchy between live facts and decorative structure. |
| Product distinctiveness | 89 | Strong local-first forensic tone; needs more proprietary interaction depth. |
| Accessibility and responsive quality | 94 | Automated gates pass; compact text remains close to the edge by design. |
| Trust, safety, and local-first signaling | 91 | Strong, but runtime/tool guardrails should be visible in more contexts. |
| Performance perception | 86 | Scale backend is strong; frontend still lacks rich large-import progress theatre. |
| Engineering verification | 94 | Strong local gates and visual matrix; dev-mode screenshots can include framework overlay noise. |

Current panel estimate: **88.5 / 100**.

Final panel estimate after the completed burndown: **93.5 / 100**.

## Burndown To 100

- [x] B100-01: Replace static first-viewport demo values with live local state from runs, causal graph, evals, runtime, and evidence APIs.
- [x] B100-02: Tighten homepage headline/wrap and make the cockpit read as an instrument, not a landing card.
- [x] B100-03: Add a live system strip for runs, failures, eval runs, evidence packs, runtime executions, and Trace IR health.
- [x] B100-04: Improve Causal Debugger loading and empty states so blank graphs never look broken.
- [x] B100-05: Make evidence rows show live values, not generic labels.
- [x] B100-06: Preserve a11y and route-level E2E after the polish pass.
- [x] B100-07: Regenerate visual baselines after intentional design changes.
- [x] B100-08: Remove fake empty-state timeline markers and keep screenshots free of Next dev-overlay chrome.

## Remaining Non-Code Gaps

- Full 100 would require deeper product interactions beyond this frontend polish slice: saved investigations across all labs, annotation workflows everywhere, richer large-import progress, and a true interactive graph/heatmap canvas.
- The current work gets the visible product closer to the frontier-lab target without inventing fake capabilities.

## Verification

- `impeccable detect --fast --json apps/web`: passed with `[]`.
- `pnpm check`: passed.
- Visual snapshots force-regenerated from isolated data roots for the default Chromium suite: 3 passed.
- Visual snapshots force-regenerated from isolated data roots for Chromium, Firefox, and WebKit matrix: 9 passed.
- `pnpm e2e`: passed, 13 Playwright tests.
- `pnpm e2e:matrix`: passed, 9 cross-browser visual tests.

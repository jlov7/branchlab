# Project Plan (Weekend Build)

Goal: ship a polished MVP with a “wow” demo in < 2 days.

## Day 0 (Setup)
- [ ] Create Next.js app + monorepo structure
- [ ] Implement SQLite + blob store (`.atl/`)
- [ ] Implement trace ingestion pipeline (streaming)
- [ ] Load demo traces + render basic run list

## Day 1 (Core flows + polished UI foundation)
### Morning
- [ ] Design system: tokens, typography, layout, dark/light, motion
- [ ] Landing page + onboarding + empty states (non-template)
- [ ] Runs list + filters + search
- [ ] Run report page scaffold (summary strip + timeline + inspector)

### Afternoon
- [ ] Timeline virtualization + grouping
- [ ] Event inspector: rendered view + raw JSON
- [ ] Fork modal with intervention preview
- [ ] Replay-only branch generator (overlay patches)

### Evening
- [ ] Compare view v1:
  - [ ] first divergence
  - [ ] changed events list
  - [ ] JSON semantic diff component

## Day 2 (Policy + blame + export + testing)
### Morning
- [ ] Policy YAML engine + Policy Lab UI
- [ ] Policy evaluation result storage
- [ ] Impact preview charts

### Afternoon
- [ ] Blame heuristic (top-3 candidates) + UI panel
- [ ] Export bundle builder (HTML + JSON)
- [ ] Redaction toggle for exports

### Evening
- [ ] Unit tests for core diff/policy
- [ ] Playwright e2e for golden demo flows
- [ ] Docs + screenshots
- [ ] Final “make check && make e2e && make demo” run

## Definition of done
See `/docs/ACCEPTANCE_CHECKLIST.md`.

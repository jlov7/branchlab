# BranchLab Release Checklist

Use this file as go/no-go gate criteria. Every gate must be marked `pass` before release.

## Build & Test

- [x] `pnpm --filter @branchlab/web build` -> pass
- [x] `make check` -> pass
- [x] `make e2e` -> pass
- [x] `make e2e-matrix` -> pass
- [x] Visual regression snapshots validated (`tests/e2e/visual-regression.spec.ts`) -> pass
- [x] Accessibility suite (including modal states) -> pass
- [x] Responsive mobile flow test -> pass
- [x] `make demo` -> pass
- [x] `make preflight` -> pass

## Data Safety

- [x] Migrations apply cleanly (`make migrate-up`)
- [x] Migration status is consistent (`make migrate-status`)
- [x] Backup command returns path (`make backup`)
- [x] Restore validated from a real backup (`make restore BACKUP=...`)
- [x] Recovery check passes (`make recover`)

## Security

- [x] Dependency audit clean (`make audit`)
- [x] Secret scan clean (`pnpm scan:secrets`)
- [x] SBOM generated (`pnpm sbom`)
- [x] License report generated (`make licenses`)
- [x] Threat model reviewed (`docs/THREAT_MODEL.md`)

## Docs & OSS Readiness

- [x] `README.md` matches actual behavior/screens
- [x] API contracts documented (`docs/API_CONTRACTS.md`)
- [x] `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md` present
- [x] CHANGELOG + release notes template updated

## Owner Sign-Off

- Engineering owner: [ ]
- Product owner: [ ]
- Security owner: [ ]
- Release date approved: [ ]

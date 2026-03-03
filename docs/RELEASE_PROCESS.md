# Release Process

## Inputs

- Green local gates: `make preflight`
- Green build gate: `pnpm --filter @branchlab/web build`
- Release artifacts generated:
  - `pnpm metadata`
  - `pnpm package:release`
  - `pnpm sbom`
  - `make licenses`

## Steps

1. Ensure tracker `docs/plans/2026-03-03-release-readiness-master.md` has no open `P0` tasks.
2. Run backup/recovery checks:
   - `make backup`
   - `make recover`
3. Run performance/profile checks:
   - `make perf-budget`
   - `make profile-harness`
4. Build release package:
   - `make metadata`
   - `make package-release`
5. Validate production smoke:
   - `make smoke-prod`
6. Publish release notes from `docs/RELEASE_NOTES_TEMPLATE.md`.

## Output

- Release tarball under `artifacts/branchlab-release-*.tar.gz`
- Build metadata at `artifacts/build-metadata.json`
- SBOM at `artifacts/sbom.cdx.json`
- License report at `artifacts/licenses.json`

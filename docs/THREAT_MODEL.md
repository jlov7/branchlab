# BranchLab Threat Model

Date: 2026-03-03

## Assets

- Imported trace data (potentially sensitive and untrusted).
- Local database (`.atl/branchlab.sqlite`) and blobs (`.atl/blobs`).
- Export bundles (`.atl/exports`) that may contain sensitive text.
- Provider API credentials from environment variables.

## Trust Boundaries

1. Browser UI -> API routes.
2. API routes -> local filesystem/SQLite.
3. API routes -> external model provider APIs (re-exec mode only).

## Primary Threats and Controls

1. Untrusted trace payload causes script execution:
- Control: No `dangerouslySetInnerHTML` for trace payload rendering.
- Control: HTML escaping for generated report content.
- Control: CSP headers on all routes.

2. Sensitive data leakage in exports:
- Control: Redaction enabled by default.
- Control: Explicit unredacted warning path.

3. Destructive data races/corruption:
- Control: Route-level write locks for mutating operations.
- Control: Atomic file write utility for blob/export writes.
- Control: backup/restore/recover commands.

4. Re-execution misuse or unintended side effects:
- Control: re-exec explicit opt-in mode.
- Control: live-tool warning path and safety affordances.
- Control: provider config persisted locally with explicit enabling.

5. Dependency/supply-chain risks:
- Control: dependency audit command.
- Control: secret scan command.
- Control: SBOM and license-report generation commands.

## Residual Risks

- Local machine compromise can still expose `.atl` and environment variables.
- Rego source-to-WASM path depends on local tooling (`opa`, `tar`) if used.
- Re-exec output remains non-deterministic due to upstream model/provider behavior.

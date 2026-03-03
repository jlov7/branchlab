# Versioning Policy

BranchLab follows SemVer (`MAJOR.MINOR.PATCH`).

- `MAJOR`: backward-incompatible API, schema, or UX behavior changes.
- `MINOR`: backward-compatible feature additions.
- `PATCH`: backward-compatible bug/security/performance fixes.

## Release Notes Requirements

Every release must include:

1. Added / changed / fixed sections.
2. Migration notes if schema or settings changed.
3. Security notes if controls changed.
4. Verification evidence (`make preflight`, build, smoke).

## Tagging

- Git tag format: `vX.Y.Z`
- Changelog entry date uses ISO format (`YYYY-MM-DD`).

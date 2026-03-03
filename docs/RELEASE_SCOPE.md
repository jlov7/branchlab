# BranchLab v1 Release Scope

Date locked: 2026-03-03

## In Scope

- Local-first trace import, replay, branch, compare, policy evaluation, and export.
- Replay and re-execution branching with explicit risk controls.
- YAML policy engine and Rego/WASM path.
- SQLite + blob store persistence under `.atl/`.
- Release gates: `make check`, `make e2e`, `make demo`, `make preflight`.
- Security baseline: CSP, XSS guards, redacted exports by default.
- Public OSS readiness docs: contribution, support, code of conduct, security policy.

## Out of Scope

- Multi-user cloud tenancy and hosted control plane.
- Background distributed workers or queue clusters.
- Billing/subscription workflow.
- Fine-grained RBAC/auth system.
- Enterprise SSO and audit-log retention policies.
- Remote telemetry by default (diagnostics remain explicit opt-in).

## Non-Goals

- Replace full incident-management tooling.
- Provide real-time collaborative editing.
- Guarantee deterministic external provider behavior in re-execution mode.

## Freeze Rule

No new features are accepted during release hardening unless they are required to close a `P0` release blocker.

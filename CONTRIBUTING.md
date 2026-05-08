# Contributing

Thank you for contributing to BranchLab.

## Before You Start

- Read [README.md](README.md) for product context.
- Read [docs/ONBOARDING.md](docs/ONBOARDING.md) for local setup and workflows.
- Keep changes scoped to one logical concern.

## Prerequisites

- Node 20+
- `pnpm`

## Setup

```bash
make setup
```

## Development

```bash
make dev
```

## Quality Bar

Every change should maintain BranchLab's local-first release gates.

Required before opening or merging a PR:

```bash
make check
make e2e
make docs-links
pnpm --filter @branchlab/web build
```

Required for release-sensitive changes:

```bash
make preflight
```

## Pull Request Expectations

- Explain what changed and why.
- Note any user-facing behavior changes.
- Add or update tests for behavior changes.
- Update docs when interfaces, workflows, or guarantees change.
- Call out any follow-up work explicitly instead of leaving hidden assumptions.

## Commit Guidelines

- Use conventional-commit style messages where practical.
- Keep one logical change per commit.
- Avoid unrelated refactors in feature or fix commits.

## Reporting Security Issues

Do not open public issues for unpatched vulnerabilities. Use [SECURITY.md](SECURITY.md).

## Release Notes And Versioning

Follow [docs/VERSIONING.md](docs/VERSIONING.md) and update release-facing docs when relevant.

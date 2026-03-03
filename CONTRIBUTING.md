# Contributing

## Prerequisites

- Node 20+
- pnpm

## Setup

```bash
make setup
```

## Development

```bash
make dev
```

## Required Verification Before PR

```bash
make preflight
pnpm --filter @branchlab/web build
```

## Commit Guidelines

- Keep changes scoped to one logical concern.
- Add tests for behavior changes.
- Update docs when behavior changes.
- Follow SemVer + release notes rules in `docs/VERSIONING.md`.

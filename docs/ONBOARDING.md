# BranchLab Onboarding

## Goal

Get a new teammate from clone to meaningful BranchLab workflow in under 30 minutes.

## Prerequisites

- macOS or Linux shell.
- Node.js 20+.
- `pnpm` available (or use `make setup` to bootstrap).

Optional for Rego source compilation:
- `opa`
- `tar`

## Track A: Product Walkthrough (10 Minutes)

1. Install dependencies:
   ```bash
   make setup
   ```
2. Seed demo traces:
   ```bash
   make demo
   ```
3. Start app:
   ```bash
   make dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) and run [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

## Track B: Engineering Onboarding (30 Minutes)

1. Run full local checks:
   ```bash
   make check
   make e2e
   ```
2. Review core architecture docs:
   - [ARCHITECTURE.md](ARCHITECTURE.md)
   - [TECHNICAL_DEEP_DIVE.md](TECHNICAL_DEEP_DIVE.md)
   - [API_CONTRACTS.md](API_CONTRACTS.md)
3. Run full release preflight:
   ```bash
   make preflight
   ```

## Development Workflow

- Start local app: `make dev`
- Run unit + lint + type checks: `make check`
- Run end-to-end tests: `make e2e`
- Run cross-browser visual checks: `make e2e-matrix`
- Run release-grade gate: `make preflight`

## Data Safety Commands

```bash
make migrate-up
make migrate-status
make backup
make restore BACKUP=/absolute/path/to/backup
make recover
```

## First Contribution Checklist

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md).
2. Pick an issue or planned task.
3. Implement smallest coherent change.
4. Run `make check` and the relevant e2e tests.
5. Update docs for behavior changes.
6. Include verification evidence in PR notes.

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common setup and runtime issues.

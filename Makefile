SHELL := /bin/bash

.PHONY: setup dev check test e2e demo e2e-visual e2e-matrix preflight audit sast secrets sbom licenses metadata package-release smoke-prod migrate-up migrate-down migrate-status backup restore recover perf-budget profile-harness benchmark-suite clean

setup:
	corepack enable || true
	pnpm -v || npm i -g pnpm
	pnpm install

dev:
	pnpm dev

check:
	pnpm lint
	pnpm typecheck
	pnpm test

test:
	pnpm test

e2e:
	pnpm e2e

demo:
	pnpm demo

e2e-visual:
	pnpm e2e:visual

e2e-matrix:
	pnpm e2e:matrix

preflight:
	pnpm preflight

audit:
	pnpm audit:deps

sast:
	pnpm sast

secrets:
	pnpm scan:secrets

sbom:
	pnpm sbom

licenses:
	pnpm licenses:report

metadata:
	pnpm metadata

package-release:
	pnpm package:release

smoke-prod:
	pnpm smoke:prod

migrate-up:
	pnpm migrate:up

migrate-down:
	pnpm migrate:down

migrate-status:
	pnpm migrate:status

backup:
	pnpm backup

restore:
	@if [ -z "$(BACKUP)" ]; then echo "Usage: make restore BACKUP=/absolute/path/to/backup"; exit 1; fi
	pnpm --filter @branchlab/web restore -- "$(BACKUP)"

recover:
	pnpm recover

perf-budget:
	pnpm perf:budget

profile-harness:
	pnpm profile:harness

benchmark-suite:
	pnpm benchmark:suite

clean:
	rm -rf node_modules .turbo apps/web/.next apps/web/playwright-report apps/web/test-results .atl

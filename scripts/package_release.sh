#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p artifacts
pnpm metadata

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="artifacts/branchlab-release-${STAMP}.tar.gz"

tar -czf "$OUT" \
  README.md LICENSE Makefile package.json pnpm-lock.yaml pnpm-workspace.yaml \
  docs apps packages examples assets \
  artifacts/build-metadata.json

echo "$OUT"

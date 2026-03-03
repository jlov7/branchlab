#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PATTERN='(AKIA[0-9A-Z]{16}|sk_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----)'

if rg -n --hidden --glob '!node_modules/**' --glob '!**/.next/**' --glob '!.atl/**' --glob '!pnpm-lock.yaml' --glob '!**/*.test.*' --glob '!**/tests/**' -e "$PATTERN" .; then
  echo "secret scan failed: potential credential-like material detected"
  exit 1
fi

echo "secret scan passed"

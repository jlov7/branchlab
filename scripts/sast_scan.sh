#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PATTERN='(dangerouslySetInnerHTML|new Function\(|\beval\(|child_process\.exec\()'

if rg -n --hidden --glob '!node_modules/**' --glob '!**/.next/**' --glob '!.atl/**' --glob '!**/*.test.*' --glob '!docs/**' --glob '!scripts/sast_scan.sh' -e "$PATTERN" apps packages scripts; then
  echo "sast scan failed: potentially unsafe pattern detected"
  exit 1
fi

echo "sast scan passed"

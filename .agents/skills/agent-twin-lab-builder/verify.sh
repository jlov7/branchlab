#!/usr/bin/env bash
set -euo pipefail

make setup
make check
make e2e

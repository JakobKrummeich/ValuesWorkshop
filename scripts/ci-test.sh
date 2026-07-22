#!/usr/bin/env bash
set -euo pipefail

echo "=== FE tests + coverage ==="
pnpm --dir frontend test

echo "=== BE tests + coverage ==="
scripts/test-backend-with-coverage.sh

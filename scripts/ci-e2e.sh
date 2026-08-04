#!/usr/bin/env bash
set -euo pipefail

compose=(docker compose -f docker-compose.dev.yml)

cleanup() {
  "${compose[@]}" down --volumes
}
trap cleanup EXIT

echo "=== Compose stack ==="
"${compose[@]}" up --detach --build --wait

echo "=== Playwright e2e ==="
pnpm exec playwright test

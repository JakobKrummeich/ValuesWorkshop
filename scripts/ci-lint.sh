#!/usr/bin/env bash
set -euo pipefail

echo "=== FE lint ==="
pnpm --dir frontend lint

echo "=== FE build ==="
pnpm --dir frontend build

echo "=== BE build (analyzers) ==="
dotnet build backend/ValuesWorkshop.sln

echo "=== BE format check ==="
dotnet csharpier check backend/

echo "=== BE vulnerabilities ==="
scripts/check-backend-vulnerabilities.sh

echo "=== Duplication (both) ==="
pnpm -w jscpd

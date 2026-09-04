#!/usr/bin/env bash
set -euo pipefail

echo "=== FE lint (includes phase enum codegen drift) ==="
pnpm --dir frontend lint

echo "=== FE build ==="
pnpm --dir frontend build

echo "=== BE build (analyzers) ==="
dotnet build backend/ValuesWorkshop.sln

echo "=== BE format check ==="
dotnet csharpier check backend/

echo "=== FE vulnerabilities ==="
pnpm --dir frontend audit:check

echo "=== BE vulnerabilities ==="
scripts/check-backend-vulnerabilities.sh

echo "=== Dependency advisories (osv-scanner over lockfile and SBOMs) ==="
pnpm run advisories:scan

echo "=== Duplication (both) ==="
pnpm -w jscpd

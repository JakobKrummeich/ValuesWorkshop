#!/usr/bin/env bash
set -euo pipefail

OUTPUT=$(dotnet list backend/ValuesWorkshop.All.sln package --vulnerable 2>&1)
echo "$OUTPUT"

if echo "$OUTPUT" | grep -qi "critical\|high"; then
  echo "ERROR: High or Critical vulnerable packages found."
  exit 1
fi

echo "No high/critical vulnerabilities found."

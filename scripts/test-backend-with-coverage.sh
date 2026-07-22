#!/usr/bin/env bash
set -euo pipefail

THRESHOLD=80
RESULTS_DIR="backend/TestResults"

rm -rf "$RESULTS_DIR"

dotnet test backend/ValuesWorkshop.Tests.slnf \
  --collect:"XPlat Code Coverage" \
  --results-directory "$RESULTS_DIR" \
  -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.ExcludeByFile="**/Program.cs"

dotnet reportgenerator \
  -reports:"$RESULTS_DIR/*/coverage.cobertura.xml" \
  -targetdir:"$RESULTS_DIR/merged" \
  -reporttypes:TextSummary

LINE_COV=$(grep 'Line coverage:' "$RESULTS_DIR/merged/Summary.txt" | grep -oE '[0-9.]+')

echo "Line coverage: ${LINE_COV}% (threshold: ${THRESHOLD}%)"

if awk "BEGIN {exit !(${LINE_COV} < ${THRESHOLD})}"; then
  echo "ERROR: Line coverage ${LINE_COV}% is below threshold ${THRESHOLD}%"
  exit 1
fi

echo "Coverage gate passed."

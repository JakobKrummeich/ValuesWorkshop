#!/usr/bin/env bash
set -euo pipefail

BACKEND_PORT="${BACKEND_PORT:-5000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
TIMEOUT="${STARTUP_TIMEOUT:-60}"
POLL_INTERVAL=1

PIDS=()
cleanup() {
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

echo "Starting backend on :${BACKEND_PORT}..."
ASPNETCORE_URLS="http://localhost:${BACKEND_PORT}" \
  dotnet run --project backend/Host --no-launch-profile &
PIDS+=($!)

echo "Starting frontend on :${FRONTEND_PORT}..."
PORT="${FRONTEND_PORT}" pnpm --dir frontend dev &
PIDS+=($!)

poll_endpoint() {
  local url="$1"
  local name="$2"
  local elapsed=0
  while [ "$elapsed" -lt "$TIMEOUT" ]; do
    if curl -sf "$url" > /dev/null 2>&1; then
      echo "✓ ${name} responding at ${url}"
      return 0
    fi
    sleep "$POLL_INTERVAL"
    elapsed=$((elapsed + POLL_INTERVAL))
  done
  echo "✗ ${name} failed to respond within ${TIMEOUT}s"
  return 1
}

BACKEND_OK=0
FRONTEND_OK=0

poll_endpoint "http://localhost:${BACKEND_PORT}/health" "Backend" && BACKEND_OK=1
poll_endpoint "http://localhost:${FRONTEND_PORT}" "Frontend" && FRONTEND_OK=1

if [ "$BACKEND_OK" -eq 1 ] && [ "$FRONTEND_OK" -eq 1 ]; then
  echo "All services started successfully."
  exit 0
else
  echo "Startup verification failed."
  exit 1
fi

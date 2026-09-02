# Task 27 — Full 9-phase e2e stability

Audit result: the suite (9 specs, 92 tests) already runs with `retries: 0`,
`workers: 1`, so no flake can hide behind retries; CI executes the identical
`scripts/ci-e2e.sh`. CI history shows zero e2e failures (the one red main run
was the vuln-scan job; its e2e job was green).

## Decisions

- **D1 — evidence, not new code.** A "run" is one full `./scripts/ci-e2e.sh`
  (compose up, all 92 tests, compose down). Acceptance = 3 consecutive local
  runs green plus the PR's CI run; run counter restarts after any failure.
- **D2 — deflake by root cause.** Any failure gets diagnosed and fixed at the
  source (waits on state, not sleeps; unique test data); never `retries > 0`,
  never test deletion, never timeout inflation without a written reason.
- **D3 — record the evidence.** Tick the Task 27 box in `tasks/todo.md` with a
  verification note listing the 3 run results (pass counts + durations).
- **D4 — ship shape.** If no code change is needed, the PR is doc-only
  (todo tick + note) and may skip the no-mistakes gate per the doc-only rule;
  any deflake fix makes it a normal gated + lightspeed-reviewed PR.

## Verification

`./scripts/ci-e2e.sh` 3× consecutively green locally + green CI on the PR.

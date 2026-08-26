# Task 20b — Checkpoint D: workshop-at-scale e2e

Size: S. Branch: `checkpoint-d-scale-e2e`. Decided in review 2026-08-26:
Checkpoint D lands as its own slice, upgraded from 8 to **30 participants**
so the wall paging mechanism is exercised too.

## Behavior

One new Playwright spec drives a full workshop with 30 participants:
30 joins land 7 groups (2×5 + 5×4 per `GroupSizing`), the presenter wall
pages 6 cards at a time (7 s cycle) in phases 5 and 6, the facilitator
reassigns a scribe mid-phase-6 (old scribe loses the editor, new one gains
it), every group submits, and only then can the facilitator advance.

## Decisions

- **D1 — dev OIDC grows 30 committed accounts** (`participant1..30`,
  generated in a loop in `devtools/oidc/index.js`) — no bind-mounts,
  CI builds the image from the repo.
- **D2 — one browser context per participant, closed after use** so 30
  sign-ins stay within CI memory; only the pages a step asserts on stay open.
- **D3 — paging asserted by card identity**: at most 6 `group-card-*`
  visible, `expect.poll` sees a page-2 animal appear and a page-1 animal
  leave within one cycle.

## Out of scope

Task 21 (phase 7). New product code beyond the OIDC account list.

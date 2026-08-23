# Task 19b — Group formation progress bar

Size: S. Branch: `task-19b-group-formation-progress`. Runs before Task 20.
Decided in review 2026-08-22 (recorded in spec 19a §D1).

## Why

Entering group formation currently snaps straight to the finished groups —
the solver is fast, so the room gets no beat that says "something is
happening here". A fixed progress bar gives that beat.

## Behavior

On entering phase 5, the presenter and the participant screens show a
progress bar that runs for a **fixed 3 seconds**, regardless of how long
formation actually took, then reveal what they show today (presenter:
paginated cycling group cards; participant: own group card). The advance to
group work stays **facilitator-triggered** — the bar triggers no transition.

## Decisions

> **D1 and D2 superseded by review 2026-08-22 (round 2).** The reviewer
> pivoted: the progress belongs to the backend, so every client — including
> one that reloads or joins while the bar is running — subscribes to the same
> emitted state instead of the frontend guessing from an observed transition.
> `isPhaseEntryObserved` goes away. The decisions below are what the branch
> did first; the live design is under "Backend-emitted formation progress".

- ~~**D1 — frontend-only.** Formation stays synchronous inside `AdvancePhase`;
  the bar is presentation, not progress reporting. No backend change, no new
  wire field, no state-machine change.~~
- ~~**D2 — the bar runs on observed entry, not on mount.** A client that sees
  phase 4 → 5 while connected plays the 3 s bar. A client that mounts
  directly into phase 5 (reload, late join) goes straight to the cards — a
  latecomer must not be held behind a fake wait.~~
- **D3 — facilitator screen unchanged.** The facilitator is driving; the
  dramatic beat is for the room. Their dense group list appears as it does
  today.
- **D4 — shared component.** One `FormationProgressBar` used by both
  screens, sized by its container; design tokens only, no bespoke colors.

## Backend-emitted formation progress (round 2, approved)

The backend owns the clock end to end. Phase 5 carries a sub-state
`Forming` → `Formed`, mirroring how the quiz models its walk. Clients render
the bar straight from the emitted progress value and track nothing
themselves — a reload or a late join mid-window simply shows the current
progress.

Flow:

1. The facilitator advances. Entering phase 5 does **not** form groups;
   solving is a lazy side effect of the session being in phase 5 and not yet
   formed.
2. The solve starts in the background and the server emits progress 0.
3. Every ~50 ms the server emits an advancing progress value, so the bar
   moves continuously.
4. At 3 s the server applies the assignment the solver found and emits the
   groups.
5. If the solver has not produced an assignment by the deadline, a quick
   random fallback assigns participants and values instead — insurance,
   living outside the CP-SAT adapter.

While `Forming` the wire carries **no groups at all**: a screen must not show
what it must not show, so the data is not sent.

- **D3 — restart.** Formation runs are in-memory only; the persisted truth is
  just "formed with these groups" or "not formed". A server that restarts
  mid-window therefore finds an unformed phase-5 session and starts the run
  again from zero, bar included. A session that was already formed simply
  shows its groups.
- **D4 — transport.** The progress rides the existing role-specific workshop
  state push. No second channel, no new message type.
- **D5 — facilitator.** Sees the same progress bar, and `AdvancePhase` is
  refused until the groups are formed.
- **D6 — scope.** The approved presenter wall redesign ships on this same
  branch.

## Known behavior

A client that drops its connection before the 4 → 5 advance and reconnects
after it stays mounted, so it watches the phase change and plays the full
3 s bar — minutes late, saying "Forming groups…" for groups that already
exist. Accepted: the bar is a fixed beat for the room, and the extra
machinery to tell a late reconnect from a live advance costs more than the
rare stale bar. A reload or a late join in phase 5 still skips the bar (D2).

## Presenter wall redesign (folded in, review 2026-08-22)

Verification screenshots of a real 24-participant workshop showed the phase-5
wall clipping every member name. The repo owner reviewed them and decided the
fix lands in this task as its own commit:

- **Six cards per page stay** (3×2) — no fewer cards, no extra pages.
- **Member names become chips**, grouped top-left under the group name,
  flex-wrapping.
- **Values stay chips**, grouped bottom-right, flex-wrapping.
- **One color for all names, one color for all values, the two differ** — no
  per-value color variety.
- **The presenter header goes away**: no `Presenter` heading, and no language
  switcher anywhere on the presenter — the wall is non-interactive. The space
  goes to the cards.
- **Font sizes are tuned so everything fits**: with 24 participants in 6 groups
  of 4, every member name and every value chip is fully visible on a 1920×1080
  wall.

## Slices

1. `FormationProgressBar` component + hook (3 s timer, cleanup on unmount).
2. Presenter phase-5 screen shows the bar on observed entry, then the cards.
3. Participant phase-5 screen shows the bar on observed entry, then the own
   group card.
4. E2e: advancing into phase 5 shows the bar on both screens and the cards
   after it; a client that reloads during phase 5 sees the cards immediately.

## Out of scope

Real solver progress, auto-advance to phase 6, facilitator screen changes,
phase-6 work (Task 20).

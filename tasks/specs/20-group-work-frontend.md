# Task 20 — Group work frontend

Size: M. Branch: `task-20-group-work-frontend`. Depends on 19b (merged).

## Why

Phase 6 backend is fully built — domain, intents, persistence, state
mappers — but every frontend screen stubs `Phase.GroupWork` as `EmptyPhase`.
Participants see nothing; the facilitator cannot oversee or reassign scribes;
the presenter wall shows a blank page. This task wires the frontend to the
existing backend so a workshop can play through group work.

## Behavior

### Participant — scribe

The scribe sees their group name, member names, and a row of **value tabs**
(one per assigned value). Selecting a tab shows that value's actions. The
scribe can:

- **Add** an action (free-text input, max 200 text elements, up to 5 per
  value).
- **Edit** an existing action inline.
- **Remove** an action.
- **Submit** once every assigned value has at least one action.
- **Reopen** after submitting to keep editing.

Every edit the scribe makes is sent to the backend immediately: adding an
action, removing an action, submitting, reopening, and — crucially — every
keystroke while editing action text (debounced ~300 ms via `EditAction`).
There is no draft buffer and no explicit save button; the backend is the
source of truth and other group members see the scribe’s work evolving in
near-real-time through the next state push (~0.5 s). This requires a
backend change: `GroupActionText` currently rejects empty strings, but a
scribe who just created an action has not typed anything yet. Per D9,
empty text is allowed during editing; `SubmitGroupWork` rejects groups
with empty actions.

The submit button is disabled with a hint until every value carries ≥ 1
action.

### Participant — member (non-scribe)

An exact **read-only mirror** of the scribe's view: same group header, same
value tabs, same action list — the member sees every keystroke the scribe
saves, in near-real-time. The scribe's name is shown. Live updates arrive
through normal state pushes (the existing ~0.5 s broadcast interval is
sufficient); no special polling or separate channel needed.

### Facilitator

A table showing every group: group name, current scribe, total action count
across values, and editing/submitted status. The facilitator can:

- **Reassign scribe** via a dropdown of the group's members.
- **Advance phase** only when every group is submitted (button disabled with
  a reason until then).

### Presenter

The same paginated 3×2 card grid from phase 5 (reuse `GroupCard` and the
page-cycling hook), but each card now shows a **working / submitted**
indicator badge. No actions or scribe details on the wall.

## Decisions

- **D1 — Zod schemas extend the existing view records.** The backend already
  sends `OwnGroupView` with nullable `IsCallerScribe`, `ScribeName`,
  `WorkStatus`, and `Actions` fields (null in phase 5, populated in phase 6).
  The frontend schemas add these optional fields to the existing
  `ownGroupViewSchema`, `facilitatorGroupsSchema`, and
  `presenterGroupsSchema` — no new top-level block type needed.
- **D2 — No optimistic updates for structural mutations.** Add, remove,
  submit, and reopen round-trip through the hub and the next state push
  reflects them. For text edits, the scribe’s local input is shown
  immediately (controlled component) while the debounced `EditAction`
  syncs to the backend; the scribe does not wait for the round-trip to see
  their own typing.
- **D3 — Value tabs, not an accordion.** Tabs match the wireframe, keep all
  values visible at a glance, and work well on portrait phones. The first
  tab is selected by default.
- **D4 — Always-editable text.** Each action’s text is a live input field
  for the scribe (no edit-icon toggle). Typing is throttled (~300 ms
  snapshots) into `EditAction` intents. Members see the same text as a
  read-only span. Keeps the scribe in flow and guarantees every edit is
  broadcast.
- **D5 — Shared `GroupWorkCard` component.** Both scribe and member views
  render the same card; the member view is a pixel-identical read-only
  mirror of the scribe view (no inputs, no buttons, but same layout, same
  tabs, same action list). The `isCallerScribe` flag controls whether
  interactive elements appear. One component, two modes.
- **D6 — Facilitator reassign is a native `<select>`.** Simple, accessible,
  no custom dropdown. The current scribe is pre-selected.
- **D7 — Presenter reuses GroupCard.** The phase-5 `GroupCard` already shows
  name, members, and values as chips. Phase 6 adds only a status badge
  (CSS, not a new component).
- **D8 — Scribe intent commands reuse the hub.** The `useSessionGateway`
  hook already exposes `sendIntent`; each command is a thin intent message.
  No new transport.
- **D9 — Empty action text during editing.** Option A chosen: relax
  `GroupActionText` to allow empty/whitespace during editing;
  `SubmitGroupWork` still guards that every value has ≥ 1 non-empty
  action.

## Slices

### Frontend types

1. Extend `workshopStateBlocks.ts`: add `GroupWorkStatus` enum, optional
   `isCallerScribe`, `scribeName`, `workStatus`, `actions` to
   `ownGroupViewSchema`; optional `scribeParticipantId`, `workStatus`,
   `actionCountPerValue` to facilitator groups; optional `workStatus` to
   presenter groups. Add `GroupActionView` schema.
2. Extend `workshopState.ts`: phase-6 participant/facilitator/presenter
   state types use the enriched schemas (no longer `EmptyPhase`).
3. Add intent command types for `addAction`, `editAction`, `removeAction`,
   `submitGroupWork`, `reopenGroupWork`, `reassignScribe`.

### Participant screens

4. `GroupWorkCard` component: group header (name, members, scribe label),
   value tabs, action list (read-only mode).
5. Scribe mode: add-action input, inline edit, remove button, submit/reopen
   button with disabled-reason hint.
6. `ParticipantGroupWorkScreen` wires `GroupWorkCard` to state, sends
   intents through the gateway.

### Facilitator screen

7. `FacilitatorGroupWorkScreen`: table of groups with scribe dropdown,
   action count, status badge. Advance button disabled until all submitted.

### Presenter screen

8. `PresenterGroupWorkScreen`: paginated 3×2 `GroupCard` grid (reuse
   phase-5 cycling hook), each card shows a working/submitted badge.

### Tests and e2e

9. Unit tests for each component and screen (jest + RTL).
10. Extend Playwright e2e through phase 6: scribe adds actions, submits;
    member sees them read-only; facilitator reassigns scribe; advance
    succeeds only after all groups submit.

## Out of scope

- Phase 7 (value presentation) — Task 21.
- Real-time collaborative editing / conflict resolution beyond last-write-wins.
- Action reordering by drag-and-drop.
- Rich text in actions.
- Offline / PWA support.

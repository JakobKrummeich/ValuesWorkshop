# Spec 19 — Group work backend

> Approved via Lavish (all five decisions accepted; "ok! good to go,
> please implement this!").

## Objective

Phase 6 becomes operational on the backend: entering group work
appoints one random scribe per group; the scribe (and only the scribe)
creates, edits and removes 1–5 actions per assigned value and submits
or reopens the group's work; the facilitator can hand the scribe role
to another member at any time, revoking the old scribe's rights
instantly. Everything survives restart. No screens — Task 20.

Domain-model references: intents AppointScribes / ReassignScribe /
AddAction / EditAction / RemoveAction / SubmitGroupWork /
ReopenGroupWork; invariants I9 (one scribe, a member), I10
(scribe-only during group work), I11 (1–5 actions per value at
submit, no edits while submitted). The phase exit guard
(`GroupWorkExitGuard` → `IsEveryGroupSubmitted`) already exists and
becomes satisfiable for the first time.

## Scope

### 1. Domain

- `GroupAction` record: `ActionId` (new Guid-backed value object),
  `ValueId`, `Text`. List position in the group = durable sort order.
- `GroupActionText` value object: trims, refuses blank
  (`MalformedPayload` at the boundary), truncates to 200 text
  elements — `ParticipantName` precedent (80).
- `Group` grows the behavior its restore-only fields await:
  `AppointScribe` (internal, random member via `IRandomness`),
  `ReassignScribe` (member-only, I9), `AddAction` / `EditAction` /
  `RemoveAction` / `Submit` / `Reopen` — each refuses non-scribe
  callers (I10), edits while submitted and the sixth action per value
  (I11); `Submit` requires 1–5 actions for every assigned value.
  `Group.Restore` grows an actions parameter.
- `ScribeAppointment` domain service — the second `IPhaseEntryAction`
  (Task 18 template): ctor-DI `IRandomness`, self-guarding
  `ExecuteFor` (no-op unless phase 6; skips groups that already have a
  scribe, so restore/restart never re-appoints). Zero handler change.
- `Session` entry points mirroring the `ChooseQuizAnswer` pattern
  (phase guard + roster guard + delegate to the caller's group):
  `AddGroupAction`, `EditGroupAction`, `RemoveGroupAction`,
  `SubmitGroupWork`, `ReopenGroupWork` — all locked to phase 6 (I10:
  from phase 7 on, only the facilitator's wording fix exists — T21).
  `ReassignScribe(newScribe)` — allowed phase 6 onward ("anytime",
  SPEC; before phase 6 no scribes exist), target addressed by
  `ParticipantId` alone: a participant sits in exactly one group, so
  the group is derived, and I9 (member-only) holds by construction.
  Reassigning the current scribe is a no-op.

### 2. Application + Web

- Participant commands + `ParticipantIntentHandler` methods:
  `AddActionCommand` (valueId, text), `EditActionCommand` (actionId,
  text), `RemoveActionCommand` (actionId), `SubmitGroupWorkCommand`,
  `ReopenGroupWorkCommand`. The handler generates the fresh
  `ActionId` for adds (Application-side, `Guid.NewGuid()`): the
  Domain stays free of nondeterminism (`IRandomness` port precedent;
  `ParticipantId` is likewise created outside the Domain).
- Facilitator: `ReassignScribeCommand` through the existing
  `ExecuteAsFacilitatorAsync` choke point; `reassignScribe` joins
  `FacilitatorEnabledIntents` from phase 6 on.
- Hub methods: `ParticipantHub.AddAction/EditAction/RemoveAction/
  SubmitGroupWork/ReopenGroupWork`, `FacilitatorHub.ReassignScribe`.
- Rejection mapping: non-scribe (and reassign target outside the
  roster) → `NotAuthorized`/`UnknownParticipant`; bound violations,
  unknown actionId/valueId, edits while submitted, submit with a
  value at zero actions → `InvariantViolated`; outside phase 6 →
  `WrongPhase`; blank text / unparseable ids → `MalformedPayload`.

### 3. Wire (workshop-state blocks)

- Participant `ownGroup` += `isCallerScribe?`, `scribeName?`,
  `workStatus?` (`editing` | `submitted`), `actions?` (actionId,
  valueId, text, sortOrder).
- Facilitator `groups[]` += `scribeParticipantId?`, `workStatus?`,
  `actionCountPerValue?`.
- Presenter `groups[]` += `workStatus?`.
- All optionals: absent before phase 6, exactly as protocol §5.2–5.4
  already documents. Protocol's "absent until T20" notes on `actions?`
  / `actionCountPerValue?` are superseded (decision 2); protocol.md
  updated in this task.

### 4. Persistence

- `group_actions` gains an `action_id` column (Guid as string):
  the int PK is regenerated on every save (delete + reinsert), so it
  cannot serve as the wire/domain identity. Migration included.
- `DomainEntityMapper` wires `Actions` both directions (scaffolding
  exists but is unconnected); `Scribe`/`IsSubmitted` already
  round-trip via `Group.Restore`.

## Out of scope

All frontend (Task 20 — screens, zod schemas, live member view,
facilitator reassignment UI; the new wire optionals are ignored by
today's clients). Presentation block + facilitator typo-edit (T21).
e2e extension through phase 6 (T20, per todo). Auto-reappointment when
a scribe disconnects — reassignment is the facilitator's manual remedy
(SPEC: "dead phone").

## Success criteria

- [ ] Entering phase 6 appoints exactly one scribe per group, a
      member, chosen via `IRandomness`; restore/restart keeps the
      same scribes and actions (round-trip test)
- [ ] Non-scribe create/edit/remove/submit/reopen rejected
      `NotAuthorized`; after reassignment the old scribe is rejected
      immediately, the new one accepted (single test flow)
- [ ] Sixth action per value refused; submit with any assigned value
      at zero actions refused; edits while submitted refused; reopen
      restores editability (I11)
- [ ] `AdvancePhase` out of phase 6 refused until every group
      submitted, then succeeds (existing guard, first live test)
- [ ] Late joiner during phase 6 lands in the smallest group, scribe
      untouched
- [ ] Wire blocks carry the new optionals exactly per protocol
      §5.2–5.4 (absent pre-phase-6), protocol.md updated
- [ ] `./scripts/ci-lint.sh` + `./scripts/ci-test.sh` green (e2e
      untouched)

## Verification

`./scripts/ci-lint.sh` · `./scripts/ci-test.sh` (BE group-work suite;
FE and e2e untouched)

## Slices (implementation order)

1. Domain: `GroupAction`/`GroupActionText`, `Group` mutators +
   invariants, `ScribeAppointment`, `Session` entry points — unit
   tests per invariant.
2. Persistence: `action_id` column + migration + mapper wiring —
   round-trip tests.
3. Application/Web: commands, handlers, hubs, enabled intents,
   rejection mapping — handler tests.
4. Wire: view records + the three state mappers + protocol.md update
   — mapper tests.

## Decisions (for this review)

1. **Stable `ActionId`, Application-generated.** Wire + edit/remove
   addressing need identity that survives the repository's
   delete-and-reinsert save; the DB int PK does not. A Guid value
   object created in the handler keeps the Domain deterministic
   (`IRandomness`/`ParticipantId` precedents). Alternative
   (valueId + index addressing, no new column) rejected: fragile
   under stale clients, and protocol already pins `actionId`.
2. **Full group-work wire ships now, not split with T20.** Protocol
   parked `actions?`/`actionCountPerValue?` under "absent until T20",
   but that would smear backend work into the frontend task. T19 =
   whole backend, T20 = purely frontend. Protocol notes updated.
3. **`ReassignScribe` addresses the participant only** — group
   derived from membership; I9 holds by construction; no group name
   on the wire. Allowed phase 6+.
4. **Scribe intents locked to phase 6.** I10 gives later phases to
   the facilitator's wording fix only (T21); reopen after advancing
   would contradict "only submitted results are presented" (I12).
5. **Action text: trim, refuse blank, truncate at 200** —
   `ParticipantName` truncation precedent rather than a rejection,
   sized for a pragmatic action sentence.

---

> **Revised during implementation (slice 1):** the six Session entry
> points became the static Domain facade `GroupWork` (`AddAction`,
> `EditAction`, `RemoveAction`, `Submit`, `Reopen`, `ReassignScribe`,
> each taking the session as first argument). Putting them on
> `Session` would break the 12-public-method ArchUnit cap
> (`design/architecture.md` §6, Ask-first), and domain-model §4
> assigns these commands to the `Group` aggregate anyway — the wrapper
> is pure routing (roster guard + phase guard + group lookup via
> membership), following the stateless-static precedent of
> `PhaseExitGuards` and `GroupSizing`. Guards as specified: actions,
> submit and reopen locked to phase 6; `ReassignScribe` allowed
> phase 6 onward.

> **Revised during implementation (slice 4 follow-up):** one FE line
> after all — `FacilitatorIntent.ReassignScribe` in
> `frontend/src/domain/workshopState.ts`. `enabledIntents` is
> validated with `z.enum(FacilitatorIntent)`, which rejects unknown
> names (it is not an ignorable optional field): without the enum
> value, a facilitator client in phase 6+ fails to parse the whole
> state. The T20 screens still own every visible use of the intent.

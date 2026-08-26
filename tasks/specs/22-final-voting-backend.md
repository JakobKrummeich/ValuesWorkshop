# Task 22 — Final voting backend (phase 8)

Backend only; frontend lands in Task 23. Implements the voting round
mechanics deferred from Task 11 (Q1): `SubmitFinalVotes`, `CloseVoting`,
`StartTiebreakRound`, `WinnersDetermined`, persisted, per invariants
I13–I15 and the wire shapes already fixed in `design/protocol.md` § 5.2–5.4.

> Pivoted in spec review 2026-08-26: a round's allotment equals the number
> of winner slots still open — 5 in the main round (5 winners searched);
> a tiebreak searching 3 remaining winners gives each participant 3 votes.
> This supersedes the "as many votes as tied values" wording in SPEC.md,
> domain-model I13, and the protocol guard text — all updated in this
> task's PR.

## Objective

Each participant spends exactly 5 votes across the presented values
(multi-votes up to 5 on one value), secretly and anonymously. Closing the
round locks in every value that clearly made the top 5; a tie straddling
5th place sends exactly the tied values into a facilitator-started tiebreak
round (allotment = number of winner slots still open), repeating until
exactly 5 winners stand (I15). The existing `FinalVotingExitGuard` then releases
phase 8 → 9.

## Decisions

- **D1 — round lifecycle on `VotingRounds`.** New mutators on the existing
  scaffold: `OpenRound(allotment, eligibleValues)`,
  `RecordBallot(participantId, votes)`, `CloseRound()`,
  `StartTiebreak()`. `CloseRound()` ranks the round's eligible values by
  that round's tallies, locks every value strictly above the 5th-place
  boundary as a winner, and either completes the winners (exactly 5) or
  records the tied values for the next round.
- **D2 — rounds are independent.** A tiebreak ranks only its own tallies
  over only the tied values; earlier rounds' counts never bleed in.
- **D3 — phase entry opens round 1** via `VotingOpening : IPhaseEntryAction`
  (mirrors `PresentationOpening`, registered in `Host/Program.cs`):
  allotment 5 (5 open slots), eligible = all dealt top values (union of the groups'
  assigned values — at least 10, more when values tie for 10th place in
  value selection, so eligible count > 5 needs no special case).
- **D4 — anonymity by construction (I14).** A ballot adds counts to the
  round's tally map and adds the caller to a per-round has-voted set; the
  votes themselves are never stored against the voter. No un-vote.
- **D5 — ballot validation (I13).** Rejected unless: round open, caller has
  not voted this round, every value eligible this round, counts ≥ 1, total
  spend == the round's allotment. `MalformedPayload` for shape errors,
  `InvariantViolated` for rule breaches, `WrongPhase` outside phase 8.
- **D6 — full per-round statistics persist in the database.** Every round's
  record survives: round number, allotment, eligible values, final tallies,
  and its outcome (locked winners / tied values). This history feeds the
  facilitator's `closedRoundTallies?` / `tiedValueIds?` fields now and the
  final PDF's anonymous vote statistics in Task 24. Winner vote counts
  (valueId + count from the round it won in) derive from this history for
  the phase-9 `conclusion` block.
- **D7 — wire blocks per protocol.** Participant `voting`: `roundNumber`,
  `allotment`, `eligibleValueIds`, `isRoundOpen`, `hasVotedThisRound`.
  Facilitator: those minus `hasVotedThisRound`, plus `votedCount`,
  `closedRoundTallies?`, `tiedValueIds?`. Presenter: `isRoundOpen` only.
  No tallies on any wire while a round is open.
- **D8 — intents + `enabledIntents`.** `SubmitFinalVotes` (participant hub,
  payload `{ votes: [{ valueId, voteCount }] }`), `CloseVoting` and
  `StartTiebreakRound` (facilitator hub, no payload; enabled exactly when
  their guards pass: round open, resp. closed round left a tie).
- **D9 — persistence.** New tables for round state, tallies, has-voted
  membership, and winners; Sqlite round-trip tests modeled on
  `SqlitePresentationRoundTripTests.cs`. A dedicated anonymity test asserts
  the vote-related schema and rows carry no participant identifier.

## Slices

1. Domain: `VotingRounds` mutators + winner/tiebreak math, unit tests incl.
   repeated ties and an all-zero-tally close (10-way tie → full tiebreak).
2. `Session` pass-throughs, `VotingOpening` entry action + registration.
3. Application: three intent commands + handlers (pipeline pattern of
   `GoToNextValueCommand`), `enabledIntents` rows.
4. Wire: extend `VotingView` / add facilitator voting view /
   `PresenterVotingView` per D7.
5. Persistence: schema (incl. per-round history rows) + repository mapping
   + round-trip and anonymity tests.
6. Docs: `design/state-machine.md` phase-8 entry action note; allotment
   pivot in SPEC.md, `design/domain-model.md` (I13, glossary),
   `design/protocol.md` (T18 guard).

## Verification

`./scripts/ci-lint.sh` + `./scripts/ci-test.sh` green. BE voting suite
covers I13 (spend/eligibility/single ballot), I14 (anonymity assertion
against DB), I15 (tiebreak loop incl. repeated ties). Existing e2e stays
green (walks stop at phase 8 until Task 23).

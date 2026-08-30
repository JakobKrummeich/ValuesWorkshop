# Task 23 — Final voting frontend (phase 8)

All three phase-8 screens plus the participant vote intent, per
`design/screens.md` §8 and the Task 22 backend. Includes a small backend
wire enrichment (below) because the phase-8 blocks today carry only value
ids, while the screens must render value names and actions.

## Objective

Participants distribute the round's allotment across the eligible values
with per-value steppers (multi-vote allowed), submit once at exactly full
allotment (irrevocable), then see a "votes submitted" confirmation; a
tiebreak round reopens the cards over only the tied values. The
facilitator watches the voted count, closes voting, sees the closed
round's tallies and the tie, and starts tiebreak rounds until 5 winners
stand and AdvancePhase unlocks. The wall shows a calm fullscreen
"voting ongoing — secret & anonymous" screen, never tallies.

## Decisions

- **D1 — wire enrichment (backend + protocol.md update).** The participant
  voting block replaces `eligibleValueIds` with
  `eligibleValues: [{ valueId, text: {de, en}, actions: [text] }]`
  (embedding precedent: `ownGroup.assignedValues`; the client never reads
  `config/`). Actions are the value's submitted group-work actions. The
  facilitator block likewise gets `eligibleValues: [{ valueId, text }]`
  (names for tallies/tie display; no actions needed) and keeps
  `closedRoundTallies?`/`tiedValueIds?` keyed by id. Presenter stays
  `isRoundOpen` only.
- **D2 — facilitator voted-count denominator.** The facilitator voting
  block gains `participantCount` (session roster size) so the screen can
  show "voted: 24/30".
- **D3 — participant intent.** `ParticipantIntent.SubmitFinalVotes` +
  `ParticipantVotingPort.submitFinalVotes(votes)` + SignalR adapter,
  mirroring the quiz port pattern. Stepper state is local; the submit
  button enables exactly at full allotment; total > allotment is
  impossible in the UI (steppers cap at remaining votes).
- **D4 — participant screen states.** Round open + not voted → cards;
  voted this round, or round closed → confirmation screen; a new round
  (tiebreak) resets to cards automatically via `hasVotedThisRound: false`
  + `isRoundOpen: true`. No use of the shared WaitingScreen — phase 8
  always shows voting UI or confirmation, per screens.md.
- **D5 — facilitator screen.** "Round N · voted: X/Y" while open with a
  CloseVoting button; after close: last round's tallies (names + counts),
  the tied values callout when a tie persists, and a StartTiebreakRound
  button; all three controls (incl. AdvancePhase) gated by
  `enabledIntents` as everywhere else.
- **D6 — presenter screen.** Static fullscreen message (open round:
  "voting ongoing… cast your votes on your phone — secret & anonymous";
  closed with pending tie the same visual, no tallies ever).
- **D7 — e2e (scale spec continues).** All 30 participants vote in
  batches with a vote distribution crafted to force a 5th-place tie;
  facilitator closes, asserts tallies + tie callout, starts the tiebreak;
  participants see only the tied values with the reduced allotment; second
  close resolves; AdvancePhase lands phase 9 on facilitator + presenter.
- **D8 — i18n.** New `phases/finalVotingMessages.ts` (de+en) + message
  keys, registered in `messages.ts`.

## Slices

1. Backend wire enrichment (D1/D2) + mapper tests + FE zod schemas +
   protocol.md.
2. Participant voting screen (cards, steppers, submit, confirmation) +
   port/adapter + hook/component tests.
3. Facilitator phase-8 screen + port methods (CloseVoting,
   StartTiebreakRound) + tests.
4. Presenter phase-8 screen + tests.
5. Scale e2e through phase 8 with forced tiebreak, ending on phase 9
   entry.

## Verification

`./scripts/ci-lint.sh` + `./scripts/ci-test.sh` green (jest + BE + e2e).
Acceptance from todo.md: cannot submit ≠ allotted votes; tiebreak round
shows only tied values; multi-client e2e through phase 8 incl. forced
tiebreak.

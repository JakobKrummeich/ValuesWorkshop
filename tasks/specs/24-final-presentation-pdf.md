# Task 24 — Phase 9: Final presentation + PDF

Phase 9 end-to-end, per `design/screens.md` §9, `design/state-machine.md`
§2.9 (T22/T23) and `design/protocol.md` §5. Today the backend carries only
a placeholder `ConclusionView(WinningValueIds)` and all three frontends map
phase 9 to `EmptyPhase`; `RevealNextValue` does not exist anywhere. This
task builds the reveal mechanic, the three screens, and the participant
PDF download, and closes with the scale e2e covering all 9 phases.

## Objective

The facilitator reveals the five winners one by one (least-voted first);
the presenter devotes one full screen to each revealed winner (place, vote
count, value name, its actions) and shows a final overview after the last
reveal; participants see the calm waiting screen during the reveal and,
once concluded, a "workshop concluded" screen with a Download-PDF button.
The PDF (client-side, `@react-pdf/renderer`) is the workshop record: the
winners, every worked-out action, and all anonymous round tallies — no
participant names or ids anywhere. Reveal position survives restart.

## Decisions

- **D1 — reveal state, PresentationWalk precedent.** New domain class
  `WinnerReveal` on `Session` (mirrors `PresentationWalk`): persisted
  `RevealedCount`, `RevealNext()` guarded by phase FinalPresentation and
  `RevealedCount < 5`; concluded ⇔ `RevealedCount == 5` (T23 is implicit —
  no event machinery exists or is added). Persistence: new column on
  `SessionEntity` + `DomainEntityMapper` restore. Intent chain mirrors
  `GoToNextValue`: `RevealNextValueCommand` → `FacilitatorIntentHandler` →
  hub method `RevealNextValue` → `FacilitatorIntent.RevealNextValue` in
  `FacilitatorEnabledIntents` while winners remain. Phase 9 stays
  terminal: no `AdvancePhase` in phase 9 (unchanged).
- **D2 — winner ranking.** Places 1–5: closed rounds in chronological
  order, within a round the locked values by that round's tally
  descending, then config order (the `topValueIds` tie-break precedent);
  values locked in later (tiebreak) rounds rank below earlier locks.
  Reveal order is the reverse: place 5 first, then 4, 3, 2, 1. The
  *displayed* `voteCount` is always the value's tally from the **first**
  voting round — tiebreak-round tallies appear only in the PDF's
  per-round breakdown. Exposed as `VotingRounds.RankedWinners`.
- **D3 — wire shapes (replaces the placeholder; protocol.md §5 update).**
  Value texts ride the wire (client never reads `config/`); actions are
  submitted free text, untranslated, `[text]`.
  - participant `conclusion`: `{ isConcluded, record? }` — `record`
    present iff concluded (the participant screen shows *nothing* during
    the reveal; data a screen must not show is data not sent — this
    supersedes the earlier `revealedWinners` sketch in protocol.md):
    `record: { winners: [{ valueId, text, place, voteCount,
    actions: [text] }], values: [{ valueId, text, actions: [text] }]
    (the full presented set, deal order), rounds: [{ roundNumber,
    allotment, tallies: [{ valueId, count }] }] }`.
  - facilitator `conclusion`: `{ revealedCount, winnerCount, isConcluded }`
    — progress only, no winner list: the facilitator does not see the
    winners ahead and follows the reveal on the wall like everyone else
    (review decision; deliberate deviation from the quiz sees-ahead
    precedent).
  - presenter `conclusion`: `{ revealedWinners: [{ valueId, text, place,
    voteCount, actions: [text] }], isConcluded }` — reveal order, current
    screen = last entry; concluded → overview of all five.
- **D4 — screens.** Presenter is the showpiece of this phase: weighty,
  dramatic visuals that build suspense. Before the first reveal a
  fullscreen anticipation screen (phase title, slow dramatic motion). Each
  reveal is one full screen per value, staged for suspense: place number
  lands first, a deliberate pause, then the value name with a flashy
  entrance, then "X votes", then the numbered actions. The actions are the
  visually dominant content — they are the workshop's main outcome, not a
  footnote under the value name. The layout is sized for the worst case:
  five actions of maximal length (200 text elements each, the server
  truncation cap) fit a 1920×1080 beamer without overflow or scroll —
  viewport-relative type scale (`clamp`), verified by a Playwright
  no-overflow assertion. Staging via
  CSS-token-based keyframe animations triggered on state change,
  `prefers-reduced-motion` respected (also keeps e2e stable — Playwright
  waits for the final texts). Concluded → overview of all five,
  most-voted on top. Facilitator: "Revealed: X of 5" + Reveal-next button
  (`enabledIntents`-gated); concluded note once done. Participant:
  `WaitingScreen` while revealing; concluded → thanks + Download button.
- **D5 — PDF.** `@react-pdf/renderer`, rendered on click
  (`pdf(...).toBlob()` → object-URL anchor, filename
  `workshop-record.pdf`). Deterministic page structure — every top-level
  section starts on its own page (react-pdf `break`): title + winners
  (place, name, first-round votes, actions), all worked-out actions
  (every presented value + its actions), vote tallies per round (round,
  allotment, value → count — the detailed breakdown incl. tiebreak
  rounds). Rendered in the participant's active locale (de+en). Built-in
  Helvetica covers umlauts — no font embedding. No participant names/ids
  and no group names (strictly value-keyed — nothing in the PDF can link
  a person to anything).
- **D6 — PDF logic testable.** Pure builder `buildWorkshopRecord(record,
  language)` (wire block → flat strings model) unit-tested in jest; the
  react-pdf Document component stays a thin dumb layer.
- **D7 — e2e (scale spec grows to all 9 phases).** Group work already
  crafts action texts; one winning value gets five maximal-length (200)
  actions to exercise the worst-case layout. After phase-9 entry:
  facilitator reveals 5×, presenter asserted per reveal (place label,
  value name, action text, and — on the worst-case value — all actions
  inside the viewport, no overflow) and participants on the waiting
  screen; after the 5th: presenter overview, participant downloads the
  PDF; test parses it (`pdf-parse` root devDependency) and asserts
  winners, a known tally line, a known action text, and that no
  participant display name appears.
- **D8 — wire contract corpus.** Zod schemas extended to the D3 shapes;
  new fixture scenarios `final-presentation-revealing` and
  `final-presentation-concluded` (record present/absent covers the
  optional field) in `WireStateFixtures` + `WireVariantCoverageTests`
  rows; intent catalog + FE port registration for `RevealNextValue`;
  corpus regenerated via `CONTRACT_WRITE=1`, diff committed.
- **D9 — i18n.** New `phases/finalPresentationMessages.ts` + message keys
  (de+en), registered in `messages.ts`.

## Slices

1. Domain `WinnerReveal` + `RankedWinners` + command/handler/hub/
   enabled-intents + persistence (+ restart restore test).
2. Backend wire blocks (D3) + mappers + protocol.md + contract fixtures
   regenerated (D8 backend half).
3. FE zod schemas + contract tests + `RevealNextValue` port/adapter
   (D8 frontend half).
4. Facilitator + presenter screens (D4) + i18n.
5. Participant screens + PDF builder + Document + download (D5/D6).
6. Scale e2e through PDF assertion (D7).

## Verification

`./scripts/ci-lint.sh` + `./scripts/ci-test.sh` green. Acceptance from
todo.md: PDF downloads in Playwright with winners, tallies, actions; no
participant names/ids in the PDF; multi-client e2e covers all 9 phases.

# Spec 14 — Quiz frontend

## Objective

Workshop phase 2 (Quiz) becomes fully playable end to end: participants
answer on their phones, the presenter wall shows live bar charts animating
as votes arrive, and the facilitator drives each question with one morphing
sub-control button (Reveal → Learning text → Next question). Multi-client
Playwright e2e now covers phases 1–2 and runs in CI.

All quiz content arrives on the wire (Task 13) — the frontend never reads
`config/`.

## Gap found during recon: `enabledIntents` is unimplemented

protocol.md §6.4 (line ~469) mandates that the facilitator state carries
`enabledIntents` and that the morph button and the Advance button render
from that list — no client-side duplication of state-machine guards. Task 9
left it as residue "lands with the phase task that introduces its intents";
Task 13 did not add it. Without it the frontend cannot know that the last
question has no next question (the question count is not on the wire).

Task 14 therefore includes a small backend slice adding it.

## Scope

### 1. Backend — `enabledIntents` + `questionCount` (protocol §6.4)

- Facilitator envelope (next to `revision`/`roster`) gains
  `enabledIntents: string[]` naming the facilitator hub methods that would
  be accepted **and change state** right now — idempotently-accepted no-ops
  (repeat `RevealAnswer`/`ShowLearningText`) are not listed, so exactly one
  quiz sub-control is enabled at a time:
  - Answering → `["RevealAnswer"]`
  - Revealed → `["ShowLearningText"]`
  - LearningTextShown, questions remain → `["PoseNextQuestion"]`
  - LearningTextShown, last question → `["AdvancePhase"]`
  - `AdvancePhase` listed in every phase whose exit guard passes
    (evaluated via the registered `PhaseExitGuards`).
- All three quiz views gain `questionCount` (total questions) so every
  screen can render "Question n of N". No content leak — it is a count.
- protocol.md §5.3 updated with both fields in the same PR.
- FE zod: `enabledIntents` as `z.array(z.string())` narrowed to a
  `FacilitatorIntent` enum; `questionCount` on the quiz view base.

### 2. Participant quiz screen

- New port `ParticipantQuizPort { chooseAnswer(questionIndex, answerIndex):
  Single<IntentResult> }`; adapter invokes hub method `ChooseQuizAnswer`;
  wired through `workshopSessions.ts` → `ParticipantSessionBoundary` →
  `ParticipantDependencies` (first participant intent — mirrors the
  facilitator `lifecycle` chain exactly).
- Screen (`phases/quiz/ParticipantQuizScreen` + hook + module.css):
  "Question n of N", question text, 3 answer buttons.
  - Answer buttons enabled only while `subState = Answering` and
    `ownAnswerIndex = null`; one tap casts, in-flight disables, rejection
    shown via existing `intentRejectionMessage`.
  - Own answer stays visually marked from `ownAnswerIndex`.
  - After reveal: correct answer highlighted; own wrong answer marked.
  - Learning text panel rendered when `learningText` present.
  - No tallies, ever (per protocol).

### 3. Facilitator quiz screen + morph button

- New port `FacilitatorQuizControlPort { revealAnswer(); showLearningText();
  poseNextQuestion(); }` (each `Single<IntentResult>`); adapter invokes the
  three hub methods; wired into `FacilitatorDependencies`.
- Screen: "Question n of N", question, answers with the correct one always
  marked, per-answer tallies + `answeredCount` of `participantCount`,
  learning text always visible (labelled panel).
- One morph sub-control button rendered from `enabledIntents`: shows
  whichever of Reveal / Show learning text / Next question is enabled;
  hidden when none is (last question fully done → Advance takes over).
- Existing `AdvancePhaseButton` becomes `enabledIntents`-driven: disabled
  when `AdvancePhase` absent (protocol §6.4 "disable Advance exactly when
  the state machine would refuse it"). Behavior outside Quiz is unchanged
  (guards pass → listed → enabled).

### 4. Presenter quiz screen — live bar chart

- Screen: big "Question n of N", question text, one horizontal bar per
  answer: answer text, vote count, bar width proportional to
  `answerTallies` (relative to the max tally; zero votes → zero-width bar).
- Bars animate via CSS width transition — votes arriving over the existing
  live state stream move the bars without reload. No chart library.
- After reveal: correct bar highlighted. Learning text shown when present.
- Localized via existing `LanguageSwitcher` mechanism like the join screen.

### 5. e2e — phases 1–2 in CI

- New `e2e/quizPhase.spec.ts` (serial, reusing join-flow helpers): join 3
  participants, advance to Quiz, then per question: participants vote,
  facilitator tallies and presenter bars reflect counts live (no reload),
  voted participant sees own-answer confirmation (Task 19a: no correct-answer
  highlight, no learning text on participant), presenter bars + reveal +
  learning text, next question resets.
  Fast-forward the remaining questions; after the last learning text,
  Advance moves to phase 3 (exit-guard proof: Advance disabled mid-quiz).
- Runs in the existing CI Playwright job (wiring landed with Task 12).

## i18n

New `MessageKey`s (de+en): question heading ("Frage {n} von {total}"),
answered count ("{answered} von {total} haben geantwortet"), votes label,
reveal / show-learning-text / next-question button labels, learning-text
heading, correct-answer marker. Wire content (`{de,en}` pairs) picked by
current language via a small shared helper (`localizedText(language, text)`)
in `domain/i18n`.

## Out of scope

Answer shuffling; participant-visible tallies; presenter `answeredCount`
(not in its view); sounds/confetti; phase 3+ screens.

## Success criteria

- [ ] Bars update without reload as votes arrive (e2e-asserted)
- [ ] Correct answer highlighted after reveal on all three roles
- [ ] Learning text appears via facilitator control, resets on next question
- [ ] Participant can vote exactly once per question; UI locks after voting
- [ ] Morph button shows exactly the one enabled sub-control; Advance
      disabled mid-quiz, enabled after the last learning text
- [ ] `enabledIntents` unit-tested per sub-state incl. last question; FE
      never re-implements guard logic
- [ ] Multi-client e2e covers phases 1–2 and is green in CI

## Verification

`./scripts/ci-lint.sh` · `./scripts/ci-test.sh` (jest + dotnet + Playwright)

## Slices (implementation order)

1. BE `enabledIntents` + `questionCount` + protocol.md + FE zod (TDD, view
   mapper tests red-then-green).
2. Participant: port/adapter/DI + screen (hook tests + component tests).
3. Facilitator: quiz-control port/adapter/DI + screen + morph button +
   `enabledIntents`-driven Advance.
4. Presenter: bar-chart screen + animation.
5. e2e `quizPhase.spec.ts` + CI green.

## Decisions (Lavish review, approved)

1. `enabledIntents` lists only intents that would be accepted **and**
   change state — idempotent no-ops excluded.
2. `questionCount` goes on all three quiz views ("Frage n von N"
   everywhere).
3. Presenter bars scale relative to the current max tally.
4. Advance button becomes `enabledIntents`-driven everywhere (disabled
   exactly when the state machine would refuse).

# Spec 13 — Quiz content + backend logic

## Objective

Workshop phase 2 (Quiz) becomes fully playable on the backend: 5 bilingual
questions served from `config/quiz.json`, participants cast exactly one
unchangeable answer per question (I5), live tallies, and the facilitator
walks each question strictly forward through
`Answering → Revealed → LearningTextShown` (protocol intents T5–T8).
Frontend UI is Task 14; this task ends at the per-role state blocks on the
wire.

## Scope

### 1. Quiz content + loader

- Complete `config/quiz.json` to 5 questions about values in a work context,
  3 answers each (`correct` / `wrong` / `funnyWrong`), learning text, all
  de+en (SPEC.md:64). Content drafted by agent, user reviews text in this spec
  review.
- Schema validation test: every question has exactly 3 answers with exactly
  one `correct` kind, both locales present on every text.
- New Application port `IQuizCatalog` (question count + correct answer index
  per question + content for the wire) with a JSON-file adapter in Host
  reading `config/quiz.json` at startup; fail fast on missing/invalid file.
- Register `QuizExitGuard(catalog.QuestionCount)` in the host
  `PhaseExitGuards` (deferred from Task 11).

### 2. Domain — sub-state mechanics (deferred from Task 11, Q1)

`QuizProgress` gains mutators, called through `Session` (facilitator-only,
`NotAuthorizedException` otherwise):

- Phase entry 1→2 poses the first question: `CurrentQuestionIndex` 0,
  sub-state Answering (state-machine.md §2.2 `[*] --> Answering`). Happens
  inside `AdvancePhase`, no separate intent.
- `RevealAnswer` — only while unrevealed, else `WrongPhaseException`.
- `ShowLearningText` — only once revealed and not yet shown.
- `PoseNextQuestion` — only once learning text shown and questions remain;
  increments cursor, resets reveal/learning flags.
- 0-based cursor end-to-end: `CurrentQuestionIndex`,
  `current_question_index`, wire `questionIndex` — no conversion anywhere
  (persistence.md:117).

### 3. Domain — answers, I5, tallies

- `QuizProgress` tracks cast answers: `(questionIndex, participantId,
  answerIndex)`; `ChooseQuizAnswer(participant, questionIndex, answerIndex)`
  guards: phase Quiz, `questionIndex` equals current question and sub-state
  Answering (`WrongPhaseException`), answer index in 0..2
  (`MalformedPayloadException`, new type), not yet answered
  (`InvariantViolationException`, I5).
- Tallies derived (count per answer index of current question), never stored
  separately.
- Persistence: map answers to existing `quiz_answers` table
  (`QuizAnswerEntity`); round-trip test mutate → new store → identical
  state; migration only if columns must change.

### 4. Application + web

- Command records `RevealAnswerCommand`, `ShowLearningTextCommand`,
  `PoseNextQuestionCommand` (facilitator) and `ChooseQuizAnswerCommand`
  (participant, `{questionIndex, answerIndex}`) following
  `AdvancePhaseCommand` pattern.
- New `ParticipantIntentHandler` (first participant intent); hub methods on
  `FacilitatorHub` / `ParticipantHub`; caller identity from JWT as today.
- `IntentPipeline` maps `MalformedPayloadException` →
  `IntentRejectionCode.MalformedPayload` (first use of the code).
- Every accepted mutation broadcasts fresh per-role states (existing
  write-before-broadcast path).

### 5. Per-role quiz state blocks (protocol.md §5)

Replace the shared placeholder `QuizView` with per-role views carrying quiz
content from the catalog (question + answer texts, both locales) so Task 14
never reads `config/` from the frontend:

- participant: `questionIndex, subState, question, answers, ownAnswerIndex?,
  correctAnswerIndex?` (correct index only once revealed — no pre-reveal leak)
- facilitator: `questionIndex, subState, question, answers, answerTallies,
  answeredCount, correctAnswerIndex` (facilitator may always see it)
- presenter: `questionIndex, subState, question, answers, answerTallies,
  correctAnswerIndex?` (once revealed)

## Deviation from protocol.md (update doc in same PR)

- T5 payload was `{questionId, answerId}` → becomes
  `{questionIndex, answerIndex}` per the locked 0-based-index convention
  (todo.md Task 13 acceptance; persistence.md:117).
- T5 rejection list gains no codes but `MalformedPayload` now has a concrete
  producing path; document it.
- Quiz view blocks §5.2–5.4 get the exact shapes above.

## Out of scope

Frontend quiz UI, bar charts, e2e through phase 2 (Task 14). Values content
(Task 15). Answer shuffling — answers keep config order (funny quiz, no
anti-cheat requirement).

## Success criteria

- [ ] Duplicate vote rejected (`InvariantViolated`), tally correct
- [ ] Reveal / learning text / next question only via facilitator intents;
      non-facilitator → `NotAuthorized`
- [ ] Illegal sub-state order rejected (`WrongPhase`), state unchanged
- [ ] Answer for a non-current question or out-of-range index rejected
- [ ] Phase 1→2 poses question 0; phase 2→3 blocked until last question's
      learning text shown (`QuizExitGuard` registered, red-then-green)
- [ ] Sub-state + answers survive store round-trip and backend restart
- [ ] quiz.json schema test green; startup fails on broken content
- [ ] Participant/presenter states never contain `correctAnswerIndex`
      pre-reveal (asserted by test)

## Verification

`dotnet test backend` (quiz suite + schema test) · `./scripts/ci-lint.sh` ·
`./scripts/ci-test.sh`.

## Slices (implementation order)

1. Content + catalog: quiz.json (5 questions), schema test, `IQuizCatalog`
   port + Host adapter, `QuizExitGuard` registered — guard red-then-green.
2. Domain sub-state mutators + phase-entry pose + persistence round-trip.
3. Domain `ChooseQuizAnswer` + I5 + tallies + `quiz_answers` mapping.
4. Application commands, `ParticipantIntentHandler`, hub methods,
   `MalformedPayload` mapping, broadcast.
5. Per-role quiz state blocks + protocol.md update.

Each slice: TDD, lands green on the feature branch before the next starts.

## Decisions (Lavish review, approved)

1. Quiz content draft approved as-is (5 questions de+en).
2. Facilitator always sees `correctAnswerIndex`, even pre-reveal — confirmed.
3. `MalformedPayloadException` lives in Domain next to the other exception
   types.

# Domain Model — ValuesWorkshop

Living document. Deviations discovered during implementation update this file
in the same PR (Ask-first). Written entirely in the ubiquitous language — no
technology words. Source of truth for terms used in `state-machine.md`,
`screens.md`, and all code identifiers.

A **workshop** is a facilitated, roughly two-hour gathering of up to about
thirty participants who, together, work out company values and — most
importantly — pragmatic everyday **actions** connected to each value. The
workshop moves through **nine phases**, strictly forward, under the sole
control of the **facilitator**.

---

## 1. Ubiquitous Language

Terms the facilitator would use when running the workshop. German first (the
workshop's native language), English term used in model and code.

### Roles & people

| Deutsch | English | Meaning |
|---|---|---|
| Moderator:in | **Facilitator** | Runs the workshop. Opens the session, advances phases, operates all sub-controls (next question, reveal, learning text, presenting group, close voting, tiebreak), may reassign a scribe. Exactly one per session. |
| Teilnehmer:in | **Participant** | Joins a session, answers quiz questions, selects values, works in a group, casts final votes. Up to ~30 per session. |
| Schreiber:in | **Scribe** | The one participant per group who writes: creates, edits, removes actions and submits / reopens the group's work. Appointed at random when group work begins; the facilitator may reassign the role at any time (e.g. dead phone). |
| Präsentationsansicht | **Presenter view** | Not a person: the shared big-screen view of the session (projector). Shows the invitation to join, live charts, group presentations, final results. Purely observing — it never issues commands. |

### Session & flow

| Deutsch | English | Meaning |
|---|---|---|
| Sitzung / Workshop-Sitzung | **Session** | One concrete run of the workshop with its own identity, roster, and results. Several sessions may exist independently; every participant belongs to exactly one. |
| Sitzungskennung | **Session identity** | The name by which a session is found and joined. |
| Moderationskennwort | **Facilitator passphrase** | Shared secret known only to facilitators; opening a session requires it. Participants never hold it. |
| Phase | **Phase** | One of the nine named stages below. Phases advance forward only, and only the facilitator advances them. |
| Workshop-Zustand | **Workshop state** | The session's current phase plus its within-phase state (e.g. current quiz question, presented value, tiebreak round, revealed winners). |
| Teilnehmerliste | **Roster** | Who has joined the session. Membership survives leaving and returning: a returning facilitator or participant resumes their exact place. |
| Lobby | **Lobby** | Where a participant waits after joining, before the workshop proper begins. |
| Wiederverbindung | **Reconnect** | A facilitator or participant coming back after an interruption; they keep their role, membership, group, scribe status, and prior submissions. |

### The nine phases

| # | Deutsch | English |
|---|---|---|
| 1 | Beitritt | **Join** |
| 2 | Quiz | **Quiz** |
| 3 | Werteauswahl | **Value selection** |
| 4 | Auswahlergebnis | **Selection results** |
| 5 | Gruppeneinteilung | **Group formation** |
| 6 | Gruppenarbeit | **Group work** |
| 7 | Wertepräsentation | **Value presentation** |
| 8 | Schlussabstimmung | **Final voting** |
| 9 | Abschlusspräsentation | **Final presentation** |

### Quiz

| Deutsch | English | Meaning |
|---|---|---|
| Quizfrage | **Quiz question** | One of five fixed questions about values in a work context. Posed one at a time, in order. |
| Antwortmöglichkeit | **Answer option** | One of three options per question: the correct one, a wrong one, and a funny-wrong one. |
| Quizantwort | **Quiz answer** | A participant's single, unchangeable pick for the current question. One per participant per question. |
| Antwortstand | **Answer tally** | Live count of picks per answer option, growing as answers arrive. Shows counts only, never who picked what. |
| Auflösung | **Reveal** | The facilitator disclosing which option is correct. |
| Lerntext | **Learning text** | Short educational text per question, shown by the facilitator after the reveal. |

### Values & selection

| Deutsch | English | Meaning |
|---|---|---|
| Wertekatalog | **Values catalog** | The fixed set of ~50 named values offered to every session. Not editable per session. |
| Wert | **Value** | One entry of the catalog (e.g. "Vertrauen"). |
| Werteauswahl | **Value selection** | A participant's set of exactly ten distinct values from the catalog, submitted once and then locked. |
| Auswahlstand | **Selection tally** | Per value, how many participants selected it. Counts only — never which participant selected what is *shown*; who has submitted is known for progress. |
| Top-Werte | **Top values** | The ten most-selected values. A tie at tenth place widens the set: all tied values are included, so more than ten may survive. |

### Groups & group work

| Deutsch | English | Meaning |
|---|---|---|
| Gruppe | **Group** | A named subset of participants working together on a share of the top values. Formed once at the start of group formation and fixed thereafter. |
| Gruppenname | **Group name** | Friendly animal name identifying a group (e.g. "Otter"). |
| Gruppeneinteilung | **Group formation** | The one-time act of partitioning all present participants into groups and dealing the top values out across the groups — every top value to exactly one group. Formation aims to give each participant as many of their own ten selected values as possible; sizing follows the group sizing rule. |
| Gruppengrößenregel | **Group sizing rule** | Number of groups = at least one, otherwise participants divided by four rounded down. Participants and values are dealt round-robin: sizes differ by at most one, earlier groups get the extra ones. |
| Verhaltensweise | **Action** | A work-related, everyday, pragmatic action a group formulates for one of its assigned values. Between one and five per assigned value. |
| Gruppenergebnis | **Group work result** | A group's actions for all its assigned values. |
| Abgabe / Abgabe zurückziehen | **Submit / reopen** | The scribe declaring the group's work finished, or taking it back for further editing. Only submitted work is presented. |

### Presentation & voting

| Deutsch | English | Meaning |
|---|---|---|
| Präsentierende Gruppe | **Presenting group** | The group whose submitted result is currently being walked through. |
| Präsentierter Wert | **Presented value** | The single value (with its actions) currently shown. The facilitator steps value by value through the presenting group's assigned values; when they are exhausted, presentation moves to the next group's first value. |
| Finale Stimmen | **Final votes** | Each participant's five votes, freely distributed across all presented values — several votes may go to one value, up to all five. Cast secretly and stored without any connection to the voter; only *that* someone has voted is remembered. |
| Stimmenstand | **Vote tally** | Anonymous count of final votes per value. |
| Siegerwerte | **Winning values** | The five values with the most final votes, together with their actions. |
| Stichwahl | **Tiebreak round** | Held when a tie at fifth place prevents exactly five winners: a further vote among the tied values only, each participant receiving as many votes as there are tied values (multi-votes allowed). Repeated until exactly five values survive. Started by the facilitator. |
| Workshop-Protokoll | **Workshop record** | The take-home document each participant may obtain at the end: all anonymous tallies, all worked-out actions, and the winning values. Contains no participant names. |

### Explicitly excluded from the domain

These SPEC nouns are deliberately **not** domain terms — they belong to
technology or presentation and appear only in the just-in-time technical
documents (`architecture.md`, `persistence.md`, `protocol.md`,
`cpsat-model.md`) or in `screens.md`:

| SPEC noun | Where it lives instead |
|---|---|
| QR code, join URL | Presentation detail of the Join phase — `screens.md`. The domain only knows "a participant joins a session". |
| Login / authentication / identity provider | How a person proves who they are — technical concern. The domain only knows facilitator vs. participant. |
| Server, client, real-time, broadcast, connection mechanics | Delivery concerns — `protocol.md`. The domain term is **Reconnect** (see above). |
| Restart / recovery / persistence / stored on disk | Durability concern — `persistence.md`. Domain expectation is only: a session never forgets anything that happened. |
| Solver, optimization, time-box, incumbent | How group formation is computed — `cpsat-model.md`. The domain term is **Group formation** with its sizing rule and its aim. |
| PDF, download, rendering | File-format concern — `screens.md` / implementing task. The domain term is **Workshop record**. |
| Screens, charts, bars, animations | Presentation — `screens.md`. Domain knows tallies; how they are drawn is not domain. |
| Config / JSON / catalog file | Storage form of the **Values catalog** and quiz content. |

---

## 2. Domain Events

Facts that have happened in a session, named in past tense, event-storming
style. Ordered by the phase in which they typically occur. Every event
belongs to the session it happened in.

### Session lifecycle (spans all phases)

| Event | Meaning |
|---|---|
| **SessionOpened** | A facilitator opened a new session using the facilitator passphrase. |
| **PhaseAdvanced** | The facilitator moved the session forward to the next phase. Never backward. |
| **ParticipantRejoined** | A facilitator or participant came back after an interruption and resumed their exact place (any phase). |

### Phase 1 — Join

| Event | Meaning |
|---|---|
| **ParticipantJoined** | A person entered the session's roster and now waits in the lobby. |

### Phase 2 — Quiz

| Event | Meaning |
|---|---|
| **QuestionPosed** | The next quiz question became the current one (first question: on entering the phase). |
| **QuizAnswerChosen** | A participant picked one answer option for the current question — their only pick for it. The answer tally grew. |
| **AnswerRevealed** | The correct option of the current question was disclosed. |
| **LearningTextShown** | The current question's learning text was made visible. |

### Phase 3 — Value selection

| Event | Meaning |
|---|---|
| **ValuesSelected** | A participant submitted their selection of exactly ten distinct values; it is now locked. The selection tally grew. |

### Phase 4 — Selection results

| Event | Meaning |
|---|---|
| **TopValuesDetermined** | The top values were fixed from the selection tally — ten, or more if tied at tenth place. |

### Phase 5 — Group formation

| Event | Meaning |
|---|---|
| **GroupsFormed** | All present participants were partitioned into animal-named groups per the sizing rule, and the top values were dealt out across them — each top value to exactly one group. Fixed from now on. |

### Phase 6 — Group work

| Event | Meaning |
|---|---|
| **ScribeAppointed** | One member of a group was made its scribe — at random when group work began. |
| **ScribeReassigned** | The facilitator handed a group's scribe role to a different member; the previous scribe lost it at once. |
| **ActionAdded** | The scribe added an action under one of the group's assigned values (within the 1–5 bound). |
| **ActionEdited** | The scribe changed the wording of an existing action. |
| **ActionRemoved** | The scribe removed an action (respecting the 1-per-value minimum once work is submitted). |
| **GroupWorkSubmitted** | The scribe declared the group's result finished; editing stopped. |
| **GroupWorkReopened** | The scribe took the submission back; editing resumed. |

### Phase 7 — Value presentation

| Event | Meaning |
|---|---|
| **NextValueShown** | The facilitator stepped presentation to the next value: the next of the presenting group's assigned values, or — once exhausted — the first value of the next group. Only submitted results are shown. |

### Phase 8 — Final voting

| Event | Meaning |
|---|---|
| **FinalVotesSubmitted** | A participant spent their full vote allotment (five in the main round; the number of tied values in a tiebreak) across the eligible values. The anonymous vote tally grew; only the fact *that* they voted was remembered. Irrevocable: because no one knows whose votes they are, votes cannot be taken back. |
| **VotingClosed** | The facilitator ended the current voting round; the tally is final for this round. |
| **TiebreakStarted** | A tie at fifth place being unresolved, the facilitator started a further round among the tied values only. |
| **WinnersDetermined** | Exactly five values emerged with the most votes; they are the winning values. |

### Phase 9 — Final presentation

| Event | Meaning |
|---|---|
| **NextWinnerRevealed** | The facilitator revealed the next winning value with its actions — in ascending vote order: least-voted winner first, most-voted winner last. |
| **WorkshopConcluded** | The session reached its final phase; winning values and their actions stand, and the workshop record became available to every participant. |

---

## 3. Commands

Requests to change a session, named in imperative, each with the one actor
allowed to issue it. **System** marks commands the session performs itself
when a phase begins or a condition is met — no person issues them.

| Command | Actor | Effect / resulting event(s) |
|---|---|---|
| **OpenSession** | Facilitator | Requires the facilitator passphrase. → SessionOpened |
| **AdvancePhase** | Facilitator | Move to the next of the nine phases; allowed forward only. → PhaseAdvanced (entering some phases triggers System commands below) |
| **JoinSession** | Participant | Enter the roster of a named session. → ParticipantJoined |
| **PoseNextQuestion** | Facilitator | Make the next quiz question current. → QuestionPosed |
| **ChooseQuizAnswer** | Participant | Pick one answer option for the current question; second picks are refused. → QuizAnswerChosen |
| **RevealAnswer** | Facilitator | Disclose the correct option. → AnswerRevealed |
| **ShowLearningText** | Facilitator | Show the current question's learning text. → LearningTextShown |
| **SubmitValueSelection** | Participant | Hand in exactly ten distinct values; fewer, more, or duplicates are refused; resubmission is refused. → ValuesSelected |
| **DetermineTopValues** | System (entering Selection results) | Fix the top values from the selection tally, widening on a tenth-place tie. → TopValuesDetermined |
| **FormGroups** | System (entering Group formation) | Partition participants and deal out top values per the sizing rule and the formation aim. → GroupsFormed |
| **AppointScribes** | System (entering Group work) | Pick one member per group at random. → ScribeAppointed (per group) |
| **ReassignScribe** | Facilitator | Hand a group's scribe role to another of its members. → ScribeReassigned |
| **AddAction** | Scribe | Add an action under an assigned value of the own group; refused beyond five per value, refused while submitted, refused for non-scribes. → ActionAdded |
| **EditAction** | Scribe; Facilitator during Value presentation | Change an action's wording; same refusals as AddAction. During Value presentation the facilitator may correct a presented action's wording (e.g. typos) — wording only, never adding or removing actions. → ActionEdited |
| **RemoveAction** | Scribe | Remove an action; same refusals as AddAction. → ActionRemoved |
| **SubmitGroupWork** | Scribe | Declare the group result finished; requires 1–5 actions for every assigned value. → GroupWorkSubmitted |
| **ReopenGroupWork** | Scribe | Take the submission back. → GroupWorkReopened |
| **GoToNextValue** | Facilitator | Step presentation to the next value, iterating through each group's submitted values, group by group. → NextValueShown |
| **SubmitFinalVotes** | Participant | Spend the full allotment across eligible values, multi-votes allowed; wrong totals, votes outside the eligible values, or a second submission in the same round are refused. No un-voting afterwards. → FinalVotesSubmitted |
| **CloseVoting** | Facilitator | End the current voting round. → VotingClosed, then either WinnersDetermined (no fifth-place tie) or a pending tie |
| **StartTiebreakRound** | Facilitator | Begin a further round among the tied values only. → TiebreakStarted |
| **RevealNextValue** | Facilitator | Reveal the next winning value in final presentation, ascending vote order (least-voted first). → NextWinnerRevealed |

---

## 4. Aggregates

Consistency boundaries: every command is handled by exactly one aggregate,
which enforces its invariants atomically. Nothing outside an aggregate may
change its inner state.

### Session (root)

The workshop run itself: one consistency boundary, because its invariants
need roster, phase, and tallies in a single atomic view.

The boundary being one aggregate does **not** make the Session one big
object. Inside the boundary the Session is composed of small internal
building blocks — pure domain objects (nothing to do with storage), each
owning exactly one slice of state and its invariants:

| Building block | Owns | Enforces |
|---|---|---|
| **Roster** | participants + facilitator, membership, reconnect/resume | I4 |
| **Workshop state** | current phase + within-phase state | I1, I2 |
| **Quiz progress** | current question, reveal/learning-text shown, answer tallies, who-answered-which-question | I5 |
| **Selection round** | value selections, who-has-submitted, top values | I6, I7 |
| **Formation record** | the one-time group/value partition | I8 |
| **Presentation walk** | presenting group + presented value position | I12 |
| **Voting rounds** | allotment, who-has-voted flags, anonymous tallies, tie state, winning values, reveal position | I13, I14, I15 |

The Session **root** itself does only two things: guard the boundary
(check phase + actor — I2, I3) and route each command to exactly one
building block. I16 spans the whole boundary.

> **Implementation guardrail (for implementer agents):** a Session class
> that implements the rules of these building blocks itself is a god class
> and violates this model. The root guards and routes; every rule lives in
> its building block. The complexity gate (threshold 10) and review are
> expected to catch violations.

**Handles:** OpenSession, AdvancePhase, JoinSession, PoseNextQuestion,
ChooseQuizAnswer, RevealAnswer, ShowLearningText, SubmitValueSelection,
DetermineTopValues, FormGroups, AppointScribes, GoToNextValue,
SubmitFinalVotes, CloseVoting, StartTiebreakRound, RevealNextValue.

### Group

One group within a session, created by GroupsFormed and fixed in membership
and assigned values from then on. Owns its own working state so that groups
work independently — one group's edits never contend with another's.

**Owns:** group name (animal) · members · assigned values · scribe ·
actions per assigned value · submitted state.

**Handles:** ReassignScribe, AddAction, EditAction, RemoveAction,
SubmitGroupWork, ReopenGroupWork.

### Read models (not aggregates)

Derived, purely-for-viewing projections; they enforce nothing and are
recomputable from events at any time:

- **Answer tally** — counts per answer option per quiz question.
- **Selection tally** — counts per value; submission progress count.
- **Vote tally** — anonymous counts per value per voting round. By
  construction it contains counts only; no voter is ever part of it.
- **Presentation view** — currently presented value with its actions;
  revealed winners so far.

## 5. Invariants

Each invariant is enforced by exactly one aggregate — the only place that
can refuse a command violating it.

| # | Invariant | Enforced by |
|---|---|---|
| I1 | Phases move forward only, in the fixed order 1→9; no skipping, no going back. | Session |
| I2 | Only the facilitator advances phases and operates sub-controls (question, reveal, learning text, presenting group, close voting, tiebreak). | Session |
| I3 | Opening a session requires the facilitator passphrase. | Session |
| I4 | A participant belongs to the roster before acting; a returning person resumes their existing place, never a second one. | Session |
| I5 | One quiz answer per participant per question; unchangeable once cast. | Session |
| I6 | A value selection has exactly ten distinct catalog values and is submitted at most once. | Session |
| I7 | Top values = the ten most-selected, widened to include all values tied at tenth place. | Session |
| I8 | Groups are formed exactly once, per the sizing rule; each top value is assigned to exactly one group; membership and assignment never change afterwards. | Session |
| I9 | A group has exactly one scribe at any time, and the scribe is a member of that group. | Group |
| I10 | During Group work, only the scribe creates, edits, removes actions and submits or reopens; a reassigned-away scribe is refused immediately. During Value presentation, only the facilitator may correct an action's wording (typo fixes); nothing may be added or removed. | Group |
| I11 | Every assigned value carries between one and five actions when group work is submitted; no edits while submitted. | Group |
| I12 | Only submitted group results are presented. | Session |
| I13 | A final-votes submission spends exactly the round's allotment (five in the main round; the number of tied values in a tiebreak), only on the round's eligible values; one submission per participant per round. | Session |
| I14 | Final votes are anonymous and secret: the session remembers *that* a participant voted, never *what* — no connection between voter and votes exists anywhere in the model. As a consequence, votes can never be taken back. | Session |
| I15 | Exactly five winning values; while a fifth-place tie persists, tiebreak rounds over the tied values repeat until it is resolved. | Session |
| I16 | A session never forgets: every fact above survives any interruption, and a return resumes the exact prior state. | Session |

## 6. SPEC.md noun coverage

Every noun of SPEC.md's domain sections maps to a glossary term or is
explicitly excluded (section 1, last table):

| SPEC noun | Term |
|---|---|
| workshop, session, sessionId | Session, Session identity |
| facilitator, facilitator password | Facilitator, Facilitator passphrase |
| participant, lobby, reconnect/membership | Participant, Lobby, Reconnect, Roster |
| projector / presenter screen | Presenter view |
| phase (9, forward-only) | Phase, Workshop state |
| quiz, question, answers (correct/wrong/funny-wrong), learning text | Quiz question, Answer option, Quiz answer, Learning text |
| live bar charts / tallies | Answer/Selection/Vote tally (drawing → excluded) |
| values catalog, value | Values catalog, Value |
| selection of exactly 10 | Value selection |
| top-10, tie at 10th place | Top values |
| groups, group sizes, animal names | Group, Group sizing rule, Group name |
| solver / assignment | Group formation (computation → excluded) |
| scribe, reassignment | Scribe, ReassignScribe |
| actions (1–5 per value), submit/un-submit | Action, Group work result, Submit / reopen |
| presentation, switching groups | Presenting group, Presented value, GoToNextValue |
| 5 votes, multi-votes, secret/anonymous | Final votes, Vote tally |
| tie at 5th place, tiebreaker round | Tiebreak round |
| winners | Winning values, RevealNextValue |
| PDF / download | Workshop record (format → excluded) |
| QR code, OIDC, SQLite, SignalR, restart, docker, CI … | Excluded (see section 1) |

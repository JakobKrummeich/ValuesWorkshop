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
| Schriftführer:in | **Scribe** | The one participant per group who writes: creates, edits, removes actions and submits / reopens the group's work. Appointed at random when group work begins; the facilitator may reassign the role at any time (e.g. dead phone). |
| Präsentationsansicht | **Presenter view** | Not a person: the shared big-screen view of the session (projector). Shows the invitation to join, live charts, group presentations, final results. Purely observing — it never issues commands. |

### Session & flow

| Deutsch | English | Meaning |
|---|---|---|
| Sitzung / Workshop-Sitzung | **Session** | One concrete run of the workshop with its own identity, roster, and results. Several sessions may exist independently; every participant belongs to exactly one. |
| Sitzungskennung | **Session identity** | The name by which a session is found and joined. |
| Moderationskennwort | **Facilitator passphrase** | Shared secret known only to facilitators; opening a session requires it. Participants never hold it. |
| Phase | **Phase** | One of the nine named stages below. Phases advance forward only, and only the facilitator advances them. |
| Phasenfortschritt | **Phase progression** | The session's current phase plus its within-phase state (e.g. current quiz question, presenting group, tiebreak round). |
| Teilnehmerliste | **Roster** | Who has joined the session. Membership survives leaving and returning: a returning facilitator or participant resumes their exact place. |
| Lobby | **Lobby** | Where a participant waits after joining, before the workshop proper begins. |
| Wiedereintritt | **Return** | A facilitator or participant coming back after an interruption; they keep their role, membership, group, scribe status, and prior submissions. |

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
| Maßnahme | **Action** | A work-related, everyday, pragmatic action a group formulates for one of its assigned values. Between one and five per assigned value. |
| Gruppenergebnis | **Group work result** | A group's actions for all its assigned values. |
| Abgabe / Abgabe zurückziehen | **Submit / reopen** | The scribe declaring the group's work finished, or taking it back for further editing. Only submitted work is presented. |

### Presentation & voting

| Deutsch | English | Meaning |
|---|---|---|
| Präsentierende Gruppe | **Presenting group** | The one group whose submitted values and actions are currently shown; the facilitator switches between groups. |
| Schlussstimmen | **Final votes** | Each participant's five votes, freely distributed across all presented values — several votes may go to one value, up to all five. Cast secretly and stored without any connection to the voter; only *that* someone has voted is remembered. |
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
| Server, client, real-time, broadcast, reconnect mechanics | Delivery concerns — `protocol.md`. The domain term is **Return** (see above). |
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
| **ParticipantReturned** | A facilitator or participant came back after an interruption and resumed their exact place (any phase). |

### Phase 1 — Join

| Event | Meaning |
|---|---|
| **ParticipantJoined** | A person entered the session's roster and now waits in the lobby. |

### Phase 2 — Quiz

| Event | Meaning |
|---|---|
| **QuestionPosed** | The next quiz question became the current one (first question: on entering the phase). |
| **QuizAnswerCast** | A participant picked one answer option for the current question — their only pick for it. The answer tally grew. |
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
| **PresentingGroupChanged** | The facilitator put a (different) group's submitted result on presentation. |

### Phase 8 — Final voting

| Event | Meaning |
|---|---|
| **FinalVotesCast** | A participant spent their full vote allotment (five in the main round; the number of tied values in a tiebreak) across the eligible values. The anonymous vote tally grew; only the fact *that* they voted was remembered. |
| **VotingClosed** | The facilitator ended the current voting round; the tally is final for this round. |
| **TiebreakStarted** | A tie at fifth place being unresolved, the facilitator started a further round among the tied values only. |
| **WinnersDetermined** | Exactly five values emerged with the most votes; they are the winning values. |

### Phase 9 — Final presentation

| Event | Meaning |
|---|---|
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
| **CastQuizAnswer** | Participant | Pick one answer option for the current question; second picks are refused. → QuizAnswerCast |
| **RevealAnswer** | Facilitator | Disclose the correct option. → AnswerRevealed |
| **ShowLearningText** | Facilitator | Show the current question's learning text. → LearningTextShown |
| **SubmitValueSelection** | Participant | Hand in exactly ten distinct values; fewer, more, or duplicates are refused; resubmission is refused. → ValuesSelected |
| **DetermineTopValues** | System (entering Selection results) | Fix the top values from the selection tally, widening on a tenth-place tie. → TopValuesDetermined |
| **FormGroups** | System (entering Group formation) | Partition participants and deal out top values per the sizing rule and the formation aim. → GroupsFormed |
| **AppointScribes** | System (entering Group work) | Pick one member per group at random. → ScribeAppointed (per group) |
| **ReassignScribe** | Facilitator | Hand a group's scribe role to another of its members. → ScribeReassigned |
| **AddAction** | Scribe | Add an action under an assigned value of the own group; refused beyond five per value, refused while submitted, refused for non-scribes. → ActionAdded |
| **EditAction** | Scribe | Change an action's wording; same refusals as AddAction. → ActionEdited |
| **RemoveAction** | Scribe | Remove an action; same refusals as AddAction. → ActionRemoved |
| **SubmitGroupWork** | Scribe | Declare the group result finished; requires 1–5 actions for every assigned value. → GroupWorkSubmitted |
| **ReopenGroupWork** | Scribe | Take the submission back. → GroupWorkReopened |
| **ChangePresentingGroup** | Facilitator | Put another group's submitted result on presentation. → PresentingGroupChanged |
| **CastFinalVotes** | Participant | Spend the full allotment across eligible values, multi-votes allowed; wrong totals, votes outside the eligible values, or a second cast in the same round are refused. → FinalVotesCast |
| **CloseVoting** | Facilitator | End the current voting round. → VotingClosed, then either WinnersDetermined (no fifth-place tie) or a pending tie |
| **StartTiebreakRound** | Facilitator | Begin a further round among the tied values only. → TiebreakStarted |

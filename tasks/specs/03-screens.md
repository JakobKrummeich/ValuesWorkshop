# Mini-Spec: Task 0.3 — Screen Flows

**Objective:** `design/screens.md` — what each of the three screens
(Facilitator, Presenter view, Participant) shows and allows in each of the
nine phases, plus low-fi wireframes. Ubiquitous language from
`design/domain-model.md`; per-phase behavior from `design/state-machine.md`
(T1–T23).

**Content:**
- **3×9 matrix** — 27 cells: per screen per phase, *sees* / *can do*
  (commands issued). Presenter column always "sees only" (never issues
  commands). Cells with nothing new marked intentionally empty.
- **Command traceability table** — every command from 0.1 (all 22) → the
  screen + wireframe element that issues it (System commands marked as such,
  no element).
- **Low-fi wireframes** (ASCII, portrait-mobile-first for participant):
  join QR (presenter) + lobby (participant) + session open / roster
  (facilitator) · quiz answer buttons + live answer-tally bars + facilitator
  sub-controls · value selection grid (10-of-~50 picker) · selection results
  chart · group formation display (own group + assigned values) · group work:
  scribe editor / member read-only view / facilitator overview with scribe
  reassignment · value presentation walk · final-vote allocation (spend 5,
  multi-votes) + tiebreak variant · final reveal + workshop record download.
- **Cross-cutting notes:** reconnect/resume view per role · facilitator
  control bar (AdvancePhase + phase sub-controls, high density, laptop) ·
  presenter fullscreen, zero interactivity, unauthenticated · participant
  portrait-first but usable on landscape laptop · i18n: every visible string
  de+en, i18n-relevant states flagged (learning texts, values, labels).

**Success criteria:** all 27 cells filled or intentionally empty · every 0.1
command reachable from a wireframe element (traceability table complete) ·
consistent with SPEC.md screens table and every T1–T23 transition · only
ubiquitous-language terms, no technical vocabulary.

**Slices:** 1) 3×9 matrix + command traceability table · 2) wireframes
phases 1–4 · 3) wireframes phases 5–9 + cross-cutting notes + consistency
walk against SPEC.md and 0.2.

**Boundaries:** doc-only, no code · low-fi only — no colors/typography/
spacing (design tokens come in Task 2) · deviations from 0.1/0.2 discovered
here → update those docs in same PR (Ask-first).

**Decisions (Lavish review, rev 2, user-approved):** no participant join
form — QR scan → sign-in → lobby, JoinSession implicit · presenter QR shows
live joined names · quiz: presenter answer cards 2+1 centered with
normalized bars, learning text on centered card; facilitator one morphing
sub-control button (Reveal → Learning text → Next question) · top values:
two columns of 10 ordered by selections, top 10 (or more on tie)
highlighted · own-group card: members top-left / values bottom-right,
distinct colors · presenter group cards 3×2 paginated, 7 s cycle, reused in
phase 6 with working/submitted indicator · group work: value tabs for
scribe + member, member synced 0.5 s · phase 7: no position counter on
presenter; facilitator may edit actions (typo fixes — EditAction actor
extension, domain docs updated in this PR); Advance disabled until all
values presented · phase 8: participant vote cards show value + actions;
presenter shows "Voting ongoing…", no tallies · phase 9: one full presenter
screen per winning value with actions, least → most voted; participant sees
"being presented" notice during reveal, then explicit Download-PDF button
(workshop record) after conclusion.

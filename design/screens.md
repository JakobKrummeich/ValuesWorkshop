# Screen Flows — ValuesWorkshop

Living document. What each of the three screens shows and allows in each of
the nine phases. Ubiquitous language from `design/domain-model.md`; per-phase
behavior from `design/state-machine.md` (T1–T23, T17a). Low-fi only — colors,
typography, and spacing arrive with the design tokens (Task 2). Deviations
discovered during implementation update this file in the same PR (Ask-first).

The three screens (SPEC.md):

| Screen | Traits |
|---|---|
| **Facilitator** | Laptop. High information density, full session control: phase advancement, all sub-controls, scribe reassignment, session opening (passphrase-gated). |
| **Presenter view** | Beamer, fullscreen, zero interactivity, no sign-in. Shows the invitation to join, live tallies, group presentations, final results. Never issues commands. |
| **Participant** | Portrait mobile-first, easy interactivity; must also render well on landscape laptop screens. |

---

## 1. 3×9 matrix — who sees / can do what, per phase

*Sees* in prose; commands **can do** in bold. System commands noted where
they fire. "Mirror" = passive copy of the presenter content, phone-sized.

| Phase | Facilitator | Presenter view | Participant |
|---|---|---|---|
| **0 · before** | Session open form (session name + facilitator passphrase). **OpenSession** | — intentionally empty — | QR scan → sign-in (skipped if already signed in) → lobby. **JoinSession** fires implicitly on arrival; no form, no button. |
| **1 Join** | Live roster (names, count). **AdvancePhase** | Large QR invitation + live names of joined participants | Lobby: "you're in", waiting notice, participant count |
| **2 Quiz** | Current question with answer tally and answered-count; one morphing sub-control button. **RevealAnswer**, **ShowLearningText**, **PoseNextQuestion**, **AdvancePhase** (disabled until the fifth question's learning text was shown) | Question + three answer cards (two top, one centered below), live bars under each card normalized to total answers; correct card highlighted after reveal; learning text on a centered card | Three answer buttons. **ChooseQuizAnswer**; locked ("answer received") after picking |
| **3 Value selection** | Submission progress count. **AdvancePhase** | Prompt + submission progress | Values grid (~50), pick exactly ten. **SubmitValueSelection** (enabled at 10/10); locked after |
| **4 Selection results** | Top-values view (same as presenter). **AdvancePhase** · System: DetermineTopValues on entry | Two columns of ten values, ordered by selections (left column top→bottom, then right); top ten — or more on a tenth-place tie — color-highlighted | Top values (mirror, passive) |
| **5 Group formation** | All groups: names, members, assigned values. **AdvancePhase** · System: FormGroups on entry | Paginated 3×2 group cards (name, members, values), cycles every 7 s | Own group card: members grouped top-left, values grouped bottom-right, distinct colors |
| **6 Group work** | Per-group table: scribe, action count, editing/submitted status. **ReassignScribe**, **AdvancePhase** (disabled until every group submitted) · System: AppointScribes on entry | Same paginated 3×2 cards + working/submitted indicator per group | **Scribe:** value tabs + actions editor. **AddAction**, **EditAction**, **RemoveAction**, **SubmitGroupWork**, **ReopenGroupWork** · **Member:** same value tabs, read-only, synced with the scribe's state every 0.5 s |
| **7 Value presentation** | Presenting position (group, value) + presented actions with edit affordance. **GoToNextValue**, **EditAction** (wording/typo fixes only, T17a), **AdvancePhase** (disabled until all values presented) | Presented value + its actions; no position counter | Presented value (mirror, passive) |
| **8 Final voting** | Round + voted-count progress; tie indicator after close. **CloseVoting**, **StartTiebreakRound**, **AdvancePhase** (winners must stand) | "Voting ongoing…" screen — no tallies shown | One card per presented value (value + its actions + vote stepper), allotment counter. **SubmitFinalVotes** (enabled at full allotment; irrevocable). Tiebreak round: tied values only, allotment = number of tied values |
| **9 Final presentation** | Reveal position. **RevealNextValue** | One full screen per winning value *with* its actions, least → most voted; final overview after the last reveal | During reveal: "the final values are being presented" notice, nothing else. After conclusion: prominent Download-PDF button (workshop record) |

All 27 phase cells filled; the single intentionally-empty cell is
presenter × phase 0 (no session exists to show yet).

---

## 2. Command traceability — every 0.1 command to its screen element

| Command | Actor | Screen · element |
|---|---|---|
| OpenSession | Facilitator | Facilitator · session open form, "Open session" button |
| AdvancePhase | Facilitator | Facilitator · control bar "Advance" button (every phase; per-phase disable guards) |
| JoinSession | Participant | Participant · implicit on QR-scan arrival (no element) |
| PoseNextQuestion | Facilitator | Facilitator · quiz morphing button, "Next question" state |
| ChooseQuizAnswer | Participant | Participant · quiz answer button A/B/C |
| RevealAnswer | Facilitator | Facilitator · quiz morphing button, "Reveal answer" state |
| ShowLearningText | Facilitator | Facilitator · quiz morphing button, "Show learning text" state |
| SubmitValueSelection | Participant | Participant · selection grid, "Submit selection" button |
| DetermineTopValues | System | — fires on entering Selection results |
| FormGroups | System | — fires on entering Group formation |
| AppointScribes | System | — fires on entering Group work |
| ReassignScribe | Facilitator | Facilitator · group-work table, scribe dropdown per group |
| AddAction | Scribe | Participant (scribe) · "+ add action" under active value tab |
| EditAction | Scribe / Facilitator (phase 7) | Participant (scribe) · ✎ per action · Facilitator · ✎ per presented action (typo fixes) |
| RemoveAction | Scribe | Participant (scribe) · ✕ per action |
| SubmitGroupWork | Scribe | Participant (scribe) · "Submit group work" button |
| ReopenGroupWork | Scribe | Participant (scribe) · "Reopen" button (submitted state) |
| GoToNextValue | Facilitator | Facilitator · presentation "Next value" button |
| SubmitFinalVotes | Participant | Participant · voting cards + "Submit votes" button |
| CloseVoting | Facilitator | Facilitator · voting "Close voting" button |
| StartTiebreakRound | Facilitator | Facilitator · voting "Start tiebreak" button (tie shown) |
| RevealNextValue | Facilitator | Facilitator · "Reveal next value" button |

All 22 commands covered: 18 via visible elements, 3 System (no element),
1 implicit (JoinSession).

---

## 3. Wireframes

Low-fi ASCII. Participant frames are portrait-mobile; the same content
reflows to a centered single column on landscape laptop screens.

### Before phase 1 — opening & joining

**Facilitator · Open a session (laptop)**

```
┌─────────────────────────────────────────┐
│ ValuesWorkshop · Open a session         │
├─────────────────────────────────────────┤
│ Session name          [ Herbst 2024   ] │
│ Facilitator passphrase[ ●●●●●●●●      ] │
│                                         │
│              [ Open session ]           │  → OpenSession
└─────────────────────────────────────────┘
```

**Participant · Join flow (no screen of its own)**

```
 scan QR ──▶ sign-in (skipped if already signed in) ──▶ Lobby

 JoinSession fires implicitly on arrival — no form, no button
```

### Phase 1 — Join

**Presenter · Join QR + live names (fullscreen)**

```
┌────────────────────────────────┐
│        Workshop title          │
│                                │
│   ┌──────────┐   Join the      │
│   │ ▓▓ QR ▓▓ │   workshop      │
│   │ ▓▓▓▓▓▓▓▓ │   with your     │
│   │ ▓▓ QR ▓▓ │   phone         │
│   └──────────┘                 │
│                                │
│ 12 joined:                     │
│ Anna · Ben · Cem · Dana · Edi  │
│ Fia · Gus · … (updates live)   │
└────────────────────────────────┘
```

**Facilitator · Roster (laptop)**

```
┌─────────────────────────────────────────┐
│ Phase 1 · Join            [ Advance ▸ ] │  → AdvancePhase
├─────────────────────────────────────────┤
│ 12 joined                               │
│ Anna · Ben · Cem · Dana · Edi · Fia     │
│ Gus · Hana · Ida · Jon · Kim · Lea      │
│ (list grows live)                       │
└─────────────────────────────────────────┘
```

**Participant · Lobby (portrait)**

```
┌──────────────────────┐
│ Herbst 2024          │
├──────────────────────┤
│   ✓ You're in!       │
│                      │
│  Waiting for the     │
│  facilitator to      │
│  start the workshop… │
│                      │
│  12 participants     │
└──────────────────────┘
```

### Phase 2 — Quiz

**Participant · Answer buttons (portrait)**

```
┌──────────────────────┐
│ Quiz  ·  Question 2/5│
├──────────────────────┤
│ Which statement about│
│ values at work is…?  │
│                      │
│ ┌──────────────────┐ │
│ │ A  Answer text   │ │  → ChooseQuizAnswer
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ B  Answer text   │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ C  Answer text   │ │
│ └──────────────────┘ │
│                      │
│ (after pick: locked, │
│  "answer received")  │
└──────────────────────┘
```

**Presenter · Answer cards + normalized bars (fullscreen)**

```
┌───────────────────────────────────────┐
│ Question 2/5                          │
│ Which statement about values…?        │
│                                       │
│ ┌───────────────┐  ┌───────────────┐  │
│ │ A Answer text │  │ B Answer text │  │
│ │ ▓▓▓▓▓▓▓ 9     │  │ ▓▓▓ 4         │  │
│ └───────────────┘  └───────────────┘  │
│        ┌───────────────┐              │
│        │ C Answer text │              │
│        │ ▓▓▓▓▓ 6       │              │
│        └───────────────┘              │
│                                       │
│ bars live · lengths normalized to     │
│ total answers, labels absolute counts │
│ reveal: correct card highlighted ✓    │
│ learning text: centered card          │
└───────────────────────────────────────┘
```

**Facilitator · Quiz, one morphing button (laptop)**

```
┌─────────────────────────────────────────┐
│ Phase 2 · Quiz · Q2/5     [ Advance ▸ ] │  → AdvancePhase — disabled until
├─────────────────────────────────────────┤    Q5 learning text shown
│ Which statement about values…?          │
│ A 9 (✓ correct) · B 4 · C 6             │
│ answered: 19/30                         │
├─────────────────────────────────────────┤
│ [ ········ one button ········ ]        │
│  label morphs with quiz state:          │
│  question shown  → "Reveal answer"      │  → RevealAnswer
│  answer revealed → "Show learning text" │  → ShowLearningText
│  learning shown  → "Next question ▸"    │  → PoseNextQuestion
└─────────────────────────────────────────┘
```

### Phase 3 — Value selection · Phase 4 — Selection results

**Participant · Selection grid (portrait)**

```
┌──────────────────────┐
│ Pick exactly 10      │
│ Selected: 7/10       │
├──────────────────────┤
│ [Vertrauen✓][Mut   ] │
│ [Respekt ✓][Fokus  ] │
│ [Offenheit][Team  ✓] │
│ [Klarheit ][Fairness]│
│  … ~50 values,       │
│    grid scrolls …    │
├──────────────────────┤
│ [ Submit selection ] │  → SubmitValueSelection
│ (enabled at 10/10;   │   (locked after)
│  duplicates refused) │
└──────────────────────┘
```

**Presenter · Top values, two columns (phase 4, fullscreen)**

```
┌───────────────────────────────────────┐
│ Your top values                       │
│                                       │
│ ▓ Vertrauen  21    Klarheit     8     │
│ ▓ Respekt    18    Neugier      7     │
│ ▓ Team       16    Offenheit    6     │
│ ▓ Fairness   14    Geduld       5     │
│ ▓ Ehrlich…   13    Loyalität    4     │
│ ▓ Wertschä…  12    Kreativität  4     │
│ ▓ Vielfalt   11    Struktur     3     │
│ ▓ Zuverläs…  10    Humor        3     │
│ ▓ Mut         9    Balance      2     │
│ ▓ Fokus       9    Sinn         1     │
│                                       │
│ ordered by selections: left column    │
│ top→bottom, then right column         │
│ ▓ = top value, color-highlighted      │
│ (tie at 10th → 11+ highlighted)       │
└───────────────────────────────────────┘
```

Facilitator phase 3: submission progress count + Advance. Facilitator
phase 4 and participant phase 4: mirror of the presenter top-values view.

### Phase 5 — Group formation

**Participant · Own group (portrait)**

```
┌──────────────────────┐
│ Your group: Otter    │
├──────────────────────┤
│ Anna   Ben           │  ← members grouped
│ you    Dana          │    top-left (color A)
│                      │
│                      │
│          Vertrauen   │  ← values grouped
│             Mut      │    bottom-right
│           Respekt    │    (color B)
└──────────────────────┘
```

**Presenter · Paginated group cards, 3×2 (fullscreen)**

```
┌───────────────────────────────────────┐
│ Groups                                │
│ ┌────────┐ ┌────────┐ ┌────────┐      │
│ │ Otter  │ │ Fuchs  │ │ Igel   │      │
│ │ Anna … │ │ Edi …  │ │ Ida …  │      │
│ │ values │ │ values │ │ values │      │
│ └────────┘ └────────┘ └────────┘      │
│ ┌────────┐ ┌────────┐ ┌────────┐      │
│ │ Hase   │ │ Luchs  │ │ Biber  │      │
│ └────────┘ └────────┘ └────────┘      │
│                                       │
│      ● ○    6 cards per page,         │
│             cycles every 7 s          │
└───────────────────────────────────────┘
```

Facilitator phase 5: full list of groups with members and assigned values
(dense, unpaginated) + Advance.

### Phase 6 — Group work

**Participant (scribe) · Value tabs + editor (portrait)**

```
┌──────────────────────┐
│ Group Otter · scribe │
├──────────────────────┤
│ [Vertrauen][Mut][Re…]│  ← value tabs (flex row)
├──────────────────────┤
│ Vertrauen (2/5)      │
│ • Action text…  ✎ ✕  │  → EditAction / RemoveAction
│ • Action text…  ✎ ✕  │
│ [+ add action]       │  → AddAction
├──────────────────────┤
│ [ Submit group work ]│  → SubmitGroupWork
│ (submitted: [Reopen])│  → ReopenGroupWork
└──────────────────────┘
```

**Participant (member) · Value tabs, read-only (portrait)**

```
┌──────────────────────┐
│ Group Otter          │
│ Scribe: Anna         │
├──────────────────────┤
│ [Vertrauen][Mut][Re…]│  ← value tabs (flex row)
├──────────────────────┤
│ Vertrauen (2/5)      │
│ • Action text…       │
│ • Action text…       │
│                      │
│ read-only · synced   │
│ with scribe status   │
│ every 0.5 s          │
└──────────────────────┘
```

**Facilitator · Group-work overview (laptop)**

```
┌─────────────────────────────────────────┐
│ Phase 6 · Group work      [ Advance ▸ ] │  → AdvancePhase — disabled until
├─────────────────────────────────────────┤    every group submitted (T2a)
│ Group   Scribe   Actions   Status       │
│ Otter   Anna ▾   7        submitted     │  → ReassignScribe (▾)
│ Fuchs   Ben  ▾   4        editing       │
│ Igel    Cem  ▾   6        editing       │
└─────────────────────────────────────────┘
```

**Presenter · Paginated cards + status (fullscreen)**

```
┌───────────────────────────────────────┐
│ Group work                            │
│ ┌────────┐ ┌────────┐ ┌────────┐      │
│ │ Otter ✓│ │ Fuchs …│ │ Igel  …│      │
│ │ submtd │ │ working│ │ working│      │
│ └────────┘ └────────┘ └────────┘      │
│ ┌────────┐ ┌────────┐ ┌────────┐      │
│ │ Hase  …│ │ Luchs ✓│ │ Biber …│      │
│ └────────┘ └────────┘ └────────┘      │
│                                       │
│ same 3×2 paginated cards as phase 5,  │
│ + working/submitted indicator         │
│      ● ○    cycles every 7 s          │
└───────────────────────────────────────┘
```

### Phase 7 — Value presentation

**Presenter · Presented value (fullscreen)**

```
┌────────────────────────────────┐
│ Group Otter                    │
│                                │
│        VERTRAUEN               │
│                                │
│ Actions                        │
│ 1. We start meetings on time…  │
│ 2. We share mistakes openly…   │
│ 3. We ask before assuming…     │
└────────────────────────────────┘
```

**Facilitator · Presentation walk + typo fixes (laptop)**

```
┌─────────────────────────────────────────┐
│ Phase 7 · Presentation    [ Advance ▸ ] │  → AdvancePhase — disabled until
├─────────────────────────────────────────┤    all values presented (T2c)
│ Presenting: Otter · Vertrauen           │
│ 1. We start meetings on time…      ✎    │  → EditAction (facilitator,
│ 2. We share mistakes openly…       ✎    │    wording/typo fixes only,
│ 3. We ask before assuming…         ✎    │    T17a)
│                                         │
│ [ Next value ▸ ]  → GoToNextValue       │
└─────────────────────────────────────────┘
```

Participant phase 7: mirror of the presented value, passive.

### Phase 8 — Final voting

**Participant · Value cards with actions + stepper (portrait)**

```
┌──────────────────────┐
│ Your votes: 3/5 used │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ Vertrauen        │ │
│ │ • action text…   │ │
│ │ • action text…   │ │
│ │      [−]  2  [+] │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ Mut              │ │
│ │ • action text…   │ │
│ │      [−]  1  [+] │ │
│ └──────────────────┘ │
│ … one card per       │
│   presented value …  │
├──────────────────────┤
│ [ Submit 5 votes ]   │  → SubmitFinalVotes
│ (enabled at 5/5;     │   (irrevocable)
│  tiebreak: tied      │
│  values only, allot= │
│  number of tied)     │
└──────────────────────┘
```

**Facilitator · Voting controls (laptop)**

```
┌─────────────────────────────────────────┐
│ Phase 8 · Final voting    [ Advance ▸ ] │  → AdvancePhase — disabled until
├─────────────────────────────────────────┤    winners stand (T2b)
│ Main round · voted: 24/30               │
│ [ Close voting ]  → CloseVoting         │
├─────────────────────────────────────────┤
│ after close, if tie at 5th:             │
│ Tie: Mut = Fokus (9 votes)              │
│ [ Start tiebreak ]→ StartTiebreakRound  │
└─────────────────────────────────────────┘
```

**Presenter · Voting ongoing (fullscreen)**

```
┌────────────────────────────────┐
│                                │
│                                │
│        Voting ongoing…         │
│                                │
│   Cast your 5 votes on your    │
│   phone — secret & anonymous   │
│                                │
│                                │
│      (no tallies shown)        │
└────────────────────────────────┘
```

### Phase 9 — Final presentation

**Presenter · One full screen per winner (fullscreen)**

```
┌────────────────────────────────┐
│ Place 5 · 9 votes              │
│                                │
│           FOKUS                │
│                                │
│ Actions                        │
│ 1. We block focus time daily…  │
│ 2. We silence notifications…   │
│                                │
│ one entire screen per winning  │
│ value *with* its actions —     │
│ least → most voted             │
└────────────────────────────────┘
```

**Facilitator · Reveal control (laptop)**

```
┌─────────────────────────────────────────┐
│ Phase 9 · Final presentation            │
├─────────────────────────────────────────┤
│ Revealed: 2 of 5                        │
│ [ Reveal next value ▸ ]→ RevealNextValue│
│                                         │
│ (all revealed → workshop concluded)     │
└─────────────────────────────────────────┘
```

**Participant · During reveal (portrait)**

```
┌──────────────────────┐
│ Herbst 2024          │
├──────────────────────┤
│                      │
│  The final values    │
│  are being presented │
│  — eyes up front!    │
│                      │
│ (nothing else shown  │
│  — no distraction)   │
│                      │
└──────────────────────┘
```

**Participant · After conclusion — PDF download (portrait)**

```
┌──────────────────────┐
│ Workshop concluded   │
├──────────────────────┤
│ Thanks for taking    │
│ part!                │
│                      │
│ ┌──────────────────┐ │
│ │ ⬇  Download PDF  │ │  ← workshop record:
│ │ (workshop record)│ │    all tallies, all
│ └──────────────────┘ │    actions, winners;
│                      │    no names
└──────────────────────┘
```

---

## 4. Cross-cutting notes

- **Reconnect/resume (any phase):** a returning facilitator or participant
  lands directly on their current phase view with their exact prior state —
  role, group, scribe status, submissions, cast votes (T3, I4, I16). No
  rejoin screen, no lost place.
- **Facilitator control bar:** every facilitator screen carries the phase
  name and the Advance button; per-phase disable guards mirror the
  state-machine exit guards (T2a–T2c). Sub-controls sit below the bar.
- **Presenter view:** fullscreen, zero interactivity, reachable without
  sign-in (its address names the session). Never shows anything that links
  a person to an answer, selection, or vote.
- **Participant:** portrait mobile-first; all content reflows to a centered
  single column on landscape laptops. One primary action per screen.
- **Anonymity on screen:** all tallies are *displayed* counts-only. Final
  votes are truly anonymous — the session never links voter to votes (I14).
  Quiz answers and value selections are known per participant inside the
  session (selections feed the group-formation aim: matching each
  participant's own ten values against their group's values), but no screen
  ever shows who picked or selected what. Names appear only where the
  domain has them: roster, group membership, scribe assignment.
- **i18n (de + en):** every visible string exists in both languages.
  Language-carrying content: value names, quiz questions, answer options,
  learning texts, all labels/buttons/notices, and the workshop record.
  Group animal names are localized labels. Participant-written action texts
  are free text and not translated.

## 5. Consistency walk

- Matrix and wireframes cover every transition T1–T23 + T17a: each
  facilitator ◆ sub-control has a button (§2), each participant command an
  element, each System transition a note in the matrix.
- Every 0.1 command is reachable (§2: 22/22).
- SPEC.md screens table honored: facilitator dense + full control;
  presenter fullscreen/passive/no sign-in; participant portrait-first.
- Decisions from the Task 0.3 review (rev 2, user-approved) are recorded in
  `tasks/specs/03-screens.md` and reflected above; the one domain deviation
  (facilitator EditAction during Value presentation) is codified in
  `domain-model.md` (I10, EditAction) and `state-machine.md` (T17a).

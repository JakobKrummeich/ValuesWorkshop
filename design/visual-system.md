# Visual system — "Lichtung"

The product's look, approved in the Task 29 Lavish sessions. `screens.md`
locks structure and behaviour; this file locks colour, type, motion, chrome,
and the per-screen compositions. Implementation rules (tokens only, CSS
modules, hook/shell split) stay in `frontend/FE-IMPLEMENTATION-RULES.md`.

## 1. Idea

Groups are forest animals, the workshop happens in a dimmed room in front of
a beamer. The wall and the phones are **night** surfaces (deep pine, ember
accent, mint highlight, slow teal/ember/plum ambient glow). The facilitator
laptop is a **paper** surface (warm off-white, ink, pine, ember). One system,
two skins; the animal hues are the colour story on every surface.

Principles: the wall is read from ten metres — large type, one idea per
screen, actions are the outcome (values are context); the phone is one primary
action per screen with a sticky CTA; the laptop is dense and calm. Motion is
purposeful: enter, count, reveal. Nothing moves forever except the ambient
glow and the waiting motif. `prefers-reduced-motion` turns all of it off.

## 2. Tokens

Base primitives live only in `frontend/src/app/tokens.css`; per-surface
layers (`tokens.presenter.css`, `tokens.participant.css`,
`tokens.facilitator.css`) map the semantic layer. Components use semantic
tokens only. Hex/rgb values appear nowhere else.

### Base palette

| token | value | use |
|---|---|---|
| `--base-night-900` | `#07150F` | night bg |
| `--base-night-800` | `#0B1F16` | night bg alt / cards on bg |
| `--base-night-700` | `#10251A` | night surface |
| `--base-night-600` | `#173226` | night surface strong / hover |
| `--base-night-hairline` | `rgb(255 255 255 / 10%)` | night borders |
| `--base-night-scrim` | `rgb(7 21 15 / 75%)` | night dialog scrim |
| `--base-night-text` | `#F1F6EE` | night text |
| `--base-night-muted` | `#A3B8A8` | night muted text |
| `--base-ember-500` | `#FFB63B` | accent, CTA (night) |
| `--base-ember-600` | `#F28C1E` | accent deep, gradients |
| `--base-ember-700` | `#E58A12` | accent on paper |
| `--base-ember-800` | `#8F5407` | value-chip text on paper (5.4:1) |
| `--base-ember-900` | `#1A1200` | text on ember |
| `--base-mint-400` | `#8EF0B4` | highlight, success on night |
| `--base-teal-500` | `#2CC7B8` | ambient glow 1 |
| `--base-plum-500` | `#B57BFF` | ambient glow 3 |
| `--base-paper-100` | `#F7F1E6` | paper bg |
| `--base-paper-200` | `#EFE7D8` | paper sidebar / inset |
| `--base-paper-hairline` | `#E3DACA` | paper borders |
| `--base-paper-scrim` | `rgb(22 33 27 / 45%)` | paper dialog scrim |
| `--base-white` | `#FFFFFF` | paper surface |
| `--base-ink-900` | `#16211B` | paper text |
| `--base-ink-600` | `#5D6A62` | paper muted |
| `--base-pine-700` | `#1B5E3C` | paper primary |
| `--base-pine-800` | `#144A2F` | paper primary strong |
| `--base-moss-500` | `#3B9A5C` | success on paper |
| `--base-clay-600` | `#B33B26` | danger on paper (`#C4432B` fell short of 4.5:1 on paper-100) |
| `--base-clay-400` | `#EC7A60` | danger on night (clay-600 fell short of 4.5:1 on night-900) |
| `--base-clay-100` | `#FBE4DF` | danger soft (paper) |
| `--base-animal-otter` | `#1FA3B5` | |
| `--base-animal-fuchs` | `#F0672A` | |
| `--base-animal-eule` | `#8E5BE0` | |
| `--base-animal-igel` | `#D69A22` | |
| `--base-animal-dachs` | `#6C7F95` | |
| `--base-animal-luchs` | `#E2B62C` | |
| `--base-animal-biber` | `#A6552E` | |
| `--base-animal-marder` | `#6BAE3A` | |

Animal token names use the catalog `animalId` (German ids) so CSS can select
by `data-animal`.

### Base type, space, shape, motion

- Fonts: `--base-font-display: var(--font-fraunces), Georgia, serif`,
  `--base-font-sans: var(--font-manrope), system-ui, sans-serif`. The
  `--font-*` variables come from `next/font/local` in `layout.tsx`; files
  are vendored latin-subset variable woff2 under `frontend/src/app/fonts/`
  (Fraunces `opsz 9..144, wght 300..900`; Manrope `wght 400..800`), OFL
  licence files next to them, `display: swap`.
- Weights `--base-weight-regular 400`, `-semibold 600`, `-bold 700`,
  `-black 800`. Display weight for Fraunces is 600.
- Sizes: keep `--base-text-12 … 40`, add `--base-text-48: 3rem`,
  `--base-text-64: 4rem`, `--base-text-96: 6rem`, `--base-text-128: 8rem`.
- Space: keep the scale; add `--base-space-128`.
- Radius: `--base-radius-sm 8px`, `-md 14px`, `-lg 22px`, `-full 999px`.
- Shadows: `--base-shadow-card: 0 1px 2px rgb(22 33 27 / 6%), 0 8px 24px
  rgb(22 33 27 / 8%)`; `--base-shadow-glow-ember: 0 0 32px rgb(255 182 59 /
  35%)`; `--base-shadow-glow-mint: 0 0 24px rgb(142 240 180 / 35%)`.
- Motion: `--base-motion-fast 150ms`, `-base 300ms`, `-slow 600ms`,
  `-reveal 900ms`, `-stagger 80ms`; `--base-ease-out: cubic-bezier(.2, .8,
  .2, 1)`, `--base-ease-spring: cubic-bezier(.34, 1.56, .64, 1)`,
  `--base-ease-in-out: cubic-bezier(.65, 0, .35, 1)`.

### Semantic layer (every surface defines all of these)

`--color-bg`, `--color-bg-alt`, `--color-surface`, `--color-surface-strong`,
`--color-border`, `--color-text`, `--color-text-muted`, `--color-primary`,
`--color-primary-strong`, `--color-on-primary`, `--color-brand-mark`
(wordmark ember mark — reads its own token so it stays ember on paper
instead of taking the surface accent), `--color-accent`,
`--color-accent-deep`, `--color-on-accent`, `--color-highlight`, `--color-eyebrow`
(eyebrow text: mint on night, pine on paper — AA as text),
`--color-success`, `--color-danger`, `--color-danger-soft`, `--color-glow-1`,
`--color-glow-2`, `--color-glow-3`, `--color-member-chip`,
`--color-member-chip-soft`, `--color-value-chip`, `--color-value-chip-soft`,
`--color-animal-otter` … `--color-animal-marder`, `--color-qr-paper`,
`--color-qr-ink`; `--font-display`, `--font-sans`; `--text-*` per surface;
`--space-tight/-gap/-gutter`; `--radius-sm/-md/-lg/-full`; `--shadow-card`,
`--shadow-glow-accent`, `--shadow-glow-highlight`; `--motion-fast/-base/
-slow/-reveal/-stagger`; `--ease-out/-spring/-in-out`.

Night mapping: bg night-900, bg-alt night-800, surface night-700, surface-strong
night-600, border night-hairline, text night-text, muted night-muted, primary
ember-500, on-primary ember-900, accent ember-500, accent-deep ember-600,
highlight mint-400, success mint-400, danger clay-400, glow teal/ember/plum,
member chip mint, value chip ember.

Paper mapping: bg paper-100, bg-alt paper-200, surface white, surface-strong
paper-200, border paper-hairline, text ink-900, muted ink-600, primary
ember-700 (the Advance CTA), primary-strong ember-600, on-primary ember-900
(white on ember-700 reads at 2.6:1, far below AA),
accent pine-700, accent-deep pine-800, highlight moss-500, success moss-500,
danger clay-600, danger-soft clay-100, member chip pine, value chip ember-700.

Contrast guard: a jest test parses the token files and asserts WCAG AA (4.5:1)
for text/muted on bg/surface and on-primary on primary, 3:1 for accent and
highlight on bg, on both skins.

## 3. Type scale

| role | wall (1920) | phone | laptop |
|---|---|---|---|
| eyebrow (sans 800, tracking .25em, uppercase) | `clamp(18px, 1.2vw, 26px)` | 12px | 12px |
| body (sans) | `clamp(22px, 1.5vw, 32px)` | 16px | 15px |
| action row (sans 700) | `clamp(30px, 2.5vw, 52px)` | 16px | 15px |
| heading (display 600) | `clamp(40px, 3.6vw, 76px)` | 24px | 26px |
| value name in finale/presentation (display 600) | `clamp(30px, 2.5vw, 52px)` | — | — |
| counter (display 600, tabular) | `clamp(96px, 11vw, 220px)` | 40px | 32px |
| giant numeral watermark (display 700) | `clamp(200px, 22vw, 420px)` | — | — |

Numbers that change use `font-variant-numeric: tabular-nums`. Fraunces
sets `font-variation-settings: "opsz" 144` for display sizes, `"opsz" 14`
for small serif labels (the wordmark).

## 4. Motion catalogue

- **Enter**: `fade + rise 12px`, `--motion-base`, `--ease-out`. Every phase
  screen root enters this way (`PhaseView` keys by phase, so a phase change
  remounts).
- **Stagger**: children enter with `animation-delay: calc(var(--index) *
  var(--motion-stagger))`; the index is injected with `cssCustomProperty`.
- **Pop**: `scale .6 → 1` with `--ease-spring`, `--motion-base` (chips,
  names, glyph badges).
- **Count-up**: `useCountUp(target)` animates the displayed integer over
  `--motion-slow` with ease-out; reduced motion → immediate.
- **Grow**: bars `width` from 0 over `--motion-reveal`, staggered; labels and
  counts fade in after the bars (delay = bar count × stagger).
- **Slide**: presentation views slide in from the right 40px + fade.
- **Bloom**: glyph scale `.8 → 1` with glow shadow fading in, `--motion-slow`.
- **Ping**: a ring expands from an element and fades (join QR when someone
  joins; vote card when a vote is added).
- **Aurora** (waiting motif): three blurred gradient blobs (glow-1/2/3) drift
  on 14/18/22 s loops behind the copy; static under reduced motion.
- **Ambient**: the night bg carries two large radial glows (teal top-left,
  ember bottom-right, plum faint top-right) that drift on a 60 s loop.
- **Confetti**: 60 particles in animal hues fall/rotate for 2 s once
  (`Confetti` component, CSS-only, mount-triggered), none under reduced motion.
- **Draw**: SVG glyph strokes draw in (`stroke-dashoffset`) over
  `--motion-reveal` on the group-intro wall view.

## 5. Chrome

- **Wordmark**: leaf/ember mark (a rotated teardrop, ember) + "Values
  Workshop" in Fraunces (`opsz 14`, 600). Shared component `Wordmark`.
- **PhaseStepper**: nine steps with localized names (new i18n keys
  `PhaseNameJoin … PhaseNameFinalPresentation`: Join/Ankommen, Quiz/Quiz,
  Selection/Auswahl, Results/Ergebnis, Groups/Gruppen, Group
  work/Gruppenarbeit, Presentations/Vorstellung, Vote/Abstimmung,
  Finale/Finale). Variants: `wall` (dots, current step as an ember pill),
  `phone` (pips under the phase name), `sidebar` (vertical timeline with
  check marks). The current step renders `<span data-testid="phase">Phase
  N</span>` (exact text, e2e contract) plus the name.
- **Connection**: facilitator sidebar and phone header show a dot + text
  (`data-testid="connection"`, texts unchanged). The wall renders the same
  element visually hidden while connected and as a bottom toast
  ("Reconnecting…") otherwise — no live indicator on a healthy wall.
- **Language switcher**: phone header and laptop sidebar only, as small
  pills. The wall has none; wall language = `?language=de|en` query override
  → cookie → `Accept-Language`.
- **Shells**: `PresenterShell` (top bar + content), `ParticipantShell`
  (header + scrolling content + sticky footer slot for the CTA, always with
  a gap above the CTA), `FacilitatorShell` (sidebar + main + sticky bottom
  bar: guard text left, Advance right). The Advance button reads "Advance to
  N · Name →" (`AdvanceToPhase` key with `{phase}` and `{name}`); on the last
  phase it is absent.

## 6. Components

- **Action ledger** (replaces bullets everywhere): rows, each with a short
  ember vertical rule at the left (3px × 1.2em, radius full), text
  left-aligned, sans 600, rows separated by hairlines. Wall variant
  ("slabs"): surface cards, ember rule, heading type, staggered entry.
- **Animal card** (GroupCard): hue-tinted gradient surface (`--card-tint`
  custom property computed with `color-mix` from the animal token), hairline
  in the hue, a giant glyph watermark (opacity 12 %, ~9em, bottom-left,
  bleeding off the card, `overflow: hidden`), group name in Fraunces
  top-left with a small hue glyph beside it, members top-right as a vertical
  list with tiny hue dots, values bottom-right as ember serif words. Status
  pill (phase 6) bottom-left. Entrance: staggered rise, one glow pulse.
- **Animal glyphs**: `AnimalGlyph` renders one inline SVG symbol per animal
  (32 px grid, 2 px strokes, `currentColor`), from `.lavish/task29-spec.html`
  as the starting strokes; refine but keep them line icons.
- **Vote control**: segmented pill on the card's bottom edge: round 44 px
  `−` (ghost) and `+` (ember filled, glowing while votes remain), the count
  in Fraunces between them; press = spring scale; disabled = 30 % opacity.
  Cards with votes get an ember border and a ping on increment.
- **Chips**: pill, sans 700; selectable chips pop on select, ember when
  selected, faded at the limit.
- **CTA**: full-width ember bar in the sticky footer, radius lg top corners
  on phones, ember glow; disabled = surface-strong with muted text and a
  hint ("Pick 3 more", "2 votes left").
- **Counter**: display numeral with a sans eyebrow suffix ("of 30 joined").
- **Progress ring**: conic-gradient ring with the percentage in Fraunces
  (forming groups, selection progress on the laptop).
- **Bars**: track surface-strong, fill ember gradient (ember-deep → ember);
  mint gradient for the correct quiz answer, muted grey for dimmed rows.
- **Aurora waiting screen**: `WaitingScreen` takes heading + body keys and
  renders the aurora motif behind them.
- **Confetti**: mount-triggered, 2 s, animal hues.

## 7. Screens

Wall (W), phone (P), laptop (L). Participant on a laptop = the phone layout
in a centred 34em column, chips/cards in two columns where they fit.

1. **Join** — W: QR paper card centred top with "Scan to join" beneath;
   counter "12 / 30 joined" (count-up) beneath that; names as chips popping
   in (spring, stagger), newest glows mint, a ping ring from the QR on each
   join. P: aurora + "You are in, Lea." + "Waiting for the workshop to
   start…" + counter. L: names as chips, "Copy join link" ghost button +
   outcome text, guard "Advance when everybody is in."
2. **Quiz** — W has three views: answering (question in Fraunces, bars grow
   live, counts count up), revealed (correct bar mint + check, others dim),
   learning text (own view: eyebrow "Learning text", the text large in
   Fraunces, correct answer as a mint pill on top). P: answer buttons (ember
   ring when picked), CTA "Lock in answer A"; answered → "Your answer:" card;
   waiting → aurora. L: question, answer rows with counts, correct row mint,
   learning text card, morphing pine button.
3. **Selection** — W: eyebrow "Pick your 10 values", giant counter "21 / 30"
   + bar. P: chips grid, "7 / 10 selected", CTA "Pick 3 more" → "Submit
   selection" → confirm sheet → check screen. L: ring + copy + guard.
4. **Results** — W: top-aligned, eyebrow, two columns of ten, reveal
   choreography (bars grow staggered, then labels + counts fade in), cut
   values ember, rest grey, "and N more". P: aurora "Eyes up front" / "The
   results are on the screen." L: dense chart.
5. **Groups** — W: while forming, a large progress ring "Forming groups…";
   formed: 3×2 animal cards, staggered entrance, pages cycle every 7 s with a
   slide. P: forming ring, then own animal card ("Your group" / "Find each
   other in the room."). L: all animal cards (paper variant) in a grid.
6. **Group work** — W: animal cards + status pills ("Editing" pulses ember,
   "Submitted" mint with a check). P: compact animal header (glyph, name,
   "Scribe: Gus (you)"), value tabs (ember), action ledger rows editable
   for the scribe (input + remove), ghost "+ Add action", hint, CTA "Submit
   result" / ghost "Reopen result", status pill. L: table with glyph in the
   group cell, scribe select, action count, status pill.
7. **Presentations** — W group intro: giant hue glyph draws in, "Up next",
   group name. W value view: left column glyph + "Fox presents" + value name
   (display, smaller than the actions' block), right two-thirds action slabs
   sliding in staggered. P: aurora "Listen to the groups" / "{group} is
   presenting {value}." (own group: "Your group is up!"). L: position line,
   action rows with inline ✎ editors, "Next value" pine button.
8. **Vote** — W: "Voting ongoing…" display + body copy over the aurora
   (no voted counter — the presenter state carries no count). P: header "Your votes" + pips, cards
   with the action ledger (all actions, left-aligned) and the vote control,
   CTA "2 votes left" → "Submit 5 votes"; submitted → check screen "Your votes
   are counted — secret and anonymous." L: round line, progress bar, "Close
   voting" pine, results card with tally / tie / "Start tiebreak".
9. **Finale** — W anticipation: "And the winners are …" over the aurora. W
   reveal: left third a giant ember numeral watermark with eyebrow "Place 1 ·
   14 votes" and the value name beneath (display, smaller than the slabs);
   right two-thirds action slabs sliding in staggered; confetti burst after
   the last slab. W overview: podium of three columns (heights 2 · 1 · 3 =
   70 / 100 / 55 %) with value names on top and votes beneath, further places
   as a small card row. P: aurora until concluded; concluded: own group glyph
   blooms in its hue + confetti, "Workshop concluded", "Thanks for taking
   part!", CTA "Download workshop record (PDF)". L: revealed count, "Reveal
   next value", concluded note.

Entry: L "Open a session" — paper card centred (session name, passphrase,
ember "Open session"). P: AuthGuard states and MissingSession over the
aurora ("No session in this link" / "Please scan the QR code on the wall
again.").

## 8. i18n additions

Phase names (9), `AdvanceToPhase` ("Advance to {phase} · {name}" / "Weiter zu
{phase} · {name}"), waiting copy (`WaitingEyesUpFront` "Eyes up front" /
"Blick nach vorn", `WaitingResultsOnScreen`, `WaitingListenToGroups`,
`WaitingGroupPresents` with `{group}`/`{value}`, `WaitingOwnGroupUp`),
`JoinedCounter` ("of {total} joined"), `SelectionPickMore` ("Pick {count}
more"), `VotesLeft` ("{count} votes left" / "1 vote left"), `LockInAnswer`
("Lock in answer {letter}"), `YourGroup`, `FindEachOther`, `Reconnecting`
toast, `WorkshopConcluded` exists. German for all.

## 9. Guardrails

Every `data-testid` stays. Stylelint token rules stay. New hooks are TDD'd
(`useCountUp`, `usePhaseStepper`, `useConfetti`, `useRevealChoreography`,
`useWallLanguage`). Contrast test over the token files. Focus-visible rings
(2px highlight, offset 2px) on every control; touch targets ≥ 44 px;
reduced-motion fallbacks in every module that animates. Nothing overflows:
wall screens are laid out for 1920×1080 and 1280×720; phone for 360×640 up
to 430×932; laptop for 1280×800 up.

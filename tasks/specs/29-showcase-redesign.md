# Task 29 — Showcase redesign + demo video

**Status:** approved in two Lavish rounds (session ended by the user with full
autonomy to build, verify, record the video, and open the PRs). Umbrella spec;
slices 29a–29e each ship as their own PR (stacked branches, user merges).
The design itself is specified in `design/visual-system.md`.

## Why

The README screenshots look bland: system font, flat white cards, a
"Phase N · Connected" box that dominates every screen, no identity. The
project exists to show what clean, maintainable, high-quality software looks
like — the surface should say that at first glance. Deliverable: a frontend
redesign with a real identity plus a 60–90 s showcase video embedded in the
README.

## Assumptions

1. Frontend only. No backend, protocol, or persistence change. Every
   `data-testid` and every e2e flow stays valid; behaviour per
   `design/screens.md` stays (one primary action per phone screen, facilitator
   Advance always present, anonymity, presenter read-only).
2. All guardrails stay: stylelint token rules (no hex/px outside `tokens*.css`,
   semantic tokens only in components), jest coverage, e2e, no-mistakes gate.
3. Fonts are vendored OFL `woff2` files under `frontend/src/app/fonts/`, loaded
   with `next/font/local` — no build-time network, Docker build unchanged.
4. Presenter language switcher is removed (wall is read-only). Wall language =
   `?language=de|en` query override → language cookie → `Accept-Language`.
   Supersedes the Task 26 D1 "chrome stays on the wall" decision; the
   `e2e/localeFlip.spec.ts` presenter test moves to the query override.
5. The video is generated locally (`pnpm demo:video`), never in CI. ffmpeg runs
   from the `linuxserver/ffmpeg` Docker image (no local ffmpeg, no sudo).
   Outputs are committed under `docs/media/`.

## Direction — "Lichtung" (forest clearing) — recommended

Groups are forest animals and the palette is already green + amber. Lean in:
a night-forest wall, a paper laptop, a phone that suits a dimmed room.

**Night (wall, phone):** bg `#0B1A13`, surface `#12271C`, hairline
`rgb(255 255 255 / 8%)`, text `#EEF3EA`, muted `#9DB0A2`, ember accent
`#F5B84B`, mint highlight `#9FE0B6`, slow ambient radial glow (moss → pine,
≥ 60 s drift), faint grain.

**Paper (laptop):** bg `#F6F2EA`, surface `#FFFFFF`, ink `#171C18`, muted
`#5F6862`, hairline `#E4DED2`, pine primary `#1F5B3B`, ember `#D98F1F`, moss
success `#3E8A5A`, clay danger `#B8432F`.

**Animal hues (8):** otter teal `#2F8F9D`, fox rust `#D2622B`, owl plum
`#7A4E9E`, hedgehog ochre `#B8862B`, badger slate `#5B6B7A`, lynx gold
`#C9A227`, beaver chestnut `#8A4B2F`, marten moss `#5E8C3A`. Group badge =
hue + monogram; cards take the hue as accent.

**Type:** Fraunces (variable serif, optical size axis) for display, value
names, numerals; Manrope for UI and body; tabular numerals everywhere numbers
change. Wall display up to ~14 vw.

**Shape:** radius 12 / 20 / pill. Paper cards: hairline + soft shadow. Night
cards: hairline + inner glow.

**Motion tokens:** `--motion-fast 150ms`, `--motion-base 300ms`,
`--motion-slow 600ms`, `--motion-reveal 900ms`; `--ease-out
cubic-bezier(.2,.8,.2,1)`, `--ease-spring cubic-bezier(.34,1.56,.64,1)`.
`prefers-reduced-motion` disables everything non-essential.

**Alternatives considered.** B "Studio bold": near-black + acid lime + violet,
Bricolage Grotesque — energetic but breaks the forest story. C "Aurora glass":
gradient mesh + glass cards everywhere — flashy, weak contrast on phones,
dates fast. A borrows C's ambient glow for the wall only.

## Per-surface concepts

### Wall (presenter)
- Chrome collapses to one slim top bar: wordmark left, 9-step stepper centre
  (dots + current phase name), connection dot right. No language switcher.
- Phase names become i18n keys (en/de): Join/Ankommen, Quiz/Quiz,
  Selection/Auswahl, Results/Ergebnis, Groups/Gruppen, Group
  work/Gruppenarbeit, Presentations/Vorstellung, Vote/Abstimmung,
  Finale/Finale.
- Phase change: content enters with fade + rise, keyed by phase.
- Join: QR stays dark-on-light inside a paper card; roster names pop in with a
  spring stagger; participant count counts up.
- Quiz: question in Fraunces; answer cards with live bars; numbers count up;
  learning text reveals in an ember-edged panel.
- Results: bars grow in staggered; top values glow ember.
- Group formation: progress ring → group cards flip in with animal badge and
  hue; value chips amber, member chips mint.
- Group work: cards with live status (editing pulse / submitted check).
- Value presentation: value word large, actions list, group badge; slide-in.
- Final voting: anonymous "votes are coming in" counter only.
- Finale: anticipation breathing → place 3 / 2 / 1 reveal with light burst and
  confetti in animal hues → podium summary.

### Phone (participant)
- Top: dot stepper + phase name. Body. Sticky bottom primary action (≥ 44 px).
- Value chips: spring pop on select, selected-count badge; submit → check
  draws itself.
- Vote stepper: symmetrical round − / + buttons (fixes the current grey
  "−" box), vote pips instead of "3/5 used".
- Waiting: breathing blob in ember, one calm line.

### Laptop (facilitator)
- Sidebar (240 px): phase timeline (done / current / upcoming), session code,
  participant count. Main: phase content. Sticky bottom bar: Advance (ember,
  primary) + guard message inline.
- Tables keep density: hairline rows, status chips, styled scribe select.

## Video

- Story (≈ 75 s, 1920×1080, 30 fps, silent, captions): title 3 s → join 8 s →
  quiz 8 s → selection 8 s → results 6 s → groups 8 s → group work 8 s →
  presentations 6 s → vote 8 s → finale 10 s → outro 4 s (stack line).
- Pipeline: `pnpm demo:video` → Playwright drives facilitator + wall + 8
  participants (as `demo:media`), records per-device captures with scene
  timestamps → an HTML "stage" (wall full-frame, phone and laptop in device
  frames, captions) is rendered frame-by-frame by Playwright to PNGs → ffmpeg
  (Docker) encodes `docs/media/demo.mp4` (H.264) and a README-inline animated
  `demo.gif` (≤ ~12 MB). Spike first: capture quality (CDP screencast PNG vs
  `recordVideo`).
- README: hero GIF on top, link to the MP4. Optional: user uploads the MP4 via
  the GitHub UI for an inline player (repo-hosted MP4s do not play inline).

## Slices

| Slice | Scope | Size |
|---|---|---|
| 29a Foundation | tokens v2 (palette, fonts, motion, animal hues), phase-name i18n, new chrome on all three surfaces (top bar, stepper, sidebar, bottom bar), presenter switcher removal + `?language=`, shared components restyled (GroupCard badge, WaitingScreen, SubmittedConfirmation, charts, progress bar), contrast guard test over `tokens.css` | L |
| 29b Wall | 9 presenter screens, phase transitions, reveal choreography, confetti, count-up | L |
| 29c Phone | 9 participant screens, chip/vote micro-interactions | M |
| 29d Laptop | 9 facilitator screens, live status cards | M |
| 29e Video | capture + stage + encode pipeline, `docs/media/demo.{mp4,gif}`, README embed, regenerated screenshots | L |

## Guardrails / testing

- New tokens only in `tokens*.css`; components use semantic tokens only; no
  inline styles beyond `cssCustomProperty`.
- New hooks (`useCountUp`, `usePhaseStepper`, `useConfetti`,
  `usePhaseTransition`) are TDD'd; components stay thin shells.
- A jest test parses `tokens.css` and asserts WCAG AA contrast for every
  text/background pairing the semantic layer defines.
- Focus-visible rings on every control; touch targets ≥ 44 px; reduced-motion
  fallbacks everywhere.
- Fonts ≤ 300 KB total, `font-display: swap`.

## Decisions (Lavish rounds 1 + 2)

- D1 Direction A "Lichtung", **bolder and more colourful** than the first
  draft (saturated ember, teal/ember/plum ambient glows, animal hues tint
  their cards).
- D2 Phone is **night**; laptop is paper.
- D3 Animal badges are **hand-drawn SVG line glyphs** (direction approved,
  refine strokes in 29a); no monogram letters.
- D4 Video ≈ 75 s, GIF ≤ 12 MB inline in the README + MP4 in `docs/media/`.
- D5 Five stacked PRs (29a–29e).
- D6 Wordmark "Values Workshop" + leaf/ember mark.
- D7 Confetti on the finale: yes, 2 s, animal hues.
- D8 **No live/connection indicator on a healthy wall** (visually hidden
  while connected, toast only when reconnecting — e2e contract kept).
- D9 **Actions are the outcome**: on the finale and the presentation wall
  the actions are the hero (larger than the value name, readable from the
  back of the room), never numbered, never centred text, no plain bullets —
  the "action ledger" rows/slabs from the visual system.
- D10 Group cards: glyph + name left, members stacked top-right, values
  stacked bottom-right, hue-tinted, giant glyph watermark — "spectacular",
  not a text list.
- D11 Join wall: QR centred, counter and names beneath, flashy join
  animations (pop, ping, count-up).
- D12 Waiting motif is the **aurora**, not an orange ball; waiting screens
  get one line of copy ("Eyes up front", "{group} is presenting {value}").
- D13 Quiz wall: learning text gets its **own view** (never shares the
  screen with the tally); reveal animations.
- D14 Results wall: top-aligned, large type, bars grow first, labels fade in
  after.
- D15 Phone vote control is bold (round − / +, ember +, Fraunces count);
  cards are substantial; sticky CTA always has a gap above it.
- D16 Finale wall is a composition (numeral watermark left, slabs right,
  podium overview), not a top-to-bottom slide; the concluded phone screen
  blooms the own-group glyph with confetti instead of a generic check.
- D17 Advance button names the next phase ("Advance to 6 · Group work →").
- D18 (during 29c/29e) The redesign may change an e2e contract where the
  screen itself changed — the two-step quiz answer, the missing-session copy,
  the wall's `?language=` — as long as the specs keep asserting the same
  behaviour through the shared helpers in `e2e/support/`, which the demo
  tooling reuses instead of copying the drive.

## Verification before each PR

`./scripts/ci-lint.sh`, `./scripts/ci-test.sh` (includes e2e), a delegated
review, then the no-mistakes gate. Visual verification per slice: Playwright
screenshots of every screen at 1920×1080 + 1280×720 (wall), 390×844 + 360×640
(phone), 1440×900 + 1280×800 (laptop), inspected for clipped text, overlaps,
and missing gaps.

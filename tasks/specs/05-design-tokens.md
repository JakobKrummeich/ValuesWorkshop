# Mini-spec: Task 2 — Design tokens + stylelint gate (approved)

**Objective:** Two-layer design tokens; stylelint deterministically forbids raw
hex/px and base-primitive access outside token files via `pnpm --dir frontend lint`.

**Palette (user-approved):** green primary ramp (052e16→bbf7d0), amber/gold accent
ramp (78350f→fde68a; violet rejected), warm-gray neutrals (1c1917→fafaf9).
One font (system sans), weights 400/700, multiple-of-4 spacing scale (4→96).

**Architecture (4 files, user-approved):**
- `tokens.css` — base primitives, all `--base-` prefixed; referenced only by token files.
- `tokens.facilitator.css` — dense: type 14/16/20, spacing 4/8/16, control-height 32px.
- `tokens.presenter.css` — beamer: clamp()/vh sizes (~24px+ equiv, fits viewport,
  no scroll), max contrast, generous spacing.
- `tokens.participant.css` — mobile: type 16/20/24, control-height 48px, tap gap ≥8.
Semantic names identical across screen files (`--text-body`, `--space-gutter`,
`--control-height`, …); components use semantic tokens only.

**Deterministic enforcement:** stylelint + `stylelint-config-standard`:
`color-no-hex`, `color-named: never`, `unit-disallowed-list: ["px"]` (media queries
ignored); `stylelint-declaration-strict-value` requires `var()` for color/spacing/
font-size props (blocks rgb()/hsl()/keywords); rule forbidding `var(--base-…)`
outside token files; overrides relax rules for the 4 token files only.
Lint script → `eslint && stylelint "src/**/*.css" && pnpm typecheck`.

**Acceptance:** deliberate `#fff` AND deliberate `var(--base-green-600)` in
component CSS each fail lint (verified, reverted); all FE styles semantic-token-only.
**Out of scope:** component library, theming API.

## Slices
1. `tokens.css` + 3 screen token files + stylelint config/deps + lint wiring (green).
2. Migrate `globals.css` + `page.module.css` to semantic tokens; full lint green.
3. Both violation kinds fail lint → revert; visual check (dev server :3111).

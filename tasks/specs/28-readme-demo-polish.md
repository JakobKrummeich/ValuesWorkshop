# Task 28 — README + demo polish

Audit result: README is developer-centric (layout, commands, env table) and
solid, but has no product pitch, no prerequisites, no demo walkthrough, no
imagery. Compose already starts everything (`backend :5000`, `frontend :3000`,
`oidc :9000`), so the one-command demo exists — it is just not written down as
one. No screenshot/GIF tooling exists; ffmpeg is absent on the dev box.

## Decisions

- **D1 — README restructure.** Add on top: 2–3 sentence product pitch,
  prerequisites (Docker + Compose; Node/pnpm only for development), and a
  "Run the demo" section: `docker compose -f docker-compose.dev.yml up`,
  then the three URLs with demo credentials — facilitator `/facilitator`
  (passphrase `dev-facilitator-passphrase`), participant `/participant`
  (dev OIDC test accounts, e.g. Alice), presenter wall `/presenter`.
  Existing developer sections stay below.
- **D2 — screenshots, no GIF.** A Playwright capture script drives a real
  workshop against the compose stack and saves PNGs of the three roles at
  photogenic moments (participant voting, facilitator dashboard, wall during
  winner reveal) into `docs/media/`, referenced from the README. GIFs stay
  out: no ffmpeg, and binary churn in git outweighs the wow.
- **D3 — capture script is a manual tool.** Lives in `scripts/demoMedia/`
  as a Playwright spec with its own config (`pnpm demo:media`), reuses
  `e2e/support` helpers, never runs in CI; README notes how to regenerate
  the media.
- **D4 — seed data proofread.** One pass over `config/*.json` de+en texts for
  typos/awkward phrasing; content changes only if something is wrong.
- **D5 — acceptance = fresh-clone dry run.** Clone into a temp dir, follow
  the README demo section verbatim, reach a running workshop; recorded in
  the todo verification note.

## Slices

1. D1 README, 2. D2+D3 capture script + media, 3. D4 proofread, 4. D5 dry run.

## Verification

Fresh-clone dry run per D5; `./scripts/ci-lint.sh` + `./scripts/ci-test.sh`
green; README renders correctly on GitHub (image paths).

## Outcome

- D4: `config/values.json`, `quiz.json`, `animals.json` proofread in de+en —
  nothing to fix (dash typography per language is correct).
- Capturing surfaced wall defects, fixed on the branch: chart labels were
  truncated ("Determinat…", "Anpassungsfähigk|eit") → subgrid label column;
  presenter screens shrank to a centered box because the wall root centered
  its children → root stretches, chrome centers itself; short action lists on
  the reveal now sit centered. Both pinned by e2e assertions.

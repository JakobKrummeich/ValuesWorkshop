# Task 12 — Phase 1: Join

## Goal

Turn Phase 1 into a real screen trio: the presenter shows a large QR of the
join URL and the live lobby, the participant lands in a lobby after login, the
facilitator watches the roster fill and advances. Ships de+en from the first
screen and puts Playwright into CI.

## Today

All three screens are placeholder shells (`<h1>Presenter</h1>` +
`SessionStatusBanner`); no phase switch exists anywhere in the frontend.
Joining is already implicit on hub connect (`ParticipantHub.OnConnectedAsync`
→ `Session.Join`), the roster persists, and facilitator state carries
`RosterView(participantIds, participantCount)` — but participants have no
display name anywhere in Domain, persistence, or wire state. No i18n mechanism,
no QR dependency, no Playwright job in CI (16 tests, local-only, started by
`docker compose -f docker-compose.dev.yml up -d`).

## In scope

1. **Phase routing shell.** One per-role `phaseView` mapping `Phase` →
   component, so Tasks 13–22 slot their screens in instead of rebuilding this.
   Join is the first entry; every other phase renders the existing shell.
2. **Display names.** Participant name from the OIDC `name` claim, captured at
   hub connect, carried through `Session.Join(participantId, displayName, …)`,
   `Roster`, `ParticipantEntity` (+ migration), `RosterView`, and the presenter
   join state. `WorkshopStateAnonymityTests` gets an explicit, reviewed
   widening: names are visible in Phase 1 rosters, never alongside any vote or
   answer. Missing/blank claim → deterministic fallback label, no crash.
3. **Presenter join screen.** Large QR encoding
   `${origin}/participant?sessionIdentity=<guid>`, participant count, and a
   list of the people who already joined, growing live. No readable URL text —
   nobody types a URL off a projection.
4. **Participant lobby.** Post-login confirmation: own display name, "waiting
   for the workshop to start", participant count.
5. **Facilitator join screen.** Live roster list + count, the join URL with a
   copy-to-clipboard control, and the existing `AdvancePhaseButton`.
6. **i18n foundation.** de+en for every string on these screens *and* the
   existing shared shells (`AuthGuard`, `MissingSession`, `OpenSessionForm`,
   `SessionStatusBanner`). Language is per-client, switchable, and does not
   change the URL — the join URL in the QR must stay stable. Existing e2e
   selectors that assert English text get pinned to a locale.
7. **Playwright in CI.** A CI job that builds and starts the compose stack,
   installs chromium, runs all e2e specs (including the backend-restart
   reconnect smoke) and uploads the report on failure. Mirrored in
   `scripts/ci-test.sh`.

## Out of scope

Quiz content and sub-controls (13/14), any phase ≥ 2 screen, group formation,
presenter animations beyond a plain live list, translation of content JSON
(`config/*.json` is already bilingual and is read from Task 13 onward),
anonymous participants (login stays mandatory), session codes (the QR carries
the `sessionIdentity` GUID, as `design/domain-model.md` already assumes).

## Acceptance criteria

- [ ] Scanning the QR (or opening its payload) reaches login and returns to the
      participant lobby of that exact session
- [ ] A participant joining makes their name appear in the presenter and
      facilitator lists without reload; count matches roster size
- [ ] The facilitator can copy the join URL to the clipboard
- [ ] Names round-trip through the store (restart keeps them) and appear in no
      state that also carries votes or answers
- [ ] Every string on the three join screens plus the shared shells renders in
      both de and en; switching language does not change the URL or drop the
      session
- [ ] `phaseView` renders the Join screens for Phase 1 and the existing shell
      for every other phase, per role
- [ ] CI runs the full Playwright suite and fails the build when an e2e test
      fails

## Slices

1. i18n foundation + translate existing shared shells (+ e2e selector pinning)
2. Playwright job in CI, green on today's 16 tests
3. Display name end-to-end: claim → `Session.Join` → entity + migration →
   `RosterView` + presenter state, with the anonymity test widened deliberately
4. `phaseView` per role + participant lobby
5. Presenter QR + live joined list; facilitator roster + copy join URL + advance
6. Playwright: participant joins, name appears on presenter and facilitator

## Review decisions (Lavish, approved)

- **Q1 → A** In-house typed dictionary in `src/domain/i18n` plus a context
  hook. No new dependency, choice persisted in a cookie, URLs untouched.
- **Q2 → A** Names on presenter and facilitator; the presenter shows a list of
  the people who already joined.
- **Q3 → A** Client-side QR SVG from a maintained dependency.
- **Q4 → A** The whole Playwright suite runs in CI, restart spec included.
- **Presenter shows no readable URL**; the facilitator screen gets a
  copy-the-join-URL-to-clipboard control instead.

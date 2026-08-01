# Task 10: Session lifecycle + reconnect

## Problem

A session can only come into existence through a test calling
`SaveAsync(new Session(id), 0)`. There is no HTTP surface, no facilitator
passphrase, and no facilitator identity anywhere: `FacilitatorHub`
(`Adapters.Web/FacilitatorHub.cs:16`) hands full session control to any
authenticated `sub` that guesses a `sessionIdentity`. `IntentRejectionCode
.NotAuthorized` exists and is never produced. Reconnect works for
participants (roster + `LoadAllAsync`) but is unproven in a browser, and the
facilitator has no identity to restore.

`design/protocol.md` §2 already locks the contract: `POST /api/sessions` with
the passphrase in the body, 401 on a wrong one, and "the facilitator is the
`sub` recorded when creation was accepted; the facilitator hub refuses any
other `sub` with `NotAuthorized`". This task implements exactly that.

## Solution

1. **Domain** — `Session.Open(SessionIdentity, FacilitatorSubject,
   SessionName)` factory; `FacilitatorSubject` (record over the OIDC `sub`)
   and `SessionName` become session state. `Session.IsFacilitatedBy(subject)`
   is the authorization predicate. The existing `Session(SessionIdentity)`
   constructor goes away.
2. **Persistence** — `ISessionRepository.CreateAsync(Session)`, an explicit
   insert. `SaveAsync` stops inserting: a missing row is now a
   `ConcurrencyConflictException`, which closes the Task 9b latent gap where
   "row absent + expectedRevision 0" was indistinguishable from "row stored at
   revision 0". `sessions` gains `facilitator_subject` and `name` columns.
   A duplicate `identity` insert surfaces as `ConcurrencyConflictException`.
3. **Passphrase** — `FACILITATOR_PASSPHRASE` env var, bound to an options
   record, validated at startup: absent or empty fails the host fast rather
   than silently opening session creation. Comparison is
   `CryptographicOperations.FixedTimeEquals` over UTF-8 bytes. The value is
   never logged, never echoed, never sent to a client.
4. **Endpoint** — `POST /api/sessions`, bearer-authenticated (the token is
   what supplies the facilitator `sub`), body `{ sessionName, passphrase }`.
   Wrong or absent passphrase → `401`, no session created, no detail leaked.
   Accepted → `201` + `{ sessionIdentity }`, session persisted through
   `CreateAsync` with `revision = 0`.
5. **Hub authorization** — `FacilitatorHub.OnConnectedAsync` loads the session
   and aborts the connection when the caller `sub` is not the recorded
   facilitator. Participant and presenter hubs are untouched.
6. **Frontend** — `/facilitator` without a `sessionIdentity` renders the open
   session form (name + passphrase, `design/screens.md:80`); success navigates
   to `/facilitator?sessionIdentity=…`. The passphrase lives in component
   state only: no `localStorage`, no URL, no cookie, cleared on submit.
   Reconnect needs nothing stored — the URL carries the identity and the OIDC
   token carries the `sub`.

## Acceptance criteria

- [ ] Wrong or absent passphrase → `401`, and no row is written
- [ ] Accepted creation returns a `sessionIdentity` whose facilitator is the
      caller's `sub`, persisted at `revision = 0`
- [ ] A different `sub` on `/hub/facilitator` is refused; the recorded
      facilitator connects and receives full facilitator state
- [ ] Facilitator closes and reopens the tab → control restored from URL +
      token alone, no rejoin, nothing read from client storage
- [ ] Participant membership and facilitator identity both survive a backend
      restart
- [ ] Playwright: participant joins → facilitator advances a phase →
      presenter and participant re-render → backend restarts → all three
      clients reconnect and show identical state (the loop deferred from
      Task 9)

## Non-goals

- No facilitator hand-off, no second facilitator, no session transfer.
- No session listing, closing, or deletion endpoint.
- No participant-facing join UI beyond what exists (Task 12 owns QR + lobby).
- No wiring of Playwright into CI (Task 14 acceptance criterion).
- No password hashing scheme for the passphrase — it is a server-set shared
  secret compared in constant time, not a stored user credential.

## Decisions (approved)

1. **`sessionName` is persisted now** (`sessions.name`), for consumers that
   arrive later, instead of adding the column in a later task.
2. **Missing `FACILITATOR_PASSPHRASE` fails host startup.** It must be set;
   a misconfigured deploy must not look like a wrong passphrase.
3. **Playwright stays local in this task.** The reconnect smoke runs against
   `docker-compose.dev.yml`; the CI job is Task 14, whose acceptance criteria
   now name this suite explicitly.

## Slices

1. **Domain + persistence**: `FacilitatorSubject`, `SessionName`,
   `Session.Open`, `IsFacilitatedBy`, `CreateAsync`, the two new columns,
   `SaveAsync` insert path removed. `Domain.Tests` + `Adapters.Tests` incl.
   duplicate-create and save-without-row.
2. **Endpoint + passphrase**: options record with startup validation,
   fixed-time compare, `POST /api/sessions`, `Host.Tests` for 401 (wrong,
   absent, empty), 401 (no bearer), 201 + persisted facilitator.
3. **Facilitator authorization**: hub check + `NotAuthorized`,
   `Adapters.Tests` and `Host.Tests` for refused foreign `sub` and accepted
   owner, including after a restart.
4. **Frontend**: open-session form component + CSS module, session creation
   port/adapter, routing on success, Jest tests for validation, 401 handling,
   and "passphrase never persisted".
5. **E2E + docs**: Playwright reconnect/restart loop, `docker-compose.dev.yml`
   passphrase wiring, updates to `design/protocol.md`, `design/persistence.md`
   (new columns, create path), `tasks/todo.md`.

## Verification

`./scripts/ci-lint.sh`, `./scripts/ci-test.sh`, plus `npx playwright test`
against the dev compose stack for the multi-client reconnect loop.

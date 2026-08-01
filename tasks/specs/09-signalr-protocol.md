# Spec: Task 9 — SignalR Hub + Resync Protocol

## Objective

Define the FE/BE wire contract in `design/protocol.md`, then implement the
real-time transport: one SignalR hub per role with per-session groups; every
inbound client intent validated server-side against role and phase; every
connection (fresh or reconnected) is pushed the complete role-shaped workshop
state immediately. Frontend gets session-bound adapters behind per-concern
port slices.

Status: **approved by the user** (Lavish review, 3 rounds).

## Decisions (all locked)

1. **Full-state protocol, immediate push on connect.** The server never sends
   deltas or domain events. `OnConnectedAsync` pushes the full current
   role-shaped state to the calling connection right away (fresh connect and
   reconnect are the same code path — a reconnecting client never waits for
   the next mutation). Every accepted mutation then broadcasts the full
   role-shaped state to each role group. No client-side merging or ordering.
1b. **Periodic resend (self-healing sync).** A hosted background service
   resends the latest role state to each role group on a fixed interval so a
   dropped broadcast cannot leave a client stale. Every state record carries a
   monotonic `revision` (bumped per persisted mutation); clients ignore any
   state that is not newer, so a resend of unchanged state causes no re-render.
   Sessions without connections are skipped; mapped states are cached and
   re-mapped only when `revision` changes. **Interval: 500 ms**, configurable
   by environment variable (user decision: each client receives only one
   message per 500 ms and a few kB is affordable; raise the interval or switch
   to a tiny revision ping later if measurement demands it).
2. **Three hubs, one per role:** `FacilitatorHub` (`/hub/facilitator`),
   `ParticipantHub` (`/hub/participant`), `PresenterHub` (`/hub/presenter`).
   Authorization is a class-level attribute, not a runtime role check;
   presenter hub is anonymous and exposes no mutating method at all.
3. **Group naming:** `{role}:{sessionIdentity}` — one group per role per
   session. Each hub can only send its own role's state record type, so a
   client is structurally unable to receive data its role must not see
   (no client-side filtering, no shared payload type).
4. **Typed hub methods, not a stringly-typed envelope.** One method per
   intent, each taking one payload record; SignalR does the dispatch. All
   methods return `IntentResult` (`Accepted` | `Rejected(code, detail)`).
   A shared `IntentPipeline` in Application performs, in order:
   role check → session load → phase/domain guard → mutate → persist →
   broadcast (reuses `SessionCommandHandler`, so write-before-broadcast
   stays a single code path).
5. **Error model:** closed `IntentRejectionCode` enum (`WrongPhase`,
   `NotAuthorized`, `UnknownSession`, `InvariantViolated`, `MalformedPayload`,
   `UnknownParticipant`). Rejection never mutates and never broadcasts.
   Errors are returned to the caller only, never fanned out.
5b. **Naming:** the wire records are `FacilitatorWorkshopState`,
   `ParticipantWorkshopState`, `PresenterWorkshopState`; client callback
   `ReceiveWorkshopState`. "Snapshot" is not used. Requires renaming the
   existing `Domain/WorkshopState` (holds only `CurrentPhase`) to
   `PhaseProgress`.
6. **Payload validation:** BE validates every payload (records + guard
   clauses, `MalformedPayload` on failure); FE validates inbound snapshots
   with Zod at the adapter boundary before they enter the app.
7. **Scope of implementation in this task:** the *catalog* in
   `design/protocol.md` is complete (all transitions from
   `design/state-machine.md`), but only the intents whose domain logic exists
   today are wired: `JoinSession` (participant) and `AdvancePhase`
   (facilitator), plus snapshot delivery for all three roles. Tasks 10–19 add
   their own intents + port slices as they implement their domain logic. No
   dead placeholder handlers or unused port slices.
8. **FE session binding:** a per-role dependency context (React context
   created on screen entry) creates one session-bound connection and builds
   **one small adapter per port slice** on top of it (no god adapter per
   role). `sessionId` lives only in the context factory — never in ports,
   domain, or UI props.
9. **Port slices** replace the Task-1 placeholder `<Role>Gateway` stubs. This
   task creates only: `participant/joinPort`, `participant/sessionStatePort`,
   `facilitator/lifecyclePort`, `facilitator/sessionStatePort`,
   `presenter/sessionStatePort`. Slice names for later concerns are listed in
   `design/protocol.md` but not created yet.
10. **RxJS, two strict layers:** `signalRConnection.ts` is a pure wrapper —
    it maps `@microsoft/signalr` promises/callbacks to
    `Single`/`Completable`/`Observable` and knows nothing about the domain.
    Adapters sit on top and hold all our logic. Workshop state surfaces as a
    replay-1 `Observable<…WorkshopState>`; intents return
    `Single<IntentResult>`; connection state is
    `Observable<ConnectionState>`. Automatic reconnect with backoff; the
    server's `OnConnectedAsync` push covers resync.
11. **New dependency (ask):** `@microsoft/signalr` (FE). BE SignalR comes
    from the existing ASP.NET Core framework reference.

## Detail decided while writing `design/protocol.md`

- `OpenSession` (T1) is `POST /api/sessions`, not a hub method — no session
  exists yet to bind a session-bound connection to.
- `JoinSession` (T4) / resume (T3) are implicit on participant connect. Late
  joining is allowed in every phase (user decision during the protocol
  review); from phase 5 on the joiner is placed into the group with the
  fewest members (T4a `AddParticipantToGroup`, I8).
- Facilitator state carries `enabledIntents` so guard logic exists only on the
  server (no duplicated phase rules in the frontend).
- `revision` is a persisted session column (`design/persistence.md` § 2) and is
  bumped inside the single write-before-broadcast path.
- Wire carries identifiers only; the frontend localizes from `config/*.json`.
  Group names are animal identifiers. Action texts travel verbatim.

## Deliverables

- `design/protocol.md` — intent catalog (per role, payload schema, guard,
  rejection codes), snapshot schemas per role with the anonymity argument,
  error model, sequence diagrams (join · advance phase · reconnect · backend
  restart · vote+tiebreak), and the port-slice map.
- BE: three hubs + per-role state mappers in `Adapters.Web`; intent pipeline,
  intent records and role state records (with `revision`) in `Application`;
  `SignalRBroadcaster` (`IBroadcaster`), periodic resend hosted service, Host
  wiring replacing `NoOpBroadcaster`.
- FE: `signalRConnection.ts` wrapper, per-slice session-bound adapters, port
  slices, role dependency contexts; stub gateways deleted.

## Acceptance criteria

- [ ] `design/protocol.md` covers every transition in
      `design/state-machine.md`; all three role state schemas specified
- [ ] Invalid or out-of-phase intent → typed rejection, state unchanged,
      nothing persisted, nothing broadcast (proven by test)
- [ ] Fresh connection and reconnect are both pushed the complete current
      state immediately, caller-only
- [ ] A dropped broadcast self-heals: with no further mutations, every
      connected client converges within one resend interval
- [ ] Presenter connection cannot invoke any mutating hub method
- [ ] No `sessionId` in domain, UI props, or port signatures (arch/lint test)
- [ ] Gates green: BE + FE tests, coverage ≥ 80 %, lint, arch, complexity,
      duplication

## Verification

BE: hub unit tests (fake clients) + integration test over
`WebApplicationFactory` with a real SignalR client (connect → snapshot →
intent → broadcast → reject). FE: marble tests for the adapter and port
slices, Zod schema tests. E2E: Playwright smoke — participant joins,
facilitator advances phase, presenter and participant both re-render;
kill/restart backend → clients reconnect and show identical state.

## Slices

1. `design/protocol.md` (doc only, user-reviewed before code)
2. BE role state records + per-role mappers (Application) + anonymity tests
3. BE `IntentPipeline` + rejection model + tests (no transport yet)
4. BE three hubs + `SignalRBroadcaster` + Host wiring + hub tests
5. BE integration test: real SignalR client through the full loop
5b. BE periodic resend service + `revision` counter + tests
6. FE `signalRConnection.ts` wrapper + Zod schemas + marble tests
7. FE port slices + per-slice adapters + role dependency contexts;
   delete stub gateways
8. E2E smoke: session-less links, hub rejection of missing/forged tokens,
   and a BE restart test proving a reconnecting client is pushed the state
   that survived

## Deferred to Task 10

A committed browser smoke of join → advance → reconnect needs a session that
exists, and nothing can create one until `POST /api/sessions` lands in Task 10.
The full browser loop was run manually against the dev stack in this task
(presenter live phase, facilitator advance mirrored to the presenter, backend
kill → `reconnecting` → restart → `connected` with the persisted phase) and is
committed as an automated Playwright spec in Task 10.

`joinPort` was dropped: joining is implicit on connect, so `design/protocol.md`
§7 lists only the four port slices that were built.

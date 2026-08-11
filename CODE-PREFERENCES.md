# Code Preferences

Design preferences the repo owner has stated in review. Read before writing
code; each rule below already cost at least one review round, and ⟲ marks the
ones the reviewer had to repeat.

Frontend-specific consequences of these same preferences live in
`frontend/FE-IMPLEMENTATION-RULES.md`.

## Make impossible states impossible ⟲

No nullable field that is really a mutually exclusive variant, no `string`
parameter where a value object exists, no optional count meaning "not
configured yet". Model variants as a closed set — C#: an interface with one
implementation per case, or sealed records plus JSON polymorphism; TS: a
discriminated union — and model absence as absence, e.g. no registry entry,
rather than as `null`.

## Names must not lie

A name states what has been *established*, not what is hoped: never wrap an
unverified caller in a `FacilitatorSubject`. Prefer the concrete word over the
vague one (`facilitator` or `caller`, never `actor`; `IsQuizComplete`, not
`IsWalkComplete`), and name so the call site reads as a sentence:
`session.IsFacilitatedBy(facilitator)`.

## Library names never leak past their wrapper ⟲

Exactly one file imports a third-party client library, and it is dumb and thin
— a method-for-method mapping, no logic. Everything else speaks the domain
abstraction (`WebsocketConnection`, not `signalRConnection`), so the library is
replaceable without touching a second file.

## Prefer the boring construction ⟲

An interface with three implementations beats an abstract record hierarchy;
`useRef` plus `useEffect` beats a bespoke lifecycle helper. Code that does
nothing — no-op parameters, pass-through wrappers, defaults that paper over
missing config — gets deleted, not justified. Fewer layers to read is itself a
requirement, for humans and for agents.

## Messages explain themselves ⟲

Exception and user-facing text never carries spec or invariant tags like
`(I2)` or `(I6)` — the reader of the message does not have the spec. Write
the rule out instead: "Each participant submits a value selection exactly
once." The invariant number belongs in the spec and in test names, not on
the wire.

## A port is named as one ⟲

A field, prop or variable holding a port ends in `Port`:
`sessionStatePort`, `quizPort`, `selectionPort`. A bare `quiz` or
`sessionState` next to state objects reads as data and misleads the reader
about what is being passed.

## Repeating a reached state is a no-op

Re-applying an already-applied transition — revealing an answer that is
revealed, showing a learning text that is shown — does nothing; it does not
throw. Exceptions are reserved for genuine invariant violations, such as
resubmitting a data-bearing submission, never for idempotent repeats of a
state the session has already reached.

## One concern per file

Adapters do not read environment variables and do not carry config fallbacks;
auth and token types live in their own namespace, not in the host.

## Nothing unrelated in the diff

An incidental change to tooling, scripts or config is either its own commit
with a stated reason, or it does not ship.

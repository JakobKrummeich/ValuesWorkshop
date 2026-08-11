# Frontend Implementation Rules

## RxJS-First Reactive Architecture

Use RxJS observables instead of raw Promises everywhere inside the application.
Promise-based external APIs (e.g. `oidc-client-ts`, `fetch`) get a **thin
adapter wrapper** that converts `Promise → Observable` at the boundary. All
internal code consumes and returns observables.

- Wrappers live in `src/adapters/` and are the only place `defer()`
  converts promises to observables (`defer()` alone is sufficient — no
  `from()` wrapping needed).
- **No `async`/`await` inside `defer()` callbacks.** Return the promise
  chain directly with `.then()`/`.catch()`:

  ```typescript
  // YES — promise chain
  export function getAuthenticatedUser(): Maybe<User> {
    return defer(() =>
      getUserManager()
        .getUser()
        .then((user) => (user && !user.expired ? user : null)),
    ).pipe(filter((user): user is User => user !== null));
  }

  // NO — async/await
  export function getAuthenticatedUser(): Maybe<User> {
    return defer(async () => {
      const user = await getUserManager().getUser();
      return user && !user.expired ? user : null;
    }).pipe(filter((user): user is User => user !== null));
  }
  ```

- **No `catchError` directly before `subscribe`** — use the `error`
  callback in the `subscribe` block instead.
- **Never catch only to rethrow.** `catch` is for _handling_. If all you want
  is a side effect on failure, use `tap({ error })` and let the error flow.
- **No arrow wrapping a `defer`.** `() => defer(() => x)` is just
  `defer(() => x)` — `defer` already defers the work to subscribe time, so the
  outer factory buys nothing.
- **One file per third-party client library.** That file is the only place the
  library name appears; it is a dumb method-for-method mapping from promises
  to `Single`/`Maybe`/`Completable` with no logic of its own. Everything else
  imports the domain-named abstraction (`WebsocketConnection`, `http.ts`), so
  the library is replaceable without touching a second file.
- **Promises live only in that one wrapper.** `fetch` included — it is wrapped
  in `http.ts` and adapters consume the observable surface, never `fetch`
  directly. An adapter that mixes promise and observable style is a defect.
- **No `$` suffix** — on any name (functions, variables, Subjects). Use
  plain descriptive names. The type system already distinguishes
  `Observable<T>` from `T`.
- **Never use `Observable<void>`.** Use the type aliases from
  `src/shared/reactiveTypes.ts`:
  - `Completable` (`Observable<never>`) — emits nothing, just completes or
    errors.
  - `Single<T>` (`Observable<T>`) — emits exactly one value, then completes.
  - `Maybe<T>` (`Observable<T>`) — emits zero or one value, then completes.
    Use instead of `Single<T | null>` — the "absent" case is represented
    by completing empty, not by emitting `null`.
- Components subscribe via domain-specific hooks (e.g. `useAuthGuard`,
  `useAuthCallback`).
- **Test hooks** with `renderHook` and RxJS primitives (`Subject`, `NEVER`,
  `throwError`) for full branch coverage.
- Promise-based tests are acceptable only for adapter wrapper tests that
  verify the promise→observable boundary itself.

## Enums Over String Unions

Use TypeScript `enum` (not string union types) for finite sets of named
constants:

```typescript
// YES
enum AuthState {
  Checking = "checking",
  Authenticated = "authenticated",
  Redirecting = "redirecting",
  Error = "error",
}

// NO
type AuthState = "checking" | "authenticated" | "redirecting" | "error";
```

Wire intent and hub method names at call sites come from the shared enums
(`FacilitatorIntent`, `ParticipantIntent`) — never string literals like
`invokeIntent(connection, "RevealAnswer")`.

## Runtime Validation with Zod

Use [Zod](https://zod.dev) to validate `unknown` data at program boundaries
(API responses, OIDC state, URL params, external messages). Parse, don't
assert:

```typescript
// YES — validated with fallback
const returnUrl = z.string().startsWith("/").catch("/").parse(raw);

// NO — manual type narrowing
const returnUrl = typeof raw === "string" && raw.startsWith("/") ? raw : "/";
```

For `catch` blocks (which always yield `unknown`), use the shared
`errorMessage()` utility from `src/shared/errorMessage.ts` instead of
inline `instanceof` checks.

## Design Tokens

Every visual property — color, spacing, font, radius, shadow — **must** use
the CSS custom properties defined in `src/app/tokens.css` (base tokens) and
the per-screen token layers (`tokens.facilitator.css`, etc.).

Hardcoded values like `1rem`, `100vh`, `center` for layout are fine.
Hardcoded colors, font sizes, spacing values, or shadows are **not** — use
the token variables (`var(--space-gutter)`, `var(--color-text-muted)`, etc.).

## CSS Modules

One co-located `Component.module.css` per component (restated from
`AGENTS.md`). No inline `style={}` props — use CSS module classes. No shared
or global component stylesheets beyond `tokens.css` and `globals.css`.

## Hooks

Reach for plain React state first. `useState` is the default; a `useRef` plus a
cleanup `useEffect` is the default for holding a subscription. Introduce a
custom abstraction only when a concrete second use site exists — a hook that
wraps state in machinery no caller needs is deleted in review.

```typescript
const subscriptionRef = useRef<Subscription | null>(null);
useEffect(() => () => subscriptionRef.current?.unsubscribe(), []);
```

## Component Structure

Every non-trivial React component is split into three files:

1. **`Component.module.css`** — styling (CSS module)
2. **`Component.tsx`** — markup, imports the CSS module and the hook
3. **`useComponent.ts`** — hook containing all UI logic (state, effects,
   derived values, callbacks)

The `.tsx` file is a thin rendering shell — it calls the hook and maps
the returned values to JSX. All logic lives in the hook.

- A screen with distinct visual regions (a chip grid, a dialog, a list) is
  composed of subcomponents — each region gets its own `Component.tsx` +
  `Component.module.css` (+ `useComponent.ts` when it has logic of its own).
  One large component covering several regions is split in review.
- A `.tsx` file defines nothing but the component itself: no module-level
  helper functions, no event-handling logic beyond calling handlers the hook
  returned. If a keydown/focus/derivation helper wants to live next to the
  JSX, it belongs in the hook instead.

### Testing

- **Hook test** (`__tests__/useComponent.test.ts`) — thorough: tests all
  logic branches, edge cases, error paths. Uses `renderHook` with RxJS
  primitives (`Subject`, `NEVER`, `throwError`).
- **Component test** (`__tests__/Component.test.tsx`) — superficial: mocks
  the hook, verifies the JSX renders the hook's return values correctly.

### Other rules

- `"use client"` only when the component uses hooks, browser APIs, or event
  handlers.
- Default exports for Next.js pages/layouts. Named exports for everything else.
- Keep components under 300 lines (enforced by eslint `max-lines`).

## Testing

- Test files live in a `__tests__/` directory at the same level as the file
  under test: `Component.tsx` → `__tests__/Component.test.tsx`.
- Use `@testing-library/react` for component tests.
- Use `renderHook` with RxJS primitives (`Subject`, `NEVER`, `throwError`)
  for hook tests involving observables.
- Run FE tests: `cd frontend && pnpm jest --passWithNoTests`.
- `window.location` can't be redefined in jsdom v30 — extract navigation
  helpers (like `navigateReplace`) into adapters for mocking.

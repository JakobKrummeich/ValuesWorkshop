# Frontend Implementation Rules

## RxJS-First Reactive Architecture

Use RxJS observables instead of raw Promises everywhere inside the application.
Promise-based external APIs (e.g. `oidc-client-ts`, `fetch`) get a **thin
adapter wrapper** that converts `Promise → Observable` at the boundary. All
internal code consumes and returns observables.

- Wrappers live in `src/adapters/` and are the only place `from()` /
  `defer()` converts promises to observables.
- Components subscribe via hooks (e.g. a `useObservable` hook or similar).
- **Test with marble diagrams** (`rxjs/testing` `TestScheduler`) — marble
  tests are the default for any logic involving observables.
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

## Component Structure

Every non-trivial React component is split into three files:

1. **`Component.module.css`** — styling (CSS module)
2. **`Component.tsx`** — markup, imports the CSS module and the hook
3. **`useComponent.ts`** — hook containing all UI logic (state, effects,
   derived values, callbacks)

The `.tsx` file is a thin rendering shell — it calls the hook and maps
the returned values to JSX. All logic lives in the hook.

### Testing

- **Hook test** (`__tests__/useComponent.test.ts`) — thorough: tests all
  logic branches, edge cases, error paths. Uses `renderHook` or marble
  tests.
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
- Use RxJS marble tests (`TestScheduler`) for observable logic.
- Run FE tests: `cd frontend && pnpm jest --passWithNoTests`.
- `window.location` can't be redefined in jsdom v30 — extract navigation
  helpers (like `navigateReplace`) into adapters for mocking.

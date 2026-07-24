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

Enums provide:

- A runtime object for iteration and reverse lookup.
- A single source of truth importable as both type and value.
- Better refactoring support (rename symbol vs. find-replace string).

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

## Component Files

- `"use client"` only when the component uses hooks, browser APIs, or event
  handlers.
- Default exports for Next.js pages/layouts. Named exports for everything else.
- Keep components under 300 lines (enforced by eslint `max-lines`).

## Testing

- Co-locate test files: `Component.test.tsx` next to `Component.tsx`.
- Use `@testing-library/react` for component tests.
- Use RxJS marble tests (`TestScheduler`) for observable logic.
- Run FE tests: `cd frontend && pnpm jest --passWithNoTests`.
- `window.location` can't be redefined in jsdom v30 — extract navigation
  helpers (like `navigateReplace`) into adapters for mocking.

## Lint Rules

All `react-hooks/*` rules are set to `error` severity. This includes
`exhaustive-deps`, `rules-of-hooks`, `refs`, and all other React hooks
rules. Never downgrade these.

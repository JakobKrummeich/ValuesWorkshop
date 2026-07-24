# Spec: Task 8a — RxJS Migration + Component Structure Refactor

## Objective

Convert auth code from Promise-based to RxJS-first per `FE-IMPLEMENTATION-RULES.md`.
Split components into hook/tsx/css pattern. Result: all auth flows are observable-based,
tested with marble diagrams, and components are thin rendering shells.

## Two Parts

### Part 1: Component Structure Refactor

Extract hooks from AuthGuard and AuthCallbackPage:

| File | Role |
|---|---|
| `src/app/useAuthGuard.ts` | Hook: all auth-check + redirect logic |
| `src/app/AuthGuard.tsx` | Thin shell: call hook, render |
| `src/app/AuthGuard.module.css` | (unchanged) |
| `src/app/auth/callback/useAuthCallback.ts` | Hook: callback processing logic |
| `src/app/auth/callback/page.tsx` | Thin shell: call hook, render |
| `src/app/auth/callback/CallbackPage.module.css` | (unchanged) |

Hook returns: state values needed for rendering. Component maps to JSX.

### Part 2: RxJS Migration

1. Install `rxjs` as dependency
2. Refactor `authAdapter.ts` — export observables instead of promises:
   - `getAuthenticatedUser$()` → `Observable<User | null>`
   - `loginRedirect$()` → `Observable<void>`
   - `handleCallback$()` → `Observable<User>`
   - `getAccessToken$()` → `Observable<string | null>`
   - `logout$()` → `Observable<void>`
   - `navigateReplace()` stays sync (not promise-based)
   - Use `defer(() => from(...))` pattern — lazy, cold observables
   - These are the ONLY place `from()`/`defer()` appear
3. Hooks subscribe to observables (no raw `async`/`await` in non-adapter code)
4. Adapter tests stay promise-based (testing the boundary)
5. Hook tests use `TestScheduler` marble diagrams
6. Component tests mock hooks (unchanged pattern)

## Acceptance Criteria

- [ ] AuthGuard split: `useAuthGuard.ts` + `AuthGuard.tsx` + `AuthGuard.module.css`
- [ ] AuthCallbackPage split: `useAuthCallback.ts` + `page.tsx` + `CallbackPage.module.css`
- [ ] Hook tests cover all logic branches (marble tests)
- [ ] Component tests mock hooks, verify rendering only
- [ ] `authAdapter.ts` exports observables, not promises
- [ ] `from()`/`defer()` only in adapter layer
- [ ] Zero raw `Promise`/`async`/`await` in non-adapter FE code
- [ ] All tests green: `cd frontend && pnpm jest --passWithNoTests`
- [ ] All lint gates pass: `./scripts/ci-lint.sh`

## Task Breakdown

1. Install rxjs
2. Refactor `authAdapter.ts` to export observables (keep promise internals, wrap with `defer`/`from`)
3. Update adapter tests for observable API
4. Extract `useAuthGuard.ts` hook (subscribes to observables)
5. Thin out `AuthGuard.tsx`
6. Add `useAuthGuard` marble tests
7. Simplify `AuthGuard.test.tsx` to mock hook
8. Extract `useAuthCallback.ts` hook (subscribes to observables)
9. Thin out callback `page.tsx`
10. Add `useAuthCallback` marble tests
11. Simplify `callback.test.tsx` to mock hook
12. Verify all gates pass

## Verification

```bash
cd frontend && pnpm jest --passWithNoTests
./scripts/ci-lint.sh
```

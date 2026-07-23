# Task 8 — OIDC Auth End-to-End

## Objective

Facilitator and participant screens require OIDC login; presenter stays
unauthenticated. Backend rejects unauthenticated API/hub requests (except
health + presenter endpoints). Config is environment-driven — swap
authority/audience/clientId for Azure AD in prod, no code changes.

## Architecture Fit

Auth is **infrastructure**, not domain. No domain ports needed.

| Layer | Where auth lives |
|---|---|
| BE Host | JWT Bearer middleware + CORS in `Program.cs` |
| FE adapters | `authAdapter.ts` wrapping `oidc-client-ts` |
| FE app | `AuthGuard` component used by facilitator + participant layouts; callback route |
| Dev tooling | `devtools/oidc/` configured with clients, users, JWT access tokens |

Dependency flow: `app/ → adapters/authAdapter → oidc-client-ts (npm)`.
No domain dependency. No new dep-cruiser violations.

## Dev OIDC Provider (`devtools/oidc/`)

Current state: bare `oidc-provider` with no clients/users configured.

Configure:
- **Issuer:** `http://localhost:9000` (browser-reachable; backend fetches
  discovery from `http://oidc:9000` via separate metadata URL)
- **Client:** `valuesworkshop` — public client (`token_endpoint_auth_method:
  "none"`), authorization_code + PKCE, redirect URI
  `http://localhost:3000/auth/callback`
- **JWT access tokens:** configure `formats.AccessToken = 'jwt'` so backend
  can validate without introspection
- **Refresh tokens:** enable `features.revocation` and grant type
  `refresh_token` so `oidc-client-ts` can silently refresh before access
  token expiry. Access token TTL ~10 min, refresh token TTL ~3 hr
  (covers full workshop with margin). `automaticSilentRenew` in the
  FE adapter handles this transparently
- **Test accounts:** `findAccount` returns claims for hardcoded users:
  `facilitator` (sub + name), `participant1`–`participant5` (sub + name)
- **Dev interactions:** enable `features.devInteractions` for built-in
  login/consent UI (Playwright can drive it)
- **Allow HTTP:** `features.allowOmittingSingleRegisteredRedirectUri`,
  disable HTTPS enforcement for dev

## Backend Changes

### Host project (`ValuesWorkshop.Host`)

Add `Microsoft.AspNetCore.Authentication.JwtBearer` NuGet package.

`Program.cs` additions:
```
1. JWT Bearer authentication:
   - Authority = env OIDC_AUTHORITY (issuer URL, e.g. http://localhost:9000)
   - MetadataAddress = env OIDC_METADATA_URL (internal URL for key fetch,
     e.g. http://oidc:9000/.well-known/openid-configuration)
   - Audience = "valuesworkshop-api" (or skip audience validation for dev
     simplicity — configurable)
   - RequireHttpsMetadata = false (dev; prod overrides via config)
   - TokenValidationParameters.ValidateAudience = false for now
     (audience in dev oidc-provider is tricky; revisit when Azure AD added)

2. CORS policy:
   - Allow origin http://localhost:3000 (env-driven: CORS_ORIGINS)
   - Allow Authorization header, credentials

3. Authorization:
   - app.UseAuthentication() + app.UseAuthorization()
   - Default policy: require authenticated user
   - Endpoints "/" and "/health" allow anonymous
   - Future presenter endpoints will also allow anonymous
```

### No Adapters changes

OIDC validation is standard ASP.NET Core middleware — no custom adapter
needed. The adapter split (Adapters.Persistence vs Adapters.Web) remains
deferred to Task 9.

## Frontend Changes

### New dependency: `oidc-client-ts`

Client-side OIDC library. Handles authorization code + PKCE flow, token
storage, silent renew. Clean adapter — no framework coupling.

### `src/adapters/authAdapter.ts`

Exports a configured `UserManager` instance:
- Authority: `NEXT_PUBLIC_OIDC_AUTHORITY` (env)
- Client ID: `NEXT_PUBLIC_OIDC_CLIENT_ID` (env)
- Redirect URI: `NEXT_PUBLIC_OIDC_REDIRECT_URI` (env, default `/auth/callback`)
- Response type: `code`
- Scope: `openid profile`
- `automaticSilentRenew: true` (uses refresh token to renew before expiry)
- `includeIdTokenInSilentRenew: false`
- `userStore`: sessionStorage (survives refresh, clears on tab close —
  appropriate for 2-hour workshop)

Also exports helper functions:
- `getAuthenticatedUser()` — returns User or null
- `loginRedirect(returnUrl)` — triggers OIDC redirect
- `handleCallback()` — processes callback, returns User
- `getAccessToken()` — returns current access token string or null

### `src/app/auth/callback/page.tsx`

Client component. On mount: calls `handleCallback()`, then redirects to
the stored return URL (or `/`). Shows loading indicator during processing.

### `src/app/AuthGuard.tsx`

Client component wrapping children:
1. On mount, check `getAuthenticatedUser()`
2. If authenticated → render children
3. If not → call `loginRedirect(currentPath)` (saves return URL, redirects
   to OIDC provider)
4. While checking → render loading state

### Layout changes

- `facilitator/layout.tsx`: wrap content in `<AuthGuard>`
- `participant/layout.tsx`: wrap content in `<AuthGuard>`
- `presenter/layout.tsx`: **no change** (unauthenticated)

### Environment variables

Added to `frontend/` `.env.local` (dev defaults) and docker-compose:
```
NEXT_PUBLIC_OIDC_AUTHORITY=http://localhost:9000
NEXT_PUBLIC_OIDC_CLIENT_ID=valuesworkshop
NEXT_PUBLIC_OIDC_REDIRECT_URI=http://localhost:3000/auth/callback
```

## Docker Compose Changes

```yaml
backend:
  environment:
    OIDC_AUTHORITY: http://localhost:9000
    OIDC_METADATA_URL: http://oidc:9000/.well-known/openid-configuration
    CORS_ORIGINS: http://localhost:3000

frontend:
  environment:
    NEXT_PUBLIC_OIDC_AUTHORITY: http://localhost:9000
    NEXT_PUBLIC_OIDC_CLIENT_ID: valuesworkshop
    NEXT_PUBLIC_OIDC_REDIRECT_URI: http://localhost:3000/auth/callback
```

The issuer split (browser-reachable `localhost:9000` vs docker-internal
`oidc:9000`) is solved by separate `OIDC_AUTHORITY` (issuer validation) and
`OIDC_METADATA_URL` (key/discovery fetch) on the backend.

## Testing

### BE unit tests (`Host.Tests`)

- **Auth rejection test:** TestServer with JWT Bearer configured; request
  without token → 401. Request with valid token → 200. Health endpoint → 200
  without token.
- Use `WebApplicationFactory<T>` for integration tests.
- Mock OIDC discovery or use in-memory token generation for test isolation.

### FE unit tests (Jest)

- **AuthGuard test:** mock `authAdapter`, verify redirect called when no user,
  verify children rendered when user present.
- **Callback page test:** mock `handleCallback`, verify redirect after
  processing.

### Playwright e2e

First Playwright setup in the project:
- `e2e/` directory at repo root (shared across FE+BE)
- `playwright.config.ts` pointing at `http://localhost:3000` (assumes
  docker compose running)
- **Login smoke test:** navigate to `/facilitator` → redirected to OIDC
  login → fill account field → submit → consent → arrive at facilitator
  page
- **Presenter no-auth test:** navigate to `/presenter` → page loads
  without redirect
- **API rejection test:** fetch `/` with no token from Playwright → 200
  (anonymous-allowed); fetch a protected endpoint → 401

## Task Breakdown

1. **Dev OIDC provider configuration** — clients, users, JWT access tokens,
   dev interactions
2. **Backend JWT Bearer + CORS** — Host changes, env-driven config
3. **Backend auth integration tests** — Host.Tests with WebApplicationFactory
4. **Frontend auth adapter + AuthGuard** — oidc-client-ts, adapter, guard
   component, callback page, layout wiring
5. **Frontend unit tests** — AuthGuard + callback tests
6. **Playwright setup + login smoke** — e2e directory, config, login test
7. **Docker compose env updates** — wire all env vars, verify full flow

## Decisions

- **One OIDC client for both roles.** Facilitator vs participant is a
  session-level distinction (password-gated creation), not an auth-level one.
- **`oidc-client-ts` over `next-auth`** for FE. Direct access to JWT access
  token (needed for SignalR in Task 9). Clean adapter pattern. No server-side
  session layer.
- **Skip audience validation initially.** Dev `oidc-provider` audience
  config is finicky. Backend **does** validate all other JWT properties:
  signature (not tampered), expiry (`exp`), not-before (`nbf`), and
  issuer (`iss`). Only `aud` (audience) validation is deferred because
  dev `oidc-provider` audience config requires resource indicators
  setup. Audience validation added when Azure AD is configured.
- **`sessionStorage` for token persistence.** Survives page refresh, clears
  on tab close. 2-hour workshop doesn't need long-lived sessions.

## Success Criteria

1. Unauthenticated request to BE protected endpoint → 401
2. `/health` and `/` → 200 without token
3. Facilitator page → OIDC login redirect when not authenticated
4. Participant page → OIDC login redirect when not authenticated
5. Presenter page → loads without any auth redirect
6. After login against dev provider → user reaches their screen
7. Authority/clientId are environment-driven (no code changes for Azure AD)
8. Playwright login smoke passes

## Open Questions

None — all decisions made above.

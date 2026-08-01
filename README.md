# ValuesWorkshop

Facilitated ~2h workshop (up to ~30 participants) that produces company
values and pragmatic everyday actions. See `SPEC.md` for the product spec.

## Layout

| Path | What |
|---|---|
| `frontend/` | Next.js app — `src/{domain,adapters,app}`; screen groups `app/{facilitator,participant,presenter}/`, each with its own DI context |
| `backend/` | ASP.NET Core — `Domain` ← `Application` ← `Adapters.Persistence` / `Adapters.Web` ← `Host` (hexagonal; ports in `Domain`) |
| `e2e/` | Playwright end-to-end tests |
| `config/` | Workshop content: `values.json`, `quiz.json`, `animals.json` (all texts `de` + `en`) |
| `devtools/oidc/` | Local OIDC provider for development (`node devtools/oidc`) |
| `design/` | Architecture, domain model, persistence, protocol, state machine, screens |
| `tasks/` | Plan, backlog, per-task mini-specs |

## Commands

```sh
pnpm --dir frontend dev|test|lint          # frontend
dotnet build backend/ValuesWorkshop.sln    # backend (prod + analyzers, no test projects)
dotnet test backend/ValuesWorkshop.Tests.slnf
node devtools/oidc                         # OIDC discovery on :9000
docker compose -f docker-compose.dev.yml up  # all services (backend :5000, frontend :3000, oidc :9000)
scripts/verify-startup.sh                  # native start + health check gate
scripts/ci-lint.sh                         # all lint gates
scripts/ci-test.sh                         # all test gates
```

## End-to-end tests

Playwright drives real browsers against the compose stack. The config has no
`webServer` block, so bring the stack up first; the suite is deliberately not
wired into CI yet (Task 14 owns that).

```sh
docker compose -f docker-compose.dev.yml up -d --build   # wait for backend healthy
npx playwright test                                      # whole suite
npx playwright test sessionLifecycle                     # one spec
docker compose -f docker-compose.dev.yml down            # add -v to drop the database
```

`e2e/sessionLifecycle.spec.ts` restarts the backend container mid-suite, so
Playwright runs with one worker; `retries` stays `0`.

Two things bite when the stack is stale: the frontend image inlines the
`NEXT_PUBLIC_*` values at build time (compose passes them as build args), so
changing them needs `up -d --build`; and `EnsureCreated()` never migrates, so
a schema change needs `down -v` before the next `up`.

## Backend configuration

| Variable | Required | Dev value |
|---|---|---|
| `FACILITATOR_PASSPHRASE` | yes — the host refuses to start without it | `dev-facilitator-passphrase` |
| `DATA_DIR` | no (`data`) | `/data` in compose |
| `OIDC_AUTHORITY` / `OIDC_METADATA_URL` | no | `http://localhost:9000` |
| `CORS_ORIGINS` | no | `http://localhost:3000` |
| `STATE_RESEND_INTERVAL_MS` | no (`500`) | `500` |
| `SESSION_CREATION_ATTEMPTS_PER_WINDOW` | no (`5`) | `5` |
| `SESSION_CREATION_ATTEMPT_WINDOW_SECONDS` | no (`60`) | `60` |

The dev passphrase is a local development value only; a real deployment sets
its own secret through the environment. Session creation is rate limited per
caller (the token `sub`, or the remote IP address when there is none):
attempts beyond the window get `429` without the passphrase being compared.

Layer mapping FE ↔ BE and architecture rules: `design/architecture.md`.

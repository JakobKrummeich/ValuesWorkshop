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

## Backend configuration

| Variable | Required | Dev value |
|---|---|---|
| `FACILITATOR_PASSPHRASE` | yes — the host refuses to start without it | `dev-facilitator-passphrase` |
| `DATA_DIR` | no (`data`) | `/data` in compose |
| `OIDC_AUTHORITY` / `OIDC_METADATA_URL` | no | `http://localhost:9000` |
| `CORS_ORIGINS` | no | `http://localhost:3000` |
| `STATE_RESEND_INTERVAL_MS` | no (`500`) | `500` |

The dev passphrase is a local development value only; a real deployment sets
its own secret through the environment.

Layer mapping FE ↔ BE and architecture rules: `design/architecture.md`.

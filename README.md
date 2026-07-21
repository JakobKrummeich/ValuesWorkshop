# ValuesWorkshop

Facilitated ~2h workshop (up to ~30 participants) that produces company
values and pragmatic everyday actions. See `SPEC.md` for the product spec.

## Layout

| Path | What |
|---|---|
| `frontend/` | Next.js app — `src/{domain,ports,adapters,app}`; screen groups `app/{facilitator,participant,presenter}/`, each with its own DI context |
| `backend/` | ASP.NET Core — `Domain` ← `Application` ← `Adapters` ← `Host` (hexagonal; ports in `Application/Ports/`) |
| `config/` | Workshop content: `values.json`, `quiz.json`, `animals.json` (all texts `de` + `en`) |
| `devtools/oidc/` | Local OIDC provider for development (`node devtools/oidc`) |
| `design/` | Domain model, state machine, screens |
| `tasks/` | Plan, backlog, per-task mini-specs |

## Commands

```sh
pnpm --dir frontend dev|test|lint          # frontend
dotnet build backend/ValuesWorkshop.sln    # backend, prod projects only
dotnet test backend/ValuesWorkshop.Tests.slnf
node devtools/oidc                         # OIDC discovery on :9000
```

Layer mapping FE ↔ BE and architecture rules: `tasks/specs/04-scaffold.md`
(moves to `design/architecture.md` in Task 4).

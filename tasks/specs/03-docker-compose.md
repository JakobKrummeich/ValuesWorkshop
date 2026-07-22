# Spec: Task 3 — Docker Compose + Verify-Startup Script

## Objective

One-command local dev stack (`docker compose up`) and an agent-verifiable
non-Docker startup gate (`scripts/verify-startup.sh`). Proves OR-Tools native libs
load in the container image and SQLite persistence volume works — de-risking
Tasks 7 and 17 early.

## Deliverables

### 1. Dockerfiles

**`backend/Dockerfile`** — multi-stage:
- Build stage: `mcr.microsoft.com/dotnet/sdk:10.0-preview` (matches .NET 10
  preview used by project). Restore → publish `Host` project.
- Runtime stage: `mcr.microsoft.com/dotnet/aspnet:10.0-preview`.
  OR-Tools native libs must load (Google.OrTools NuGet pulls them; verify
  at container startup via a diagnostic log line).

**`frontend/Dockerfile`** — multi-stage:
- Build stage: `node:22-slim` + pnpm. Install → build Next.js standalone.
- Runtime stage: `node:22-slim`. Run standalone server.
  Next.js `output: "standalone"` in `next.config.ts`.

**`devtools/oidc/Dockerfile`** — single stage: `node:22-slim` + pnpm,
install, run `index.js`.

### 2. `docker-compose.yml` (repo root)

Three services:

| Service | Build context | Ports | Notes |
|---------|--------------|-------|-------|
| `backend` | `./backend` | `5000:8080` | `ASPNETCORE_URLS=http://+:8080`, SQLite volume at `/data`, `OIDC_AUTHORITY=http://oidc:9000` |
| `frontend` | `./frontend` | `3000:3000` | `BACKEND_URL=http://backend:8080` |
| `oidc` | `./devtools/oidc` | `9000:9000` | |

Volume: `vw-data` mounted to backend `/data` for SQLite.

`depends_on` with `healthcheck` where feasible (backend → oidc).

### 3. Health endpoint

Add `app.MapGet("/health", () => Results.Ok("ok"));` to `Host/Program.cs`.
Frontend health: Next.js serves `/` by default — sufficient.

### 4. OR-Tools early spike

Add `Google.OrTools` NuGet package to `Adapters.csproj` (it belongs there
per hexagonal layout — solver is an adapter). On startup, log a one-line
diagnostic confirming native solver loads:

```csharp
// In Program.cs startup — temporary spike, removed when Task 17 builds real wrapper
Google.OrTools.Sat.CpSolver solver = new();
app.Logger.LogInformation("OR-Tools loaded: {Version}", Google.OrTools.Init.OrToolsVersion.VersionString());
```

Acceptance: container starts without native-lib crash.

### 5. SQLite seed

Since Task 7 builds the real persistence layer, this task proves the volume
mount works with a minimal seed:

- Add `Microsoft.Data.Sqlite` to `Host.csproj` (temporary; moves to
  `Adapters` in Task 7).
- At startup, open/create `/data/valuesworkshop.db`, create a `sessions`
  table if not exists (`id TEXT PRIMARY KEY, name TEXT, created_at TEXT`),
  insert one demo row if empty. Log the seed.
- This code is explicitly disposable — Task 7 replaces it with EF Core.

### 6. `scripts/verify-startup.sh`

**Not Docker-based.** Starts backend + frontend natively (for agent/CI use):

1. `dotnet run --project backend/Host` in background.
2. `pnpm --dir frontend dev` in background.
3. Poll `http://localhost:5000/health` and `http://localhost:3000` with
   curl, 1 s interval, 60 s timeout.
4. Both 200 → exit 0. Timeout or crash → kill children, exit 1.
5. Cleanup: trap to kill background processes on exit.

### 7. `.dockerignore` files

`backend/.dockerignore` — exclude `bin/`, `obj/`, `TestResults/`, `*.Tests/`.
`frontend/.dockerignore` — exclude `node_modules/`, `.next/`, `coverage/`.

## Success Criteria

- [ ] `docker compose up --build` starts all 3 services, each reachable
      from host (curl backend:5000/health, frontend:3000, oidc:9000)
- [ ] Backend logs show OR-Tools version string (no native lib crash)
- [ ] `/data/valuesworkshop.db` inside backend container has `sessions`
      table with one demo row
- [ ] `scripts/verify-startup.sh` exits 0 when both apps start successfully
- [ ] `scripts/verify-startup.sh` exits non-zero when backend port is sabotaged
- [ ] All existing quality gates still pass (`scripts/ci-lint.sh`,
      `scripts/ci-test.sh`)

## Boundaries

- **Always:** keep Dockerfiles minimal; use multi-stage builds
- **Ask first:** adding deps beyond Google.OrTools + Microsoft.Data.Sqlite
- **Never:** expose secrets in Docker images; break existing gates

## Open Questions

None.

## Implementation Tasks

1. Add `output: "standalone"` to `next.config.ts`
2. Add `Google.OrTools` to `Adapters.csproj`, OR-Tools startup spike in
   `Program.cs`
3. Add `Microsoft.Data.Sqlite` to `Host.csproj`, seed logic in `Program.cs`
4. Add `/health` endpoint to `Program.cs`
5. Create `backend/Dockerfile` + `backend/.dockerignore`
6. Create `frontend/Dockerfile` + `frontend/.dockerignore`
7. Create `devtools/oidc/Dockerfile`
8. Create `docker-compose.yml`
9. Create `scripts/verify-startup.sh`
10. Verify: `docker compose up --build`, curl all services, check seed,
    run verify-startup.sh, run ci-lint + ci-test

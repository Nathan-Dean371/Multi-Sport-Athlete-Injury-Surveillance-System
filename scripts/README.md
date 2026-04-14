# Scripts

This directory contains the operational PowerShell entry points for local development, demo startup, database maintenance, and migration orchestration. The repository also has a few root-level PowerShell launchers; they are documented here because they are part of the same workflow.

## Prerequisites

- Windows PowerShell 5.1 or PowerShell 7.
- Docker Desktop running locally.
- Node.js and npm for the backend, web app, mobile app, and the Neo4j diagnostic helper.
- Expo Go or a mobile emulator if you use the mobile app scripts.
- Flyway CLI is optional. `sync-test-schema.ps1` can fall back to the Flyway Docker image when the CLI is not installed.

## Root-Level Launchers

These live at the repository root rather than in `scripts/`, but they are the main entry points for day-to-day use.

- `start-demo.ps1` starts the full demo flow: Docker databases/backend, mobile app, and admin dashboard. Use this for the normal in-person demo startup.
- `stop-demo.ps1` stops the demo stack and optionally terminates Node.js processes.
- `dev_start.ps1` is an older demo launcher that follows the same general pattern as `start-demo.ps1`. Prefer `start-demo.ps1` for new use.
- `build-docker.ps1` builds, tests, cleans, or describes the backend Docker image locally. Useful before pushing backend image changes.
- `stop-demo copy.ps1` is a legacy duplicate of the demo shutdown script. Treat it as a backup/compatibility file, not the preferred entry point.

## Database And Migration Scripts

- `start-databases.ps1` starts PostgreSQL, Neo4j, the Neo4j test container, and Flyway, then waits for readiness and applies Neo4j migrations to the dev and test containers.
- `stop-databases.ps1` stops the database services while preserving volumes.
- `reset-databases.ps1` performs a destructive database reset by bringing the stack down with volumes and then rebuilding it from migrations.
- `apply-neo4j-migrations.ps1` runs the pinned `neo4j-migrations` Docker runner against a target Neo4j instance.
- `sync-test-schema.ps1` is a deprecated compatibility wrapper that now delegates to Flyway and `neo4j-migrations` for the test database.
- `setup-test-databases.ps1` is a deprecated compatibility wrapper that delegates to schema sync tooling.
- `seed-dev-data.ps1` loads sample PostgreSQL and Neo4j data into the dev or test environment.
- `seed-neo4j.ps1` is a deprecated wrapper that calls `seed-dev-data.ps1 -SkipPostgres`.

### Typical Usage

```powershell
.\scripts\start-databases.ps1
.\scripts\reset-databases.ps1
.\scripts\seed-dev-data.ps1 -Target test
.\scripts\apply-neo4j-migrations.ps1 -Address neo4j://localhost:7687 -Username neo4j -PasswordSecureString (ConvertTo-SecureString 'your-password' -AsPlainText -Force)
```

## Application Launchers

- `start-backend.ps1` waits for the databases to come up and then starts the NestJS backend in development mode from `backend/`.
- `start-web.ps1` starts the Next.js admin dashboard from `web/admin-dashboard/`, installing dependencies on first run if `node_modules` is missing.
- `start-mobile.ps1` starts the Expo app and accepts `-Mode dev` or `-Mode prod`.
- `start-mobile-dev.ps1` is a convenience wrapper for `start-mobile.ps1 -Mode dev`.
- `start-mobile-prod.ps1` is a convenience wrapper for `start-mobile.ps1 -Mode prod`.
- `start-docker.ps1` starts the database services, then launches the backend and pgAdmin.

### Typical Usage

```powershell
.\scripts\start-backend.ps1
.\scripts\start-web.ps1
.\scripts\start-mobile.ps1 -Mode dev
.\scripts\start-docker.ps1
```

## Diagnostics

- `test-neo4j-connection.js` is a Node.js helper that verifies Neo4j connectivity, schema metadata, and a few sample queries. It is not a PowerShell script, but it lives here because it supports the same operational workflow.

### Typical Usage

```powershell
node .\scripts\test-neo4j-connection.js
```

## Notes

- Prefer `start-demo.ps1` over the older launchers when you want the whole system.
- Treat `sync-test-schema.ps1` and `setup-test-databases.ps1` as compatibility wrappers. The canonical schema process is migration-first via Flyway and `neo4j-migrations`.
- The scripts are intentionally Windows-oriented because this repository is developed and demonstrated from PowerShell on Windows.
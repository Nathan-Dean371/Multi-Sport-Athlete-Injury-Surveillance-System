---
title: Backend Setup
doc_type: guide
status: active-staging
last_updated: 2026-04-09
owner: docs
canonical: true
---

# Backend Setup (Canonical)

## Prerequisites

- Node.js 18+
- Docker Desktop
- npm

## Backend + Database Startup

```powershell
# From repository root
docker compose up -d
cd backend
npm install
npm run start:dev
```

Backend base URL: `http://localhost:3000`

Swagger docs: `http://localhost:3000/api/docs`

## Environment Variables

Backend config keys are defined in `backend/src/config/configuration.ts`.

Current JWT default in code:

- `JWT_EXPIRES_IN=1d`

If your `.env` differs, update docs and code together to avoid drift.

## Troubleshooting

- If backend cannot connect to Neo4j/PostgreSQL, verify container status with `docker compose ps`.
- If ports are in use, stop conflicting processes or adjust local bindings.

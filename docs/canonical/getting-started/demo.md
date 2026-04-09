---
title: Demo Startup
doc_type: guide
status: active-staging
last_updated: 2026-04-09
owner: docs
canonical: true
---

# Demo Startup (Canonical)

## One-Command Demo

```powershell
.\start-demo.ps1
```

What it launches:

- Docker services (via `scripts/start-docker.ps1`)
- Mobile app launcher (via `scripts/start-mobile-*.ps1`)

## URLs

- Backend API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api/docs`
- Neo4j Browser: `http://localhost:7474`
- pgAdmin: `http://localhost:5050`

## Stop Demo

```powershell
.\stop-demo.ps1
```

## Demo Credentials

- Email: `liam.murphy@email.com`
- Password: `password123`

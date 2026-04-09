---
title: Getting Started
doc_type: hub
status: active-staging
last_updated: 2026-04-09
owner: docs
canonical: true
---

# Getting Started

Use this section for all local onboarding and demo startup.

## Recommended Paths

1. [Quick Local Setup](backend.md)
2. [Database Setup and Schema Workflow](databases.md)
3. [Mobile App Setup](mobile.md)
4. [Demo Startup](demo.md)

## Quick Commands

```powershell
# Project root
.\start-demo.ps1
```

```powershell
# Backend only
cd backend
npm install
npm run start:dev
```

## Notes

- The canonical Swagger URL is `http://localhost:3000/api/docs`.
- Local database containers are managed through `docker-compose.yml` and helper scripts in `scripts/`.

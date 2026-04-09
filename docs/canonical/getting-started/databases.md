---
title: Database Setup and Workflow
doc_type: guide
status: active-staging
last_updated: 2026-04-09
owner: docs
canonical: true
---

# Database Setup and Workflow (Canonical)

This project uses two databases:

- Neo4j for graph/analytics relationships
- PostgreSQL for identity and authentication data

## Neo4j

Canonical Neo4j script and migration guidance lives in:

- `database/neo4j/README.md`

Use that page for script ordering, browser-compatible files, and production safety notes.

## PostgreSQL

Schema and sample data are in:

- `database/postgres/identity-service-schema.sql`
- `database/postgres/sample-identities.sql`

## Test Databases

Use the test setup scripts to keep dev and test environments isolated:

```powershell
.\scripts\setup-test-databases.ps1
.\scripts\sync-test-schema.ps1
```

Detailed testing guidance: [Testing Hub](../testing/index.md)

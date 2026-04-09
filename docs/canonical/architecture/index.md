---
title: Architecture
doc_type: hub
status: active-staging
last_updated: 2026-04-09
owner: docs
canonical: true
---

# Architecture

## System Overview

- Backend: NestJS API (`backend/`)
- Mobile client: Expo React Native (`mobile/`)
- Data stores: Neo4j + PostgreSQL
- Shared contracts: `shared/`

## Core Principle

Privacy-by-design through separation of identity data (PostgreSQL) from analytical graph data (Neo4j).

## Related Canonical Pages

- [Database setup and workflow](../getting-started/databases.md)
- [Authentication feature](../features/authentication.md)

## Supporting Materials

- Existing architecture docs: `docs/architecture/`
- ADRs: `docs/decisions/README.md`

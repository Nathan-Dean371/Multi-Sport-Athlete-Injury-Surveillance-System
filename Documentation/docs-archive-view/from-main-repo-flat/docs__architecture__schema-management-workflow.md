# Schema Management Workflow

**Status:** Active  
**Date:** April 9, 2026  
**Owner:** Backend + Platform

## Purpose

Define one mandatory, repeatable process for schema evolution across PostgreSQL and Neo4j.

This workflow replaces script-first and manual browser-first schema updates.

## Scope

1. PostgreSQL schema evolution via Flyway.
2. Neo4j schema evolution via neo4j-migrations.
3. Local, CI, and production migration execution order.
4. Deployment gating rules that block app rollout if migrations fail.

## Principles

1. Migration files are the only schema source of truth.
2. Applied migrations are immutable.
3. Local, CI, and production follow the same migration process.
4. Application deployment is blocked unless both database migrations succeed.
5. Destructive reset utilities are isolated from migration chains.

## Source Of Truth

### PostgreSQL

1. Authoritative: versioned files in `database/postgres/migrations`.
2. `database/postgres/schema.sql` is frozen reference-only and must not be executed by local, CI, or production workflows.

### Neo4j

1. Authoritative: versioned files in `database/neo4j/migrations`.
2. Test-only destructive utilities live in `database/neo4j/utilities` and are never executed by migration tooling.

## Required Local Flow

1. Start blank database services and run migrations.
2. Prefer scripted entrypoints:
3. `./scripts/start-databases.ps1` for start + migration apply.
4. `./scripts/reset-databases.ps1` for clean reset (`down -v`) + migration rebuild.
5. `./scripts/stop-databases.ps1` to stop DB services while preserving volumes.
6. Start application services only after migration success.

## Required CI Pull Request Gate

Before lint/unit/e2e tests run:

1. Run Flyway `validate`.
2. Run Flyway `migrate` against a blank PostgreSQL test database.
3. Run neo4j-migrations `apply` against a blank Neo4j test instance.

Any migration failure hard-blocks the PR.

## Required Production Deployment Sequence

1. Run Flyway `migrate` against production PostgreSQL.
2. Run neo4j-migrations `apply` against production Neo4j.
3. Deploy application only if both migration steps succeed.
4. Run post-deployment health checks.

## Production Baseline Policy

Production already contains pre-tooling schema state. Flyway must be introduced safely:

1. Rehearse on a sanitized production-like schema clone.
2. Run `flyway baseline` at the agreed baseline version.
3. Run `flyway validate` + `flyway migrate` and resolve drift until deterministic.
4. Execute baseline once in production during a maintenance window.
5. Enforce Flyway `validate` in all PR workflows after cutover.

## Governance

1. Migration file changes require peer review.
2. Applied migration files must not be edited.
3. Any migration strategy change requires ADR update.

## Deprecated Guidance

The following documents contain legacy process details and are deprecated where they conflict with this workflow:

1. `docs/tests/TEST-DATABASE-SETUP.md`
2. `database/neo4j/README.md`

## Related ADRs

1. `docs/decisions/adr-0003-two-database-privacy-architecture.md`
2. `docs/decisions/adr-0009-deployment-strategy.md`
3. `docs/decisions/adr-0010-cicd-pipeline.md`
4. `docs/decisions/adr-0011-schema-migration-governance.md`

---
title: Canonical Documentation
doc_type: index
status: active-staging
last_updated: 2026-04-09
owner: docs
canonical: true
---

# Canonical Documentation (Staging)

This is the new single-source documentation tree for the Multi-Sport Athlete Injury Surveillance System.

Status: Active staging structure. Legacy pages remain in place for now and should be treated as deprecated when they conflict with this tree.

## Navigation

- [Getting Started](getting-started/index.md)
- [Architecture](architecture/index.md)
- [Features](features/index.md)
- [Testing](testing/index.md)
- [Reference](reference/index.md)
- [Architecture Decisions (ADRs)](decisions/index.md)
- [Docs Governance](reference/docs-governance.md)

## Scope and Source of Truth

- Setup/onboarding guidance: `docs/canonical/getting-started/*`
- Feature behavior and workflows: `docs/canonical/features/*`
- Current backend and runtime behavior: source code in `backend/src/*`
- Neo4j script workflow and script catalog: `database/neo4j/README.md`

## Migration Notes

- External docs from `FYP-Documentation-Repo-main/` are being used as source material during consolidation.
- The external repository is no longer the primary source of truth.
- Do not delete legacy docs until this staging tree is fully validated.

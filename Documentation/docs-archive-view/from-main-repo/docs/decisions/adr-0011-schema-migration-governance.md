# ADR-0011: Unified Database Schema Migration Governance

**Status:** Accepted

**Date:** April 9, 2026

**Deciders:** Nathan Dean

---

## Context

Schema management currently uses mixed mechanisms across environments, including custom scripts, manual update paths, and different execution models between local/test and production.

This creates drift risk and weakens confidence that tested schema paths match production behavior.

The system already operates a two-database architecture (Neo4j + PostgreSQL). It now needs one enforceable, tooling-based schema lifecycle.

---

## Decision

Adopt a unified migration-first model for all environments:

1. PostgreSQL schema changes must use Flyway only.
2. Neo4j schema changes must use neo4j-migrations only.
3. Versioned migration files are the only schema source of truth.
4. CI must run migration checks before application tests.
5. Production deployment must run migrations before application deployment.
6. Application deployment is blocked unless both migration steps succeed.
7. Destructive reset scripts are isolated from migration chains.
8. Flyway baseline is required once to safely attach existing production schema history.

---

## Rationale

1. Deterministic and reproducible schema state from blank environments.
2. Stronger auditability and change control through migration history.
3. Elimination of local/CI/prod schema drift from split execution models.
4. Safer deployments through migration-first hard gates.

---

## Consequences

### Positive

1. One canonical schema process across all environments.
2. Faster failure detection in pull requests.
3. Reduced operational risk from manual or script-specific drift.
4. Better long-term maintainability and compliance posture.

### Trade-Offs

1. Upfront migration restructuring and pipeline changes.
2. One-time baseline ceremony for production.
3. Additional discipline required around immutable migration history.

---

## Implementation Notes

1. Canonical operational guide: `docs/architecture/schema-management-workflow.md`.
2. Legacy scripts may remain short-term wrappers but must not apply raw schema directly.
3. Flyway `validate` should run on every PR to detect drift or checksum tampering.

---

## Risk Mitigation

Primary risk: production conflicts during migration-tool adoption.

Mitigation sequence:

1. Build sanitized production-like schema clone.
2. Run Flyway baseline at agreed version.
3. Run Flyway validate and migrate until deterministic success.
4. Execute baseline in production during maintenance.
5. Continue with standard migration-first deployment flow.

---

## Related ADRs

1. `docs/decisions/adr-0003-two-database-privacy-architecture.md`
2. `docs/decisions/adr-0009-deployment-strategy.md`
3. `docs/decisions/adr-0010-cicd-pipeline.md`

---

**Next Review:** After first production deployment using migration-first gating.

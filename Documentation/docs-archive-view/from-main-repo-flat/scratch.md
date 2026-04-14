## Plan: GitOps Database Migration Cutover

Adopt Flyway (PostgreSQL) and neo4j-migrations (Neo4j) as the immediate default path. Keep migration execution identical across local, CI, and production from day one; gate app deployment on successful DB migrations; use Flyway baseline to safely attach production history.

**Steps**

1. Phase 1: Immediate tooling cutover (no hybrid sprint window)
2. Add migration roots without breaking existing paths: database/postgres/migrations and database/neo4j/migrations.
3. Convert scripts/sync-test-schema.ps1 into a wrapper that calls Flyway + neo4j-migrations only; remove raw SQL/Cypher execution from this script.
4. Convert scripts/setup-test-databases.ps1 into a wrapper/orchestrator that calls sync-test-schema.ps1 and prints deprecation warnings; no direct schema apply logic.
5. Add deprecation banners to both scripts and docs/tests/TEST-DATABASE-SETUP.md with deadline and replacement workflow.
6. Keep legacy files present but non-authoritative during transition (depends on 2-5).

7. Phase 2: PostgreSQL consolidation (depends on 1)
8. Freeze database/postgres/schema.sql by adding a top-level notice: frozen snapshot, not used by local/CI/prod migration flow.
9. Build versioned Flyway migrations in database/postgres/migrations:
10. Create V1 baseline migration matching deployed production structure.
11. Create incremental migrations for subsequent schema changes.
12. Ensure migration naming/checksum policy is fixed and immutable.
13. Update docker-compose.yml:
14. Remove Postgres init mount to /docker-entrypoint-initdb.d.
15. Add Flyway service that depends on Postgres health and runs migrate on startup for local/dev.
16. Update local startup scripts to rely on Flyway container status instead of SQL init side effects.

17. Phase 3: Neo4j automation and separation (parallel with late Phase 2 tasks)
18. Move structural schema files into database/neo4j/migrations using neo4j-migrations naming/versioning.
19. Create database/neo4j/utilities and move destructive reset scripts there (including 003-init-test-db.cypher).
20. Ensure wrapper scripts call neo4j-migrations for schema apply and call utilities only for explicit test reset.
21. Rewrite database/neo4j/README.md to make neo4j-migrations the single schema mechanism; remove manual/browser schema update as primary path.
22. Fix doc path drift in docs/tests/TEST-DATABASE-SETUP.md to match real filenames and new flow.

23. Phase 4: CI/CD strict gating (depends on 2 and 3)
24. In .github/workflows/ci.yml test job, provision blank Postgres + Neo4j test instances.
25. Add mandatory Flyway steps before tests: validate then migrate; fail-fast on non-zero exit.
26. Add mandatory neo4j-migrations apply step before tests; fail-fast on non-zero exit.
27. Remove schema.sql consumption from CI.
28. Update deploy job sequencing:
29. Remove custom schema_migrations table handling logic.
30. Run Flyway migrate against production Postgres first.
31. Run neo4j-migrations apply against production Aura next.
32. Deploy app container only if both migration steps return success.

33. Production rebaseline safety workflow (depends on 2 and 4)
34. Prepare sanitized schema-only clone of production Postgres.
35. Run Flyway baseline on clone at agreed baseline version.
36. Run Flyway validate + migrate on clone; resolve any conflicts.
37. Repeat dry-run until deterministic success is achieved.
38. Execute baseline once on production during maintenance window, then standard migrate flow thereafter.
39. Enforce Flyway validate in every PR to detect migration tampering.

40. Decommission legacy (depends on stable green period)
41. Remove raw-apply paths immediately after first fully green local + CI run.
42. Delete legacy script internals and any obsolete custom migration tracking remnants.
43. Keep rollback/runbook docs up to date with new toolchain.

44. Documentation and governance hardening (parallel with phases 2-4)
45. Create docs/architecture/schema-management-workflow.md as the canonical end-to-end schema lifecycle guide.
46. Mark docs/tests/TEST-DATABASE-SETUP.md as deprecated and link to the canonical workflow.
47. Create ADR-0011 in docs/decisions for the architectural decision to standardize on Flyway + neo4j-migrations and enforce migration-first deployment gating.
48. Update ADR cross-references in ADR-0003, ADR-0009, and ADR-0010 to point to ADR-0011 and the canonical workflow doc.

**Relevant files**

- /database/postgres/schema.sql — freeze notice only; no longer execution source
- /database/postgres/migrations — authoritative Flyway SQL migrations
- /database/neo4j/migrations — authoritative neo4j-migrations Cypher
- /database/neo4j/utilities — destructive reset/data utility scripts only
- /scripts/sync-test-schema.ps1 — wrapper entrypoint to new CLIs
- /scripts/setup-test-databases.ps1 — wrapper/orchestration + deprecation messaging
- /docker-compose.yml — remove init mount; add Flyway migration service
- /.github/workflows/ci.yml — add migration gating, remove schema.sql/custom tracking logic
- /database/neo4j/README.md — canonical Neo4j migration workflow documentation
- /docs/tests/TEST-DATABASE-SETUP.md — deprecated notice + updated workflow

**Verification**

**Execution Checklist (Immediate Cutover)**

1. Add migration directories.
2. Create /database/postgres/migrations and /database/neo4j/migrations.
3. Create /database/neo4j/utilities and move destructive reset files there.
4. Keep compatibility stubs temporarily only if needed by tests/scripts.

5. Prepare PostgreSQL migration chain.
6. Create V1 baseline migration in /database/postgres/migrations from current production-equivalent structure.
7. Add post-baseline migrations for any deltas currently represented in later SQL files.
8. Add Flyway config file and environment-specific overrides (local, CI, prod).
9. Freeze /database/postgres/schema.sql with a top banner: frozen reference, do not execute in any environment.

10. Prepare Neo4j migration chain.
11. Convert schema/index/constraint Cypher scripts into versioned neo4j-migrations files in /database/neo4j/migrations.
12. Ensure no destructive statements (MATCH DETACH DELETE) remain in migration files.
13. Place destructive resets only in /database/neo4j/utilities with explicit TEST-ONLY warnings.
14. Add neo4j-migrations config and environment-specific overrides (local, CI, prod).

**Seeding Strategy (Dev/Test vs Prod)**

1. Dev/test seed data lives outside migration files and runs only after schema apply.
2. Dev/test sources are the sample/fixture scripts under database/postgres and database/neo4j.
3. Production does not load demo/sample data.
4. Any production reference data must be explicit, reviewed, and delivered as a dedicated versioned migration only if truly required.

**Dev Seeding Update Plan**

1. Create a dedicated dev/test seeding entrypoint separate from schema startup (for example `scripts/seed-dev-data.ps1`).
2. Have it run only after `start-databases.ps1` or `reset-databases.ps1` completes schema apply.
3. Use `database/postgres/003-sample-identities.sql` and Neo4j sample data files as dev/test fixtures, not migrations.
4. Keep dev seeding idempotent where possible so repeated runs do not duplicate data.
5. Retire or rewrite `scripts/seed-neo4j.ps1` to call the new dev seed sources.
6. Keep production seeding out of the normal path; if any prod reference data is needed, model it as explicit versioned migrations and review it separately.
7. Update docs so dev seeding is clearly optional and production seeding is explicitly disallowed for sample/demo data.

8. Legacy seed wrappers should be retired or rewritten to point at the new seed sources.

9. Update local orchestration.
10. Edit /docker-compose.yml: remove Postgres init mount to /docker-entrypoint-initdb.d.
11. Add Flyway service container to run validate+migrate against postgres once healthy.
12. Add neo4j-migrations service container (or explicit task runner) to apply Neo4j migrations once healthy.
13. Update startup scripts to wait for migration service success before app start where required.

14. Convert existing PowerShell scripts to wrappers.
15. Edit /scripts/sync-test-schema.ps1 to call Flyway validate+migrate and neo4j-migrations apply; remove raw SQL/Cypher piping.
16. Edit /scripts/setup-test-databases.ps1 to orchestrate wrapper calls only; keep deprecation notice and new workflow pointer.
17. Ensure non-zero exit propagation in both scripts.

18. Enforce CI pull request gating.
19. Edit /.github/workflows/ci.yml test job:
20. Provision blank Postgres and Neo4j test services.
21. Run Flyway validate then migrate.
22. Run neo4j-migrations apply.
23. Only then run lint/unit/e2e tests.
24. Remove all schema.sql application steps.

25. Enforce deployment gating.
26. Edit /.github/workflows/ci.yml deploy job:
27. Remove custom schema_migrations table logic.
28. Add Flyway migrate against production Postgres target.
29. Add neo4j-migrations apply against production Neo4j target.
30. Run application deployment only on successful migration exit codes.

31. Documentation and ADR rollout.
32. Create /docs/architecture/schema-management-workflow.md with the new canonical process.
33. Create /docs/decisions/adr-0011-schema-migration-governance.md.
34. Add deprecation banner to /docs/tests/TEST-DATABASE-SETUP.md linking to canonical workflow.
35. Update /database/neo4j/README.md to remove manual/browser-first schema mechanism as primary path.
36. Add cross-references from ADR-0003/0009/0010 to ADR-0011 where appropriate.

37. Production rebaseline rehearsal (must pass before prod change).
38. Build sanitized production-like clone.
39. Run Flyway baseline at chosen version.
40. Run Flyway validate+migrate; resolve drift.
41. Repeat until deterministic success is proven.
42. Execute production baseline+migrate in maintenance window.

43. Completion gates for cutover done.
44. Local blank bootstrap succeeds for both databases using migration tools only.
45. CI PR fails fast on migration errors before tests.
46. First production migration-first deployment succeeds.
47. No remaining runtime path executes schema.sql or raw schema scripts directly.

48. Local bootstrapping: start blank databases; confirm Flyway + neo4j-migrations apply all migrations successfully.
49. Determinism: rebuild from scratch twice; confirm same schema outcomes each run.
50. CI PR gate: verify tests do not start unless both migration stages pass.
51. Production dry-run: baseline + validate + migrate pass on sanitized production clone.
52. Production cutover: migrations succeed before app deployment; health checks green after deploy.
53. Integrity checks: Flyway validate runs on every PR and blocks checksum drift.

**Decisions**

- Perform immediate cutover to migration tooling and retain legacy scripts only as short-lived wrappers.
- Do not delete schema.sql initially; freeze and de-authorize it.
- Separate Neo4j schema evolution from destructive reset scripts.
- Use migration success as hard prerequisite for application deployment.
- Use Flyway baseline to adopt existing production state safely.

**Further Considerations**

1. Baseline version policy: Option A single V1 baseline then forward-only increments (recommended). Option B backfilled granular historical versions.
2. Seeding policy: Option A dedicated optional seed migrations per environment profile. Option B keep seeds in utilities outside migration history.
3. Rollback policy: Option A forward-fix only (recommended). Option B maintain explicit undo migrations for selected high-risk changes.

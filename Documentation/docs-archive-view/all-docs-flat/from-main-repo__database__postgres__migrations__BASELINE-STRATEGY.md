# Flyway Baseline Strategy

This migration chain includes a seeded baseline (`V1__identity_baseline.sql`) plus transitional compatibility migrations (`V2+`).

## Intent

1. New environments: apply `V1` then run forward migrations.
2. Existing production environments: baseline once, then run forward migrations.

## Production Adoption Steps

1. Rehearse on a sanitized production-like schema clone.
2. Run `flyway baseline` at the agreed baseline version.
3. Run `flyway validate` and `flyway migrate` on the clone until deterministic.
4. Execute the same sequence in production during a maintenance window.

## Safety Rules

1. Do not edit applied migration files.
2. Add new changes as new versioned migrations only.
3. Keep `baselineOnMigrate` restricted to controlled production adoption paths.
4. Keep CI strict: `flyway validate` must pass before tests.

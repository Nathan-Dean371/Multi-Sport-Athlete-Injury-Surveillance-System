# PostgreSQL Migrations

This directory is the authoritative source for PostgreSQL schema changes.

Rules:

1. Use Flyway-compatible versioned filenames.
2. Applied migrations are immutable.
3. Do not place ad-hoc utility SQL here.
4. Do not use `database/postgres/schema.sql` as an execution source.

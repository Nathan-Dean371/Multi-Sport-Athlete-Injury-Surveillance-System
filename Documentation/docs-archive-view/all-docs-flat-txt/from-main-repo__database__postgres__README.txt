# PostgreSQL

PostgreSQL stores the system's private identity and compliance data. In this architecture, Neo4j owns the graph relationships and sport/injury domain model, while PostgreSQL holds the personally identifiable and operational records that need relational constraints and tighter access control.

## Role In The System

- Identity and account data for players, coaches, admins, and parents.
- Authentication support records such as password hashes, sessions, lock state, and recovery tokens.
- GDPR and audit data such as access logs and deletion/export request records.
- Invitation and onboarding records used to connect private identities to the wider application flows.

## Schema Overview

The schema is organized into a few broad areas:

- identity tables such as `player_identities`, `coach_identities`, `admin_identities`, and `parent_identities`
- security tables such as `user_accounts`
- audit/compliance tables such as `user_activity`, `data_access_log`, and the deletion/export request tables
- invitation tables such as `parent_invitations` and `player_invitations`

The frozen `schema.sql` file is kept as a historical snapshot and reference artifact. It is not the live execution source and should not be used for normal startup, CI, or production deployments.

## Migration Management

The current migration system is Flyway-based and the authoritative migration source is `database/postgres/migrations/`.

The numbered SQL files in the directory root are legacy or archival artifacts. They are useful for historical context, but they are not the active migration chain.

Current versioned migrations include:

- `V1__identity_baseline.sql`
- `V2__add_parent_and_invitations.sql`
- `V3__add_coach_invitations.sql`
- `V4__add_user_activity.sql`
- `V5__add_player_invitations.sql`
- `V6__parent_identities_compat.sql`

Flyway defaults are defined in `flyway.conf` for local test use. The file points to the test database on `127.0.0.1:5433` and uses the development password by default, but CI and production override these values through environment variables and secrets.

### Recommended Commands

```powershell
.\scripts\start-databases.ps1
.\scripts\reset-databases.ps1
.\scripts\seed-dev-data.ps1 -Target test
.\scripts\sync-test-schema.ps1
```

### Migration Rules

1. Add new changes as new Flyway versioned files.
2. Never edit applied migrations.
3. Treat `schema.sql` as read-only historical reference.
4. Use `flyway validate` before `flyway migrate` in CI and in any production cutover.
5. Follow [migrations/BASELINE-STRATEGY.md](migrations/BASELINE-STRATEGY.md) when introducing Flyway to an existing production schema.

## Local Development

- `scripts/start-databases.ps1` starts the database services and applies migrations.
- `scripts/reset-databases.ps1` wipes volumes and rebuilds the database state from migrations.
- `scripts/seed-dev-data.ps1` loads sample identities and supporting records.

## Related Documentation

- [Migration rules](migrations/README.md)
- [Schema management workflow](../../docs/architecture/schema-management-workflow.md)
- [Testing strategy](../../docs/TESTING-STRATEGY.md)
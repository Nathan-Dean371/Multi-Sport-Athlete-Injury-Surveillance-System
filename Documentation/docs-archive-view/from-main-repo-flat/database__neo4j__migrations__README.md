# Neo4j Migrations

This directory is the authoritative source for Neo4j schema changes.

Rules:

1. Use neo4j-migrations-compatible versioned filenames.
2. Only schema evolution files belong here (constraints, indexes, structural changes).
3. Applied migrations are immutable.
4. Never place destructive reset scripts in this directory.

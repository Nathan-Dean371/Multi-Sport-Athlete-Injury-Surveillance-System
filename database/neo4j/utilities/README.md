# Neo4j Utilities

This directory contains test-only or operational utility scripts that are not part of normal migration history.

Rules:

1. Destructive scripts (for example, full database resets) must live here.
2. Files in this directory are never executed by neo4j-migrations apply.
3. Production workflows must not run destructive utility scripts.

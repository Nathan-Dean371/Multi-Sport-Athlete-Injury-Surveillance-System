# neo4j-migrations runner (pinned)

This folder contains a pinned, dockerized runner for `neo4j-migrations`.

Why: we want the same Neo4j schema migration tooling across local, CI, and production without requiring host installs.

## Build

```bash
docker build -t injury-surveillance-neo4j-migrations-runner:3.3.1 ./tools/neo4j-migrations-runner
```

## Run (example)

```bash
docker run --rm \
  -v "$PWD/database/neo4j/migrations:/migrations:ro" \
  injury-surveillance-neo4j-migrations-runner:3.3.1 \
  --address neo4j://localhost:7687 --username neo4j --password=test-password --location file:///migrations apply
```

Notes:

- `--location` must be a `file:///...` URI that points to the mounted directory inside the container.
- For local Docker Compose, run the container on the `injury-surveillance-network` network and target the Neo4j container name.

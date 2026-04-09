# Pinned neo4j-migrations runner for CI/local/prod
# Uses the official GitHub release linux-x86_64 distribution.

FROM debian:bookworm-slim

ARG NEO4J_MIGRATIONS_VERSION=3.3.1
ARG NEO4J_MIGRATIONS_ZIP=neo4j-migrations-3.3.1-linux-x86_64.zip
# sha256 of the ZIP (from GitHub release metadata)
ARG NEO4J_MIGRATIONS_ZIP_SHA256=3943bc26eb822df608c7745a156e7d1dcccaf572847cd2637c71ebdff74c4148

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt

RUN curl -fsSL -o neo4j-migrations.zip \
      "https://github.com/michael-simons/neo4j-migrations/releases/download/${NEO4J_MIGRATIONS_VERSION}/${NEO4J_MIGRATIONS_ZIP}" \
    && echo "${NEO4J_MIGRATIONS_ZIP_SHA256}  neo4j-migrations.zip" | sha256sum -c - \
    && unzip neo4j-migrations.zip \
    && rm neo4j-migrations.zip \
    && mv "neo4j-migrations-${NEO4J_MIGRATIONS_VERSION}-linux-x86_64" neo4j-migrations \
    && ln -s /opt/neo4j-migrations/bin/neo4j-migrations /usr/local/bin/neo4j-migrations

ENTRYPOINT ["neo4j-migrations"]

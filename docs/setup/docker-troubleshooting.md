# Docker Troubleshooting

This document tracks known issues and resolutions for Docker container setup.

## Neo4j 5.26 Exec Format Error

**Issue Date:** January 9, 2026

### Problem

When running Docker Compose with `neo4j:5.26-community`, the Neo4j container fails to start with the following error:

```
exec /usr/bin/tini: exec format error
```

The container enters a restart loop and never becomes healthy.

### Root Cause

The `neo4j:5.26-community` Docker image contains a corrupted or zero-byte `/usr/bin/tini` binary. When Docker attempts to use this as the init process, it fails with an exec format error because the file has no executable content (0 bytes vs. expected ~27 KB).

This is not an architecture mismatch issue - the host is x86_64 and the image is built for amd64. The other services (Postgres, pgAdmin) run without issues.

### Verification

You can verify the issue by inspecting the tini binary inside the container:

```bash
# Check 5.26 (broken)
docker run --rm --entrypoint /bin/sh neo4j:5.26-community -c "stat -c '%s %n' /usr/bin/tini"
# Output: 0 /usr/bin/tini

# Check 5.25 (working)
docker run --rm --entrypoint /bin/sh neo4j:5.25-community -c "stat -c '%s %n' /usr/bin/tini"
# Output: 27712 /usr/bin/tini
```

### Resolution

Pin Neo4j to version `5.25-community` in `docker-compose.yml`:

```yaml
neo4j:
  image: neo4j:5.25-community
  # ... rest of configuration
```

After making this change, recreate the Neo4j container:

```bash
docker-compose down
docker-compose up -d
```

### References

- [Stack Overflow: exec user process caused "exec format error"](https://stackoverflow.com/questions/42494853/standard-init-linux-go178-exec-user-process-caused-exec-format-error)
- Neo4j versions affected: 5.26-community
- Neo4j versions verified working: 5.25-community

### Future Actions

Monitor Neo4j releases for fixes to the 5.26+ image series. Consider upgrading once the tini binary issue is resolved in future versions.

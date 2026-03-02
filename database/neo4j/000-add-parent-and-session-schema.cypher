// Neo4j migration: add uniqueness constraints for Parent and Session identifiers
CREATE CONSTRAINT IF NOT EXISTS ON (p:Parent) ASSERT p.parentId IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS ON (s:Session) ASSERT s.sessionId IS UNIQUE;

// Optional indexes for faster lookups
CREATE INDEX IF NOT EXISTS FOR (p:Parent) ON (p.pseudonymId);
CREATE INDEX IF NOT EXISTS FOR (s:Session) ON (s.sessionDate);

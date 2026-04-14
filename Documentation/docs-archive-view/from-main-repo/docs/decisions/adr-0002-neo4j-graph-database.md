# ADR-0002: Neo4j Graph Database for Injury Surveillance

**Status:** Accepted

**Date:** November 2024

**Deciders:** Nathan Dean, Project Supervisor

---

## Context

The Multi-Sport Athlete Injury Surveillance System needs to store and query complex relationships between:
- Players and their injuries
- Teams and organizations
- Injury progression over time (status history)
- Medical staff, coaches, and their access permissions
- Audit trails for data access
- Multi-level organizational structures (Organizations → Teams → Players)

Key requirements:
- **Relationship-Heavy Data Model**: Extensive connections between entities
- **Privacy Compliance**: Ability to pseudonymize data while maintaining relationships
- **Temporal Tracking**: Track injury progression and status changes over time
- **Flexible Schema**: Adapt to different sports, team structures, and injury types
- **Query Performance**: Fast traversal of relationships (e.g., "all injuries for a team's players")
- **Analytical Queries**: Aggregate statistics across multiple levels (player → team → organization)

Database options considered:

### 1. Relational Database (PostgreSQL/MySQL)
**Pros:**
- Well-understood technology
- Strong ACID guarantees
- Good tooling and ORM support

**Cons:**
- Complex JOIN operations for multi-level relationships
- Rigid schema requires migrations for changes
- Performance degrades with deep relationship traversals
- Many junction tables needed (players_teams, injuries_statuses, etc.)

### 2. Document Database (MongoDB)
**Pros:**
- Flexible schema
- Good for nested data structures

**Cons:**
- Poor support for relationships
- Difficult to maintain referential integrity
- Not ideal for graph-like queries
- Denormalization leads to data duplication

### 3. Graph Database (Neo4j)
**Pros:**
- Native support for relationships
- Intuitive data model matches problem domain
- Cypher query language designed for graph traversal
- Excellent performance for relationship-heavy queries
- Flexible schema supports different sports/structures
- Built-in support for temporal data
- Visual query results aid development

**Cons:**
- Less common technology (learning curve)
- Smaller community compared to PostgreSQL
- May require separate database for transactional data

---

## Decision

We will use **Neo4j graph database** as the primary data store for the injury surveillance system.

### Architecture

- **Neo4j**: Stores pseudonymized data, relationships, and analytical information
- **PostgreSQL**: Separate identity service for PII storage (ADR-0003)
- **Mapping Layer**: Backend service maps between pseudonymous IDs and real identities

### Rationale

1. **Natural Data Model**: The injury surveillance domain is inherently graph-structured:
   ```
   (Player)-[:BELONGS_TO]->(Team)-[:PART_OF]->(Organization)
   (Player)-[:HAS_INJURY]->(Injury)-[:HAS_STATUS]->(InjuryStatus)
   (Coach)-[:COACHES]->(Team)
   (Admin)-[:MANAGES]->(Organization)
   ```

2. **Query Simplicity**: Complex queries become simple:
   ```cypher
   // Get all active injuries for a team
   MATCH (t:Team {id: $teamId})<-[:BELONGS_TO]-(p:Player)-[:HAS_INJURY]->(i:Injury)
   WHERE i.isResolved = false
   RETURN p, i
   ```

3. **Privacy by Design**: Graph structure supports pseudonymization:
   - Store only pseudonymous IDs in Neo4j
   - Relationships maintained without exposing PII
   - Easy to implement access control via graph traversal

4. **Flexible Schema**: Can evolve without migrations:
   - Add new node properties as needed
   - Support different sports with varying injury types
   - Adapt to different organizational structures

5. **Academic Value**: Demonstrates understanding of:
   - Non-relational database design
   - Graph theory concepts
   - Modern data architecture patterns

---

## Consequences

### Positive

- **Query Performance**: Relationship traversals are O(1) operations
- **Code Clarity**: Cypher queries are more readable than complex SQL JOINs
- **Visualization**: Neo4j Browser provides visual query results for debugging
- **Scalability**: Graph databases scale well for relationship-heavy workloads
- **Privacy Architecture**: Clear separation between analytical (Neo4j) and identity (PostgreSQL) data
- **Temporal Queries**: Easy to track injury progression over time
- **Audit Trail**: Natural fit for logging relationships and access patterns
- **Academic Interest**: Unique technical implementation demonstrates advanced concepts

### Negative

- **Learning Curve**: Team must learn Cypher query language
- **Tooling**: Less mature ORM support compared to SQL databases
- **Deployment**: Requires Docker or Neo4j Desktop for development
- **Backup/Recovery**: Different processes than traditional SQL databases
- **Community Size**: Smaller community than PostgreSQL/MySQL

### Mitigation

- **Documentation**: Comprehensive Neo4j documentation created with interactive schema
- **Development Environment**: Docker Compose configuration for easy local setup
- **Code Examples**: NestJS service examples provided in documentation
- **Testing**: Neo4j connection test scripts for validation
- **Fallback**: If Neo4j proves unsuitable, data model can be translated to PostgreSQL

---

## Implementation Notes

### Development Setup
- Neo4j Community Edition (free, open-source)
- Version: 5.25+ (latest stable)
- Docker Compose for consistent environment
- Neo4j Browser for query development and debugging

### Production Considerations
- Neo4j Aura (cloud) for production deployment (if budget allows)
- Self-hosted Neo4j on VPS as alternative
- Automated backups configured
- Monitoring via Neo4j OPS Manager or similar

### Schema Design
- Constraints on unique identifiers (pseudoIds)
- Indexes on frequently queried properties
- Audit log nodes for all data access
- Temporal properties for tracking changes

---

## Related Decisions

- ADR-0003: Two-database privacy architecture
- ADR-0004: NestJS backend framework (integrates well with Neo4j driver)

---

## References

- [Neo4j Documentation](https://neo4j.com/docs/)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/current/)
- [Interactive Schema Diagram](https://nathan-dean371.github.io/FYP-Documentation-Repo/Html%20Docs/Neo4j-Schema-Interactive.html)
- [Neo4j Database Documentation](../FYP-Documentation-Repo/neo4j_database_documentation.md)

---


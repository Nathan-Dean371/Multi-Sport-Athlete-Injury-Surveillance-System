# ADR-0008: Role-Based Access Control (RBAC)

**Status:** Accepted

**Date:** January 2026

**Deciders:** Nathan Dean

---

## Context

The injury surveillance system currently implements JWT-based authentication (ADR-0006) which verifies user identity. However, the system lacks authorization mechanisms to control what authenticated users can access. Currently, all authenticated users can access all data through the API endpoints.

### Requirements
- Players should only access their own injury data
- Coaches should access data for their team members
- Admins should access all data for management purposes
- Medical staff should access relevant injury data across teams
- Protect sensitive health information from unauthorized access
- Enforce privacy boundaries between players
- Support hierarchical access (team-level, player-level)
- Audit trail for access to sensitive data

### Current State
- **Authentication:** JWT tokens verify user identity
- **Authorization:** None - all authenticated users can access all data
- **Database:** PostgreSQL stores user accounts with role field
- **Graph Database:** Neo4j stores player/injury data with no access metadata
- **Privacy:** Dual-database architecture separates PII from analytics (ADR-0003)

### Problem
Without authorization, the system cannot:
1. Prevent players from viewing other players' medical data
2. Restrict coaches to their own teams
3. Differentiate between player, coach, and admin capabilities
4. Comply with medical privacy requirements
5. Support multi-tenant team isolation

---

## Decision

Implement **Graph-Based Role and Resource Permissions** stored in Neo4j, leveraging the graph database to model access relationships and hierarchical permissions.

### Architecture

#### 1. Role Hierarchy
```
Admin
  └─ Medical Staff
      └─ Coach
          └─ Player
```

**Roles:**
- **Player:** Can view own injuries, training sessions, and profile
- **Coach:** Can view/manage injuries for players on assigned teams
- **Medical Staff:** Can view/update injuries across all teams
- **Admin:** Full system access including user management

#### 2. Implementation Approach

**Graph-Based Permissions (Chosen)**
- Store permissions as Neo4j relationships: `(User)-[:CAN_VIEW]->(Injury)`, `(User)-[:CAN_UPDATE]->(Injury)`
- Store role hierarchy and team assignments in graph
- Query access permissions during each request using graph traversal
- Leverage Cypher queries to check multi-hop relationships
- Model complex access patterns naturally (team membership, hierarchical roles)

**Alternative: Backend Service Layer (Rejected)**
- Authorization logic in NestJS guards and services
- Role checks using JWT payload (role claim)
- Simpler but less flexible for complex access patterns
- Harder to visualize and audit access relationships

**Alternative: External Authorization Service (Rejected)**
- Separate microservice for permissions (e.g., OPA, Casbin)
- Overkill for FYP scope
- Adds network latency and deployment complexity

#### 3. Authorization Components

**Graph Schema:**
```cypher
// User nodes with roles
(u:User {pseudonym: 'USER-001', role: 'player'})
(u:User {pseudonym: 'USER-002', role: 'coach'})
(u:User {pseudonym: 'USER-003', role: 'admin'})

// Access relationships
(user:User)-[:CAN_VIEW]->(injury:Injury)
(user:User)-[:CAN_UPDATE]->(injury:Injury)
(user:User)-[:CAN_DELETE]->(injury:Injury)

// Team membership
(coach:User)-[:COACHES]->(team:Team)
(player:User)-[:PLAYS_FOR]->(team:Team)

// Role hierarchy
(admin:Role {name: 'admin'})-[:INHERITS]->(medicalStaff:Role {name: 'medical-staff'})
(medicalStaff:Role)-[:INHERITS]->(coach:Role {name: 'coach'})
(coach:Role)-[:INHERITS]->(player:Role {name: 'player'})
```

**Permission Queries:**
```typescript
// Check if user can view an injury
async canUserViewInjury(userPseudonym: string, injuryId: string): Promise<boolean> {
  const query = `
    MATCH (u:User {pseudonym: $userPseudonym})
    MATCH (i:Injury {injury_id: $injuryId})
    
    // Direct permission
    OPTIONAL MATCH (u)-[:CAN_VIEW]->(i)
    
    // Team-based access (coach can view team members' injuries)
    OPTIONAL MATCH (u)-[:COACHES]->(t:Team)<-[:PLAYS_FOR]-(p:Player)-[:HAS_INJURY]->(i)
    
    // Owner access (player can view own injuries)
    OPTIONAL MATCH (u)-[:HAS_INJURY]->(i)
    
    // Admin/medical staff (role-based full access)
    OPTIONAL MATCH (u) WHERE u.role IN ['admin', 'medical-staff']
    
    RETURN COUNT(*) > 0 AS hasAccess
  `;
  
  const result = await this.neo4jService.run(query, { userPseudonym, injuryId });
  return result.records[0].get('hasAccess');
}
```

**Service Layer Integration:**
```typescript
// In service layer - delegate to graph
async findPlayerInjuries(playerId: string, requestingUser: User) {
  const hasAccess = await this.canUserViewPlayer(requestingUser.pseudonym, playerId);
  
  if (!hasAccess) {
    throw new ForbiddenException('Access denied');
  }
  
  return this.queryInjuries(playerId);
}
```

**Permission Matrix:**

| Resource                  | Player (Own) | Player (Other) | Coach (Team) | Coach (Other) | Medical Staff | Admin |
|---------------------------|--------------|----------------|--------------|---------------|---------------|-------|
| View own injuries         | ✓            | ✗              | ✓            | ✗             | ✓             | ✓     |
| View other injuries       | ✗            | ✗              | ✓            | ✗             | ✓             | ✓     |
| Create injury report      | ✓            | ✗              | ✓            | ✗             | ✓             | ✓     |
| Update injury status      | ✗            | ✗              | ✓            | ✗             | ✓             | ✓     |
| View training sessions    | ✓            | ✗              | ✓            | ✗             | ✓             | ✓     |
| Manage users              | ✗            | ✗              | ✗            | ✗             | ✗             | ✓     |
| View all teams            | ✗            | ✗              | ✗            | ✗             | ✓             | ✓     |

---

## Options Considered

### Option 1: Backend Service Layer RBAC

**Implementation:**
- Role stored in JWT payload
- Authorization logic in NestJS guards and services
- Resource ownership queries against PostgreSQL/Neo4j

**Pros:**
- Simple and straightforward
- Centralized authorization logic
- Low latency (in-process checks)
- Easy to debug and test
- Suitable for monolithic architecture
- No external dependencies

**Cons:**
- Authorization coupled with business logic
- Harder to change permissions dynamically
- Role/permission changes require code deployment
- Not suitable if permissions become highly dynamic

**Cost:** Low - minimal development overhead

---

### Option 2: Graph-Based Permissions (Selected)

**Implementation:**
- Store access relationships in Neo4j: `(User)-[:CAN_VIEW]->(Injury)`
- Query permissions during each request
- Leverage graph traversal for hierarchical access

**Pros:**
- Flexible and dynamic permissions
- Natural fit for graph database
- Can model complex access patterns
- Visual representation of access

**Cons:**
- Additional Neo4j queries on every request
- Increased complexity in permission management
- Requires permission sync between databases
- Higher query latency
- Privacy concern (access metadata in analytics DB)

**Cost:** Medium - requires permission graph design and maintenance

---

### Option 3: External Authorization Service (OPA/Casbin)

**Implementation:**
- Deploy Open Policy Agent or Casbin service
- Define permissions in policy language (Rego)
- Backend queries authorization service for decisions

**Pros:**
- Separation of concerns
- Policy as code (version control)
- Advanced policy capabilities
- Can be shared across microservices

**Cons:**
- Overkill for FYP scope
- Additional service to deploy/maintain
- Network latency for authorization checks
- Increased system complexity
- Learning curve for policy language

**Cost:** High - significant development and operational overhead

---

### Option 4: Attribute-Based Access Control (ABAC)

**Implementation:**
- Define policies based on attributes (user.team, resource.team, time)
- Evaluate access based on attribute matching
- More fine-grained than RBAC

**Pros:**
- Very flexible
- Can handle complex scenarios
- Dynamic attribute evaluation

**Cons:**
- Much more complex to implement
- Harder to reason about
- Overkill for current requirements
- Difficult to debug

**Cost:** High - significant development complexity

---

## Decision Rationale

**Graph-Based Permissions** was chosen because:

1. **Natural Fit:** Already using Neo4j - leverage existing infrastructure
2. **Flexibility:** Can model complex access patterns (team hierarchies, shared access)
3. **Visibility:** Can visualize access relationships in Neo4j Browser
4. **Queryability:** Easy to audit "who has access to what" using Cypher
5. **Dynamic Permissions:** Can grant/revoke access without code deployment
6. **Graph Traversal:** Multi-hop relationships (coach → team → players) are natural
7. **Centralized Data:** Permissions stored with the data they protect
8. **Scalability:** Graph queries optimize for relationship traversal
9. **Future-Proof:** Supports evolving access patterns (temporary access, delegation)

While this adds some query overhead compared to in-memory checks, the benefits of flexibility and auditability outweigh the ~10-50ms latency cost. The graph database is already the source of truth for relationships, so storing access permissions there maintains consistency.

---

## Implementation Plan

### Phase 1: Graph Schema Setup
- [ ] Create User nodes in Neo4j (one per user account)
- [ ] Link User nodes to Player nodes using `:IS_PLAYER` relationship
- [ ] Create Team nodes and `:PLAYS_FOR` relationships
- [ ] Create `:COACHES` relationships for coaches → teams
- [ ] Add role property to User nodes

### Phase 2: Permission Relationships
- [ ] Create `:CAN_VIEW` relationships (player → own injuries)
- [ ] Create `:CAN_UPDATE` relationships (medical staff → injuries)
- [ ] Create `:HAS_INJURY` relationships (player → injuries)
- [ ] Document permission relationship types

### Phase 3: Permission Query Service
- [ ] Create `GraphPermissionsService` in NestJS
- [ ] Implement `canUserViewInjury(userId, injuryId)` query
- [ ] Implement `canUserUpdateInjury(userId, injuryId)` query
- [ ] Implement `getUserAccessiblePlayers(userId)` query
- [ ] Add caching for frequently checked permissions

### Phase 4: Service Layer Integration
- [ ] Inject `GraphPermissionsService` into domain services
- [ ] Add permission checks before data queries
- [ ] Throw `ForbiddenException` on access denial
- [ ] Filter results based on user access (e.g., only show accessible players)

### Phase 5: Testing & Auditing
- [ ] Test player can only see own injuries
- [ ] Test coach can see team member injuries
- [ ] Test admin has full access
- [ ] Create Cypher queries to audit access ("who can see this injury?")
- [ ] Document permission queries in README
- [ ] Update Swagger with authorization notes

---

## Consequences

### Positive
- **Security:** Protects sensitive medical data from unauthorized access
- **Privacy Compliance:** Enforces player data isolation
- **Flexibility:** Can grant/revoke access dynamically without redeployment
- **Auditability:** Easy to query "who has access to what" using Cypher
- **Visualization:** Can see access relationships in Neo4j Browser
- **Natural Modeling:** Graph structure matches real-world relationships (teams, hierarchies)
- **Scalability:** Graph traversal optimized for relationship queries
- **Fine-Grained Control:** Can model complex access patterns (shared access, delegation)
- **Future-Proof:** Supports evolving requirements without schema changes

### Negative
- **Query Overhead:** Each protected request requires permission check query (~10-50ms)
- **Complexity:** More complex than simple role checks
- **Data Duplication:** User nodes in both PostgreSQL and Neo4j (need sync)
- **Graph Maintenance:** Must keep permission relationships up-to-date
- **Learning Curve:** Team needs to understand Cypher for permission queries

### Neutral
- **Performance Impact:** Moderate - adds one Neo4j query per protected operation
- **Caching Opportunity:** Can cache permission checks to reduce query load
- **Database Load:** Permission queries are simple graph traversals (fast)

---

## Security Considerations

### 1. User Identity Verification
- User pseudonym stored in signed JWT - cannot be modified by client
- Server validates JWT signature on every request
- Permission queries use pseudonym from validated token

### 2. Horizontal Privilege Escalation Prevention
- Graph relationships explicitly define access boundaries
- Player A cannot access Player B's data unless explicit relationship exists
- Coach team membership enforced through `:COACHES` relationships
- No implicit access - all permissions must be explicitly modeled

### 3. Vertical Privilege Escalation Prevention
- Role hierarchy can be modeled in graph if needed
- Permission queries check actual relationships, not assumed roles
- Admin status stored in User node, verified in permission queries

### 4. Permission Manipulation
- Only backend can create/modify permission relationships
- API endpoints for permission changes require admin authentication
- Regular audits of permission graph for anomalies

### 5. Audit Trail
- Log all authorization failures with user and resource IDs
- Track permission grants/revokes in separate audit log
- Query permission history: `MATCH (u:User)-[r:CAN_VIEW]->(i:Injury) RETURN u, r, i`
- Monitor for suspicious access patterns (unusual permission grants)

### 6. Data Synchronization
- User nodes in Neo4j must stay in sync with PostgreSQL accounts
- Trigger user node creation on registration
- Handle user deletion in both databases
- Regular sync validation to detect drift

---

## Monitoring & Metrics

Track the following metrics:
- **Authorization Failures:** Count by role and resource
- **Forbidden Exceptions:** Monitor for privilege escalation attempts
- **Access Patterns:** Player/coach/admin endpoint usage
- **Permission Checks:** Latency of ownership validation queries

---

## Future Considerations

### Potential Enhancements
1. **Permission Caching:** Cache frequently checked permissions in Redis (TTL: 5 minutes)
2. **Time-Based Access:** Add `valid_from` and `valid_until` properties to permission relationships
3. **Delegation:** Allow coaches to temporarily delegate access to assistants
4. **Granular Permissions:** Add `:CAN_EXPORT`, `:CAN_SHARE` for specific operations
5. **Multi-Team Coaches:** Already supported - coach can have multiple `:COACHES` relationships
6. **Access Requests:** Workflow for requesting temporary access (pending → approved → active)
7. **Permission Templates:** Define role-based permission sets that can be applied in bulk
8. **Attribute-Based Access:** Combine graph permissions with attribute checks (time, location)

### Performance Optimization
1. **Query Optimization:** Use indexes on User.pseudonym and Injury.injury_id
2. **Batch Permission Checks:** Check multiple resources in single query
3. **Permission Materialization:** Pre-compute common access patterns
4. **Caching Strategy:** Cache permission results with cache invalidation on permission changes

---

## References

- [ADR-0003: Two-Database Privacy Architecture](adr-0003-two-database-privacy-architecture.md)
- [ADR-0006: JWT Authentication](adr-0006-jwt-authentication.md)
- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [NIST RBAC Standard](https://csrc.nist.gov/projects/role-based-access-control)

---

## Notes

- This ADR focuses on backend authorization only
- Frontend should hide/disable UI elements based on user role
- Authorization is enforced at API layer regardless of frontend state
- Graph-based permissions complement authentication (ADR-0006)
- Permission queries may add ~10-50ms latency per request
- User nodes in Neo4j are synchronized with PostgreSQL user accounts
- All permission checks go through Neo4j - PostgreSQL stores PII only
- Permission relationships are separate from data relationships
- Can visualize entire permission graph: `MATCH (u:User)-[r:CAN_VIEW|CAN_UPDATE]->(resource) RETURN u, r, resource`

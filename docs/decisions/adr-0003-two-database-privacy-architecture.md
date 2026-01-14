# ADR-0003: Two-Database Privacy Architecture

**Status:** Accepted

**Date:** November 2024

**Deciders:** Nathan Dean, Project Supervisor

---

## Context

The Multi-Sport Athlete Injury Surveillance System handles sensitive medical and personal data, requiring strict compliance with:
- **GDPR** (General Data Protection Regulation)
- **Medical data protection standards**
- **Privacy-by-design principles**
- **Data minimization requirements**

### Core Privacy Challenge

The system must:
1. Enable injury tracking and analysis (requires relationships between entities)
2. Protect personal identifiable information (PII) (names, emails, phone numbers)
3. Support pseudonymization for research and analytics
4. Maintain audit trails for compliance
5. Allow data subject access requests (GDPR Article 15)
6. Support right to erasure (GDPR Article 17)

### Options Considered

#### Option 1: Single Database with PII
Store all data including PII in Neo4j with access controls.

**Pros:**
- Simpler architecture
- Single source of truth
- Easier to implement

**Cons:**
- PII exposed in analytical queries
- Risk of accidental data leakage
- Difficult to anonymize for research
- Higher compliance risk
- Data breach affects all information

#### Option 2: Encryption-Only Approach
Store encrypted PII in Neo4j.

**Pros:**
- Single database
- PII protected at rest

**Cons:**
- Encryption keys management complexity
- Can't query encrypted fields effectively
- Performance overhead
- Decryption required for every access
- Key compromise exposes all data

#### Option 3: Two-Database Architecture (Selected)
Separate Neo4j for analytical data and PostgreSQL for identity management.

**Pros:**
- Clear separation of concerns
- Reduced risk surface area
- Can anonymize Neo4j data for research
- Different security policies per database
- Easier to comply with data subject rights
- Audit trail doesn't expose PII

**Cons:**
- More complex architecture
- Need to maintain two databases
- Mapping layer required
- Slightly higher latency for identity resolution

---

## Decision

We will implement a **two-database privacy architecture**:

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│           Application Layer                  │
│  (NestJS Backend with Identity Service)     │
└────────────┬──────────────┬─────────────────┘
             │              │
             │              │
     ┌───────▼──────┐  ┌───▼──────────────┐
     │   Neo4j      │  │   PostgreSQL     │
     │  (Analytics) │  │   (Identity)     │
     └──────────────┘  └──────────────────┘
```

### Database Responsibilities

#### Neo4j (Analytical Data)
Stores:
- **Pseudonymous identifiers** (UUIDs)
- **Relationships** between entities
- **Coded injury data** (body part, type, severity)
- **Aggregated statistics**
- **Temporal data** (dates, timestamps)
- **Audit logs** (access patterns, no PII)

Does NOT store:
- Real names
- Email addresses
- Phone numbers
- Home addresses
- Dates of birth (only age groups)
- Free-text medical notes

#### PostgreSQL (Identity Service)
Stores:
- **Mapping table**: `pseudo_id → real identity`
- **Personal information**: names, emails, phones
- **Emergency contacts**
- **Authentication credentials** (hashed passwords)
- **Device tokens** for notifications

### Data Flow

1. **User Registration**:
   ```
   POST /auth/register
   → Create identity in PostgreSQL (get pseudo_id)
   → Create Player node in Neo4j (using pseudo_id)
   → Return pseudo_id to client
   ```

2. **Data Access**:
   ```
   GET /players/:pseudo_id
   → Query Neo4j for player data (relationships, injuries)
   → Optionally resolve identity from PostgreSQL (if authorized)
   → Return combined response
   ```

3. **Injury Reporting**:
   ```
   POST /injuries
   → Validate user (PostgreSQL)
   → Create Injury node in Neo4j (linked to pseudo_id)
   → No PII stored in Neo4j
   ```

4. **Research Query**:
   ```
   GET /analytics/injury-rates
   → Query Neo4j only (no identity resolution needed)
   → Fully anonymized results
   → Log access in AuditLog (Neo4j)
   ```

---

## Consequences

### Positive

1. **Privacy by Design**
   - PII physically separated from analytical data
   - Breach of one database doesn't compromise the other
   - Easy to provide anonymized data for research

2. **GDPR Compliance**
   - Data minimization: only necessary data in each system
   - Right to erasure: delete from PostgreSQL, keep anonymized Neo4j data
   - Data portability: export from PostgreSQL
   - Audit trails don't expose PII

3. **Security Benefits**
   - Different security policies per database
   - Can encrypt PostgreSQL at rest
   - Neo4j can be accessed by analysts without PII exposure
   - Reduced attack surface

4. **Operational Flexibility**
   - Can backup databases separately
   - Different retention policies
   - Neo4j optimized for relationships
   - PostgreSQL optimized for identity lookups

5. **Research Support**
   - Neo4j data can be shared for research (anonymized)
   - No risk of re-identification
   - Audit trail for research access

### Negative

1. **Complexity**
   - Two databases to maintain
   - Mapping layer required
   - More deployment complexity
   - Need to keep pseudo_id mappings synchronized

2. **Performance**
   - Extra database call to resolve identities
   - Network latency between services
   - Can't use Neo4j for identity lookups

3. **Development Overhead**
   - Two database schemas to manage
   - Two backup strategies
   - Two connection pools
   - Error handling across systems

### Mitigation Strategies

1. **Caching**
   - Cache identity resolutions (with TTL)
   - Reduce PostgreSQL query frequency

2. **Service Layer**
   - Identity resolution service abstracts complexity
   - Single interface for developers
   - Handles errors gracefully

3. **Documentation**
   - Clear guidelines on what goes where
   - Code examples for common operations
   - Visual architecture diagrams

4. **Testing**
   - Integration tests across both databases
   - Consistency checks
   - Privacy compliance tests

---

## Implementation Details

### PostgreSQL Schema

```sql
CREATE TABLE identities (
    pseudo_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE device_tokens (
    id SERIAL PRIMARY KEY,
    pseudo_id UUID REFERENCES identities(pseudo_id),
    token VARCHAR(255) NOT NULL,
    platform VARCHAR(10), -- 'ios' or 'android'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_identities_email ON identities(email);
CREATE INDEX idx_device_tokens_pseudo_id ON device_tokens(pseudo_id);
```

### Neo4j Schema Example

```cypher
CREATE CONSTRAINT player_pseudo_id IF NOT EXISTS
FOR (p:Player) REQUIRE p.pseudoId IS UNIQUE;

CREATE (p:Player {
  pseudoId: 'uuid-here',  // Maps to PostgreSQL
  ageGroup: '20-25',      // Not exact age
  position: 'Forward',
  activeStatus: true
})
```

### Identity Resolution Service

```typescript
@Injectable()
export class IdentityService {
  async resolvePseudoId(pseudoId: string): Promise<PersonalInfo | null> {
    // Query PostgreSQL
    const identity = await this.postgresDb.query(
      'SELECT first_name, last_name, email FROM identities WHERE pseudo_id = $1',
      [pseudoId]
    );
    
    if (!identity.rows.length) return null;
    
    return {
      firstName: identity.rows[0].first_name,
      lastName: identity.rows[0].last_name,
      email: identity.rows[0].email
    };
  }

  async createPseudoId(personalInfo: CreateUserDto): Promise<string> {
    const pseudoId = uuidv4();
    
    await this.postgresDb.query(
      'INSERT INTO identities (pseudo_id, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5)',
      [pseudoId, personalInfo.email, hashedPassword, personalInfo.firstName, personalInfo.lastName]
    );
    
    return pseudoId;
  }
}
```

---

## Privacy Guarantees

### What Neo4j Can Reveal
- Pseudonymous user exists
- Number of injuries
- Injury types and patterns
- Team membership
- Temporal patterns

### What Neo4j Cannot Reveal
- Who the person is (no name)
- How to contact them (no email/phone)
- Exact age (only age group)
- Specific medical details (coded only)

### Identity Resolution Authorization
Only authorized roles can resolve identities:
- **Coaches**: Their own team's players
- **Medical Staff**: Players under their care
- **Admins**: Organization-level access
- **Players**: Only their own identity

All identity resolutions are logged in AuditLog (Neo4j) for compliance.

---

## Related Decisions

- ADR-0002: Neo4j graph database selection
- ADR-0006: JWT authentication (includes role-based access control)
- Future: ADR on data retention policies

---

## Compliance Mapping

| GDPR Requirement | Implementation |
|------------------|----------------|
| Data Minimization | Only essential data in each database |
| Purpose Limitation | Clear separation: analytics vs. identity |
| Storage Limitation | Different retention policies possible |
| Pseudonymization | UUID-based pseudonymous identifiers |
| Right to Access | Query PostgreSQL for user's data |
| Right to Erasure | Delete from PostgreSQL, anonymize Neo4j |
| Data Portability | Export from PostgreSQL |
| Audit Trail | AuditLog nodes in Neo4j |

---

## References

- [GDPR Official Text](https://gdpr-info.eu/)
- [UK ICO: Pseudonymisation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/security/a-guide-to-data-security/pseudonymisation/)
- Literature Review: "Anonymisation and Pseudonymisation of Medical Data"

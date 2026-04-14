# Neo4j Database Documentation
## Multi-Sport Athlete Injury Surveillance System

### Version 1.0 | December 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Privacy Architecture](#privacy-architecture)
3. [Database Schema](#database-schema)
4. [Node Definitions](#node-definitions)
5. [Relationships](#relationships)
6. [Indexes and Constraints](#indexes-and-constraints)
7. [Query Examples](#query-examples)
8. [Privacy Considerations](#privacy-considerations)
9. [Setup Instructions](#setup-instructions)
10. [Integration Guidelines](#integration-guidelines)
11. [Interactive Resources](#interactive-resources)
12. [Maintenance and Monitoring](#maintenance-and-monitoring)

---

## Overview

### Purpose

The Multi-Sport Athlete Injury Surveillance System is designed to track, monitor, and analyze sports-related injuries across multiple sports, teams, and organizations while maintaining strict data privacy and GDPR compliance.

### Key Features

- **Privacy-First Design**: Pseudonymization of all personally identifiable information
- **Comprehensive Tracking**: Monitor injuries from occurrence through treatment to resolution
- **Multi-Sport Support**: Handle multiple sports, teams, and organizational structures
- **Audit Trail**: Complete logging of data access for compliance
- **Temporal Analysis**: Track injury patterns over time and across populations

### Technology Stack

- **Database**: Neo4j (Graph Database)
- **Backend**: NestJS
- **Frontend**: React Native
- **Identity Management**: Separate secure database/service for PII

---

## Privacy Architecture

### Core Privacy Principles

This system implements privacy-by-design following GDPR requirements and medical data protection standards:

1. **Pseudonymization**: All personal identifiers are replaced with pseudonymous UUIDs
2. **Data Minimization**: Only essential data is stored in the graph database
3. **Separation of Concerns**: PII is stored separately from analytical data
4. **Access Control**: Audit logging tracks all access to sensitive information
5. **K-Anonymity**: Generalized attributes (age groups, regions) prevent re-identification

### Two-Database Architecture

```
┌─────────────────────────────┐         ┌─────────────────────────────┐
│     Neo4j Graph Database    │         │   Identity Service (SQL)    │
│                             │         │                             │
│  - Pseudonymized IDs        │◄───────►│  - pseudoId ↔ Real Name    │
│  - Relationships            │  API    │  - pseudoId ↔ Email        │
│  - Coded injury data        │         │  - pseudoId ↔ Phone        │
│  - Analytics data           │         │  - Emergency Contacts      │
│                             │         │                             │
└─────────────────────────────┘         └─────────────────────────────┘
```

**Neo4j stores**: Pseudonymized identifiers, relationships, coded medical data, aggregated statistics

**Identity Service stores**: Real names, email addresses, phone numbers, addresses, emergency contacts

**Access Pattern**: When displaying data to users, the backend fetches pseudonymized data from Neo4j and resolves real identities only when authorized and necessary.

---

## Database Schema

### Entity-Relationship Overview

The database consists of 11 core node types connected through meaningful relationships:

**Core Entities**:
- Player (athletes being monitored)
- Injury (injury incidents and tracking)
- StatusUpdate (ongoing health status monitoring)
- Session (training/match sessions)

**Organizational Entities**:
- Team (sports teams)
- Sport (sport types)
- Organization (clubs, academies, federations)
- Coach (medical and coaching staff)
- Admin (system administrators)

**Compliance Entity**:
- AuditLog (access tracking for GDPR compliance)

---

## Node Definitions

### Player Node

Represents an athlete in the system with pseudonymized identity.

**Properties**:
```cypher
(:Player {
  pseudoId: String (required, unique),
  position: String,
  status: Enum ["active", "inactive", "injured", "suspended"],
  ageGroup: String,
  gender: String,
  createdAt: DateTime (required),
  lastModified: DateTime (required)
})
```

**Property Details**:
- `pseudoId`: UUID that maps to real identity in separate system
- `position`: Playing position (e.g., "forward", "goalkeeper", "midfielder")
- `status`: Current availability status
- `ageGroup`: Generalized age range (e.g., "18-21", "22-25", "26-30") for k-anonymity
- `gender`: For injury pattern analysis across genders

**Privacy Notes**:
- NO real names stored
- NO email addresses
- NO phone numbers
- NO exact date of birth (use age groups)
- All PII stored in separate Identity Service

**Indexes**:
```cypher
CREATE CONSTRAINT player_pseudo_id IF NOT EXISTS 
FOR (p:Player) REQUIRE p.pseudoId IS UNIQUE;

CREATE INDEX player_status IF NOT EXISTS 
FOR (p:Player) ON (p.status);

CREATE INDEX player_age_group IF NOT EXISTS 
FOR (p:Player) ON (p.ageGroup);
```

---

### Injury Node

Represents a specific injury incident with detailed tracking.

**Properties**:
```cypher
(:Injury {
  id: UUID (required, unique),
  bodyPart: String (required),
  injuryType: String (required),
  severity: Integer (required),
  painLevel: Integer (required),
  occurredAt: DateTime (required),
  reportedAt: DateTime (required),
  resolvedAt: DateTime,
  isResolved: Boolean (required),
  mechanism: String,
  estimatedRecoveryDays: Integer
})
```

**Property Details**:
- `bodyPart`: Standardized anatomical location (e.g., "knee", "ankle", "shoulder")
- `injuryType`: Coded injury classification (e.g., "sprain", "fracture", "strain")
- `severity`: Scale 1-5 (1=minor, 5=severe)
- `painLevel`: Scale 0-10 (0=no pain, 10=extreme pain)
- `occurredAt`: When the injury actually happened
- `reportedAt`: When the injury was logged in the system
- `resolvedAt`: When the injury was fully resolved (null if ongoing)
- `isResolved`: Boolean flag for quick filtering
- `mechanism`: How injury occurred, coded (e.g., "contact", "non-contact", "overuse")

**Privacy Notes**:
- NO free-text descriptions (risk of identifying information)
- Use standardized, coded values only
- Detailed medical notes stored separately if needed

**Indexes**:
```cypher
CREATE CONSTRAINT injury_id IF NOT EXISTS 
FOR (i:Injury) REQUIRE i.id IS UNIQUE;

CREATE INDEX injury_occurred IF NOT EXISTS 
FOR (i:Injury) ON (i.occurredAt);

CREATE INDEX injury_body_part IF NOT EXISTS 
FOR (i:Injury) ON (i.bodyPart);

CREATE INDEX injury_resolved IF NOT EXISTS 
FOR (i:Injury) ON (i.isResolved);

CREATE INDEX injury_type IF NOT EXISTS 
FOR (i:Injury) ON (i.injuryType);
```

---

### StatusUpdate Node

Represents periodic health status checks for players.

**Properties**:
```cypher
(:StatusUpdate {
  id: UUID (required, unique),
  status: Enum (required),
  date: DateTime (required),
  painLevel: Integer,
  availability: Enum (required)
})
```

**Property Details**:
- `status`: Current condition - ["healthy", "recovering", "injured", "ill", "training"]
- `date`: When the status check was recorded
- `painLevel`: Current pain level 0-10 (if applicable)
- `availability`: ["available", "limited", "unavailable"]

**Use Case**:
StatusUpdates track day-to-day player condition, allowing coaches to monitor recovery progression and make training/match availability decisions. Unlike Injury nodes which track specific incidents, StatusUpdates provide ongoing monitoring.

**Privacy Notes**:
- NO detailed free-text notes (use coded status values)
- Can be linked to specific injuries for progression tracking

**Indexes**:
```cypher
CREATE CONSTRAINT status_update_id IF NOT EXISTS 
FOR (s:StatusUpdate) REQUIRE s.id IS UNIQUE;

CREATE INDEX status_update_date IF NOT EXISTS 
FOR (s:StatusUpdate) ON (s.date);
```

---

### Session Node

Represents training sessions or matches where injuries may occur.

**Properties**:
```cypher
(:Session {
  id: UUID (required, unique),
  type: Enum (required),
  date: DateTime (required),
  duration: Integer,
  intensity: Enum,
  location: String
})
```

**Property Details**:
- `type`: ["training", "match", "practice", "conditioning"]
- `date`: When the session occurred
- `duration`: Length in minutes
- `intensity`: ["low", "medium", "high", "competitive"]
- `location`: Generalized location ("home", "away", "training_facility")

**Use Case**:
Linking injuries to sessions helps identify patterns (e.g., more injuries during high-intensity training, match-related injuries vs training injuries).

**Indexes**:
```cypher
CREATE CONSTRAINT session_id IF NOT EXISTS 
FOR (s:Session) REQUIRE s.id IS UNIQUE;

CREATE INDEX session_date IF NOT EXISTS 
FOR (s:Session) ON (s.date);
```

---

### Team Node

Represents a sports team within the system.

**Properties**:
```cypher
(:Team {
  id: UUID (required, unique),
  pseudoName: String (required),
  level: String (required),
  season: String,
  createdAt: DateTime (required)
})
```

**Property Details**:
- `pseudoName`: Generic identifier ("Team A", "Team B", "Senior Squad")
- `level`: Competition level ("professional", "semi-professional", "amateur", "youth", "academy")
- `season`: Season identifier (e.g., "2024-2025")

**Privacy Notes**:
- Actual team names stored in Identity Service
- Use generic identifiers in analytics

**Indexes**:
```cypher
CREATE CONSTRAINT team_id IF NOT EXISTS 
FOR (t:Team) REQUIRE t.id IS UNIQUE;
```

---

### Sport Node

Represents different sport types in the system.

**Properties**:
```cypher
(:Sport {
  id: UUID (required, unique),
  name: String (required),
  category: String
})
```

**Property Details**:
- `name`: Sport name ("Football", "Rugby", "Basketball", "GAA Hurling")
- `category`: Sport classification ("team", "individual", "contact", "non-contact")

**Indexes**:
```cypher
CREATE CONSTRAINT sport_id IF NOT EXISTS 
FOR (s:Sport) REQUIRE s.id IS UNIQUE;

CREATE INDEX sport_name IF NOT EXISTS 
FOR (s:Sport) ON (s.name);
```

---

### Organization Node

Represents clubs, academies, federations, or other organizing bodies.

**Properties**:
```cypher
(:Organization {
  id: UUID (required, unique),
  pseudoName: String (required),
  type: String (required),
  region: String,
  createdAt: DateTime (required)
})
```

**Property Details**:
- `pseudoName`: Generic identifier for analytics
- `type`: ["club", "academy", "federation", "school", "university"]
- `region`: Generalized geographic area ("Leinster", "Munster", "North West")

**Privacy Notes**:
- NO specific addresses
- NO contact information
- Real names and details in Identity Service

**Indexes**:
```cypher
CREATE CONSTRAINT organization_id IF NOT EXISTS 
FOR (o:Organization) REQUIRE o.id IS UNIQUE;
```

---

### Coach Node

Represents coaching staff, physiotherapists, and medical personnel.

**Properties**:
```cypher
(:Coach {
  pseudoId: String (required, unique),
  role: String (required),
  specialization: String,
  createdAt: DateTime (required)
})
```

**Property Details**:
- `pseudoId`: Pseudonymized identifier mapping to Identity Service
- `role`: ["head_coach", "assistant_coach", "physiotherapist", "doctor", "trainer", "strength_coach"]
- `specialization`: Area of expertise (e.g., "rehabilitation", "sports_medicine")

**Privacy Notes**:
- NO real names, emails, or phone numbers
- All PII in Identity Service

**Indexes**:
```cypher
CREATE CONSTRAINT coach_pseudo_id IF NOT EXISTS 
FOR (c:Coach) REQUIRE c.pseudoId IS UNIQUE;

CREATE INDEX coach_role IF NOT EXISTS 
FOR (c:Coach) ON (c.role);
```

---

### Admin Node

Represents system administrators with various permission levels.

**Properties**:
```cypher
(:Admin {
  pseudoId: String (required, unique),
  role: Enum (required),
  permissions: [String] (required),
  createdAt: DateTime (required)
})
```

**Property Details**:
- `pseudoId`: Pseudonymized identifier
- `role`: ["system_admin", "org_admin", "data_protection_officer"]
- `permissions`: Array of permission strings (e.g., ["read_all", "write_injuries", "manage_users"])

**Privacy Notes**:
- NO real names or contact info
- All PII in Identity Service

**Indexes**:
```cypher
CREATE CONSTRAINT admin_pseudo_id IF NOT EXISTS 
FOR (a:Admin) REQUIRE a.pseudoId IS UNIQUE;
```

---

### AuditLog Node

Tracks all access to sensitive data for GDPR compliance.

**Properties**:
```cypher
(:AuditLog {
  id: UUID (required, unique),
  action: String (required),
  actorPseudoId: String (required),
  entityType: String (required),
  entityId: String (required),
  timestamp: DateTime (required),
  researchPurpose: String,
  ipAddress: String,
  result: Enum
})
```

**Property Details**:
- `action`: Action performed ("read", "create", "update", "delete", "research_query", "export_for_research")
- `actorPseudoId`: Who performed the action
- `entityType`: Type of node accessed ("Player", "Injury", etc.)
- `entityId`: Specific node accessed
- `timestamp`: When the action occurred
- `researchPurpose`: Coded purpose for research actions (e.g., "injury_pattern_analysis", "recovery_time_study")
- `ipAddress`: Source IP (hashed or anonymized)
- `result`: ["success", "failure", "unauthorized"]

**Use Case**:
Required for GDPR Article 30 (records of processing activities) and demonstrating accountability. The research-specific actions track when admins query data for research purposes, supporting ethical oversight and transparency in data usage.

**Indexes**:
```cypher
CREATE CONSTRAINT audit_log_id IF NOT EXISTS 
FOR (a:AuditLog) REQUIRE a.id IS UNIQUE;

CREATE INDEX audit_timestamp IF NOT EXISTS 
FOR (a:AuditLog) ON (a.timestamp);

CREATE INDEX audit_actor IF NOT EXISTS 
FOR (a:AuditLog) ON (a.actorPseudoId);

CREATE INDEX audit_entity_type IF NOT EXISTS 
FOR (a:AuditLog) ON (a.entityType);
```

---

## Relationships

### Player Relationships

#### HAS_INJURY
```cypher
(player:Player)-[:HAS_INJURY {
  reportedBy: String,
  context: String
}]->(injury:Injury)
```
**Direction**: Player → Injury  
**Cardinality**: One-to-Many (a player can have multiple injuries)  
**Properties**:
- `reportedBy`: pseudoId of coach/staff who reported
- `context`: Brief coded context ("match", "training")

---

#### HAD_STATUS
```cypher
(player:Player)-[:HAD_STATUS]->(statusUpdate:StatusUpdate)
```
**Direction**: Player → StatusUpdate  
**Cardinality**: One-to-Many  
**Purpose**: Track all status updates for a player over time

---

#### BELONGS_TO
```cypher
(player:Player)-[:BELONGS_TO {
  joinedDate: DateTime,
  leftDate: DateTime,
  jerseyNumber: Integer
}]->(team:Team)
```
**Direction**: Player → Team  
**Cardinality**: Many-to-Many (players can change teams)  
**Properties**:
- `joinedDate`: When player joined this team
- `leftDate`: When player left (null if current)
- `jerseyNumber`: Player's number on this team

---

#### PARTICIPATED_IN
```cypher
(player:Player)-[:PARTICIPATED_IN {
  minutesPlayed: Integer,
  role: String
}]->(session:Session)
```
**Direction**: Player → Session  
**Cardinality**: Many-to-Many  
**Properties**:
- `minutesPlayed`: Duration of participation
- `role`: Player's role in that session

---

### Injury Relationships

#### RELATES_TO
```cypher
(statusUpdate:StatusUpdate)-[:RELATES_TO]->(injury:Injury)
```
**Direction**: StatusUpdate → Injury  
**Cardinality**: Many-to-One  
**Purpose**: Link status updates to specific injuries for progression tracking

---

#### OCCURRED_IN
```cypher
(injury:Injury)-[:OCCURRED_IN {
  minuteOccurred: Integer
}]->(session:Session)
```
**Direction**: Injury → Session  
**Cardinality**: Many-to-One  
**Properties**:
- `minuteOccurred`: When in the session the injury happened

---

### Coach Relationships

#### MANAGES
```cypher
(coach:Coach)-[:MANAGES {
  startDate: DateTime,
  endDate: DateTime
}]->(player:Player)
```
**Direction**: Coach → Player  
**Cardinality**: One-to-Many  
**Properties**:
- `startDate`: When coaching relationship started
- `endDate`: When it ended (null if current)

---

#### MONITORS
```cypher
(coach:Coach)-[:MONITORS]->(injury:Injury)
```
**Direction**: Coach → Injury  
**Cardinality**: Many-to-Many  
**Purpose**: Track which coaches are monitoring which injuries

---

#### RECORDED
```cypher
(coach:Coach)-[:RECORDED {
  timestamp: DateTime
}]->(statusUpdate:StatusUpdate)
```
**Direction**: Coach → StatusUpdate  
**Cardinality**: One-to-Many  
**Properties**:
- `timestamp`: When the update was recorded

---

#### EMPLOYED_BY
```cypher
(coach:Coach)-[:EMPLOYED_BY {
  startDate: DateTime,
  endDate: DateTime,
  employmentType: String
}]->(organization:Organization)
```
**Direction**: Coach → Organization  
**Cardinality**: Many-to-Many  
**Properties**:
- `startDate`: Employment start
- `endDate`: Employment end (null if current)
- `employmentType`: ["full-time", "part-time", "contractor"]

---

### Team Relationships

#### PARTICIPATES_IN
```cypher
(team:Team)-[:PARTICIPATES_IN]->(sport:Sport)
```
**Direction**: Team → Sport  
**Cardinality**: Many-to-One (teams belong to one sport)

---

#### PART_OF
```cypher
(team:Team)-[:PART_OF]->(organization:Organization)
```
**Direction**: Team → Organization  
**Cardinality**: Many-to-One

---

### Organization Relationships

#### ADMINISTERS
```cypher
(admin:Admin)-[:ADMINISTERS {
  assignedDate: DateTime
}]->(organization:Organization)
```
**Direction**: Admin → Organization  
**Cardinality**: Many-to-Many  
**Properties**:
- `assignedDate`: When admin was assigned to this organization

---

### Audit Relationships

#### TRACKS_ACCESS_TO
```cypher
(auditLog:AuditLog)-[:TRACKS_ACCESS_TO]->(entity)
```
**Direction**: AuditLog → Any Node  
**Cardinality**: Many-to-One  
**Purpose**: Link audit logs to the entities they track

---

## Indexes and Constraints

### Complete Index and Constraint Setup

```cypher
// Player
CREATE CONSTRAINT player_pseudo_id IF NOT EXISTS 
FOR (p:Player) REQUIRE p.pseudoId IS UNIQUE;

CREATE INDEX player_status IF NOT EXISTS 
FOR (p:Player) ON (p.status);

CREATE INDEX player_age_group IF NOT EXISTS 
FOR (p:Player) ON (p.ageGroup);

CREATE INDEX player_position IF NOT EXISTS 
FOR (p:Player) ON (p.position);

// Injury
CREATE CONSTRAINT injury_id IF NOT EXISTS 
FOR (i:Injury) REQUIRE i.id IS UNIQUE;

CREATE INDEX injury_occurred IF NOT EXISTS 
FOR (i:Injury) ON (i.occurredAt);

CREATE INDEX injury_body_part IF NOT EXISTS 
FOR (i:Injury) ON (i.bodyPart);

CREATE INDEX injury_resolved IF NOT EXISTS 
FOR (i:Injury) ON (i.isResolved);

CREATE INDEX injury_type IF NOT EXISTS 
FOR (i:Injury) ON (i.injuryType);

CREATE INDEX injury_severity IF NOT EXISTS 
FOR (i:Injury) ON (i.severity);

// StatusUpdate
CREATE CONSTRAINT status_update_id IF NOT EXISTS 
FOR (s:StatusUpdate) REQUIRE s.id IS UNIQUE;

CREATE INDEX status_update_date IF NOT EXISTS 
FOR (s:StatusUpdate) ON (s.date);

CREATE INDEX status_update_status IF NOT EXISTS 
FOR (s:StatusUpdate) ON (s.status);

// Session
CREATE CONSTRAINT session_id IF NOT EXISTS 
FOR (s:Session) REQUIRE s.id IS UNIQUE;

CREATE INDEX session_date IF NOT EXISTS 
FOR (s:Session) ON (s.date);

CREATE INDEX session_type IF NOT EXISTS 
FOR (s:Session) ON (s.type);

// Team
CREATE CONSTRAINT team_id IF NOT EXISTS 
FOR (t:Team) REQUIRE t.id IS UNIQUE;

// Sport
CREATE CONSTRAINT sport_id IF NOT EXISTS 
FOR (s:Sport) REQUIRE s.id IS UNIQUE;

CREATE INDEX sport_name IF NOT EXISTS 
FOR (s:Sport) ON (s.name);

// Organization
CREATE CONSTRAINT organization_id IF NOT EXISTS 
FOR (o:Organization) REQUIRE o.id IS UNIQUE;

// Coach
CREATE CONSTRAINT coach_pseudo_id IF NOT EXISTS 
FOR (c:Coach) REQUIRE c.pseudoId IS UNIQUE;

CREATE INDEX coach_role IF NOT EXISTS 
FOR (c:Coach) ON (c.role);

// Admin
CREATE CONSTRAINT admin_pseudo_id IF NOT EXISTS 
FOR (a:Admin) REQUIRE a.pseudoId IS UNIQUE;

// AuditLog
CREATE CONSTRAINT audit_log_id IF NOT EXISTS 
FOR (a:AuditLog) REQUIRE a.id IS UNIQUE;

CREATE INDEX audit_timestamp IF NOT EXISTS 
FOR (a:AuditLog) ON (a.timestamp);

CREATE INDEX audit_actor IF NOT EXISTS 
FOR (a:AuditLog) ON (a.actorPseudoId);

CREATE INDEX audit_entity_type IF NOT EXISTS 
FOR (a:AuditLog) ON (a.entityType);
```

---

## Query Examples

### Basic Queries

#### Get all active injuries for a player
```cypher
MATCH (p:Player {pseudoId: $playerId})-[:HAS_INJURY]->(i:Injury {isResolved: false})
RETURN i
ORDER BY i.occurredAt DESC
```

#### Find players currently injured
```cypher
MATCH (p:Player)-[:HAS_INJURY]->(i:Injury {isResolved: false})
RETURN p.pseudoId, COUNT(i) as activeInjuries
ORDER BY activeInjuries DESC
```

#### Get injury history for a player
```cypher
MATCH (p:Player {pseudoId: $playerId})-[:HAS_INJURY]->(i:Injury)
RETURN i
ORDER BY i.occurredAt DESC
```

---

### Analytics Queries

#### Injury rate by body part for a team
```cypher
MATCH (p:Player)-[:BELONGS_TO]->(t:Team {id: $teamId})
MATCH (p)-[:HAS_INJURY]->(i:Injury)
WHERE i.occurredAt >= datetime($startDate) AND i.occurredAt <= datetime($endDate)
RETURN i.bodyPart, COUNT(i) as injuryCount
ORDER BY injuryCount DESC
```

#### Average recovery time by injury type
```cypher
MATCH (i:Injury {isResolved: true})
WHERE i.resolvedAt IS NOT NULL
WITH i, duration.between(i.occurredAt, i.resolvedAt).days as recoveryDays
RETURN i.injuryType, AVG(recoveryDays) as avgRecoveryDays, COUNT(i) as totalInjuries
ORDER BY avgRecoveryDays DESC
```

#### Injuries by session type (training vs match)
```cypher
MATCH (i:Injury)-[:OCCURRED_IN]->(s:Session)
WHERE i.occurredAt >= datetime($startDate)
RETURN s.type, COUNT(i) as injuryCount
ORDER BY injuryCount DESC
```

#### Players with most injuries in current season
```cypher
MATCH (p:Player)-[:HAS_INJURY]->(i:Injury)
WHERE i.occurredAt >= datetime($seasonStart)
RETURN p.pseudoId, p.position, COUNT(i) as injuryCount
ORDER BY injuryCount DESC
LIMIT 10
```

---

### Progression Tracking Queries

#### Track injury recovery progression
```cypher
MATCH (p:Player {pseudoId: $playerId})-[:HAS_INJURY]->(i:Injury {id: $injuryId})
MATCH (p)-[:HAD_STATUS]->(s:StatusUpdate)-[:RELATES_TO]->(i)
RETURN s.date, s.status, s.painLevel, s.availability
ORDER BY s.date ASC
```

---

### Privacy and Audit Queries

#### Get audit log for a specific player
```cypher
MATCH (a:AuditLog)-[:TRACKS_ACCESS_TO]->(p:Player {pseudoId: $playerId})
RETURN a.timestamp, a.action, a.actorPseudoId, a.result
ORDER BY a.timestamp DESC
LIMIT 50
```

#### Find who accessed injury data
```cypher
MATCH (a:AuditLog {entityType: "Injury", entityId: $injuryId})
RETURN a.timestamp, a.actorPseudoId, a.action, a.result
ORDER BY a.timestamp DESC
```

#### Get all data access by a specific user
```cypher
MATCH (a:AuditLog {actorPseudoId: $userPseudoId})
WHERE a.timestamp >= datetime($startDate)
RETURN a.timestamp, a.action, a.entityType, a.entityId, a.result
ORDER BY a.timestamp DESC
```

#### Track research queries by admins
```cypher
MATCH (a:AuditLog)
WHERE a.action IN ['research_query', 'export_for_research']
  AND a.timestamp >= datetime($startDate)
RETURN a.actorPseudoId, a.researchPurpose, COUNT(*) as queryCount, 
       COLLECT(DISTINCT a.entityType) as dataTypesAccessed
ORDER BY queryCount DESC
```

---

### Complex Analysis Queries

#### Find injury patterns by position
```cypher
MATCH (p:Player)-[:HAS_INJURY]->(i:Injury)
WHERE i.occurredAt >= datetime($startDate)
RETURN p.position, i.bodyPart, COUNT(i) as frequency
ORDER BY p.position, frequency DESC
```

#### Compare injury rates across age groups
```cypher
MATCH (p:Player)-[:HAS_INJURY]->(i:Injury)
WHERE i.occurredAt >= datetime($startDate)
WITH p.ageGroup, COUNT(DISTINCT p) as playerCount, COUNT(i) as injuryCount
RETURN p.ageGroup, injuryCount, playerCount, 
       round(toFloat(injuryCount) / playerCount, 2) as injuriesPerPlayer
ORDER BY injuriesPerPlayer DESC
```

#### Identify high-risk sessions
```cypher
MATCH (s:Session)<-[:OCCURRED_IN]-(i:Injury)
WITH s, COUNT(i) as injuryCount
WHERE injuryCount > 1
RETURN s.date, s.type, s.intensity, injuryCount
ORDER BY injuryCount DESC
```

---

## Privacy Considerations

### GDPR Compliance

This database design implements several GDPR requirements:

**Article 25 - Data Protection by Design**
- Pseudonymization is built into the core architecture
- Minimal data collection (only what's necessary)
- Privacy controls at the database level

**Article 30 - Records of Processing**
- AuditLog nodes track all access to personal data
- Complete trail of who accessed what and when

**Article 32 - Security of Processing**
- Separation of PII and analytical data
- Access controls enforced at application layer
- Audit logging for accountability

**Article 17 - Right to Erasure**
- Pseudonymization allows deletion of identity mapping while preserving anonymized analytics
- Clear separation allows compliance with deletion requests

### Data Anonymization Levels

The system supports multiple levels of data access:

**Level 1 - Fully Identified**
- Identity Service + Neo4j data combined
- For authorized medical staff and coaches
- Full audit logging required

**Level 2 - Pseudonymized**
- Neo4j data with pseudoIds
- For team administrators and analysts
- Cannot identify individuals without Identity Service access

**Level 3 - Aggregated/Anonymized**
- Statistical queries only
- No individual player data
- For researchers and general reporting
- K-anonymity ensured (minimum group size of 5)

### Best Practices

1. **Never store PII in Neo4j**
   - Names, emails, phone numbers belong in Identity Service
   - Use pseudoIds exclusively

2. **Avoid free-text fields**
   - Use coded/standardized values
   - Free text can leak identifying information

3. **Generalize when possible**
   - Age groups instead of exact ages
   - Regions instead of specific addresses
   - Coded descriptions instead of detailed narratives

4. **Implement access controls**
   - Role-based access at application layer
   - Log all access to sensitive data
   - Regular audit reviews

5. **Data retention policies**
   - Define how long data is kept
   - Automated deletion of old data
   - Clear process for data subject requests

---

## Setup Instructions

### Prerequisites

- Neo4j Desktop or Neo4j Database (version 5.x or higher)
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation Steps

**1. Install Neo4j**

Download and install Neo4j Desktop from: https://neo4j.com/download/

**2. Create Database**

In Neo4j Desktop:
- Click "New" → "Create Project"
- Click "Add" → "Local DBMS"
- Set name: "InjurySurveillanceDB"
- Set password (remember this for connection string)
- Click "Create"

**3. Start Database**

- Click "Start" on your database
- Wait for it to show as "Running"

**4. Apply Schema**

Open Neo4j Browser (click "Open" on your database) and run the constraint and index creation scripts from the "Indexes and Constraints" section above.

**5. Configure Connection**

In your NestJS application:

```typescript
// app.module.ts or database.module.ts
import { Module } from '@nestjs/common';
import neo4j from 'neo4j-driver';

@Module({
  providers: [
    {
      provide: 'NEO4J_DRIVER',
      useFactory: () => {
        return neo4j.driver(
          'bolt://localhost:7687',
          neo4j.auth.basic('neo4j', 'your-password')
        );
      },
    },
  ],
  exports: ['NEO4J_DRIVER'],
})
export class DatabaseModule {}
```

**6. Install Neo4j Driver**

```bash
npm install neo4j-driver
```

---

## Integration Guidelines

### NestJS Service Example

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';

@Injectable()
export class InjuryService {
  constructor(@Inject('NEO4J_DRIVER') private driver: Driver) {}

  async createInjury(playerId: string, injuryData: any) {
    const session: Session = this.driver.session();
    
    try {
      const result = await session.run(
        `
        MATCH (p:Player {pseudoId: $playerId})
        CREATE (i:Injury {
          id: randomUUID(),
          bodyPart: $bodyPart,
          injuryType: $injuryType,
          severity: $severity,
          painLevel: $painLevel,
          occurredAt: datetime($occurredAt),
          reportedAt: datetime(),
          isResolved: false,
          mechanism: $mechanism
        })
        CREATE (p)-[:HAS_INJURY {
          reportedBy: $reportedBy,
          context: $context
        }]->(i)
        RETURN i
        `,
        {
          playerId,
          bodyPart: injuryData.bodyPart,
          injuryType: injuryData.injuryType,
          severity: injuryData.severity,
          painLevel: injuryData.painLevel,
          occurredAt: injuryData.occurredAt,
          mechanism: injuryData.mechanism,
          reportedBy: injuryData.reportedBy,
          context: injuryData.context,
        }
      );
      
      return result.records[0].get('i').properties;
    } finally {
      await session.close();
    }
  }

  async getActiveInjuries(playerId: string) {
    const session: Session = this.driver.session();
    
    try {
      const result = await session.run(
        `
        MATCH (p:Player {pseudoId: $playerId})-[:HAS_INJURY]->(i:Injury {isResolved: false})
        RETURN i
        ORDER BY i.occurredAt DESC
        `,
        { playerId }
      );
      
      return result.records.map(record => record.get('i').properties);
    } finally {
      await session.close();
    }
  }

  async resolveInjury(injuryId: string) {
    const session: Session = this.driver.session();
    
    try {
      const result = await session.run(
        `
        MATCH (i:Injury {id: $injuryId})
        SET i.isResolved = true,
            i.resolvedAt = datetime(),
            i.lastModified = datetime()
        RETURN i
        `,
        { injuryId }
      );
      
      return result.records[0].get('i').properties;
    } finally {
      await session.close();
    }
  }
}
```

### Audit Logging Integration

```typescript
@Injectable()
export class AuditService {
  constructor(@Inject('NEO4J_DRIVER') private driver: Driver) {}

  async logAccess(
    actorPseudoId: string,
    action: string,
    entityType: string,
    entityId: string,
    result: string,
    researchPurpose?: string
  ) {
    const session: Session = this.driver.session();
    
    try {
      await session.run(
        `
        CREATE (a:AuditLog {
          id: randomUUID(),
          action: $action,
          actorPseudoId: $actorPseudoId,
          entityType: $entityType,
          entityId: $entityId,
          timestamp: datetime(),
          researchPurpose: $researchPurpose,
          result: $result
        })
        WITH a
        MATCH (entity)
        WHERE id(entity) = $entityId OR entity.id = $entityId OR entity.pseudoId = $entityId
        CREATE (a)-[:TRACKS_ACCESS_TO]->(entity)
        `,
        {
          action,
          actorPseudoId,
          entityType,
          entityId,
          researchPurpose,
          result,
        }
      );
    } finally {
      await session.close();
    }
  }
  
  async logResearchQuery(
    adminPseudoId: string,
    researchPurpose: string,
    entityTypes: string[],
    result: string
  ) {
    // Log research query with specific purpose
    await this.logAccess(
      adminPseudoId,
      'research_query',
      'Multiple',
      'aggregated_data',
      result,
      researchPurpose
    );
  }
}
```

### Identity Resolution Service

```typescript
@Injectable()
export class IdentityService {
  // This would connect to your separate Identity database
  constructor(@Inject('IDENTITY_DB') private identityDb: any) {}

  async resolvePseudoId(pseudoId: string): Promise<PersonalInfo> {
    // Query separate secure database
    const identity = await this.identityDb.query(
      'SELECT * FROM identities WHERE pseudo_id = ?',
      [pseudoId]
    );
    
    return {
      name: identity.name,
      email: identity.email,
      phone: identity.phone,
    };
  }

  async createPseudoId(personalInfo: PersonalInfo): Promise<string> {
    const pseudoId = uuidv4();
    
    await this.identityDb.query(
      'INSERT INTO identities (pseudo_id, name, email, phone) VALUES (?, ?, ?, ?)',
      [pseudoId, personalInfo.name, personalInfo.email, personalInfo.phone]
    );
    
    return pseudoId;
  }
}
```

---

## Interactive Resources

### Visualization Tools

- **[Interactive Neo4j Schema Diagram](https://nathan-dean371.github.io/FYP-Documentation-Repo/Html%20Docs/Neo4j-Schema-Interactive.html)** - Visual representation of all nodes, relationships, and properties. Use this for understanding the complete database structure at a glance and exploring how entities connect.

- **[API Endpoints Documentation](https://nathan-dean371.github.io/FYP-Documentation-Repo/Html%20Docs/api_endpoints.html)** - Complete reference for all available API endpoints, including request/response examples, authentication requirements, and error handling.

These interactive resources complement this documentation and provide alternative ways to explore the system architecture and API capabilities.

---

## Maintenance and Monitoring

### Regular Maintenance Tasks

**1. Database Statistics**
```cypher
// Check node counts
MATCH (n) RETURN labels(n) as label, COUNT(n) as count
ORDER BY count DESC

// Check relationship counts
MATCH ()-[r]->() RETURN type(r) as relationship, COUNT(r) as count
ORDER BY count DESC
```

**2. Performance Monitoring**
```cypher
// Find slow queries (requires query logging enabled)
CALL dbms.listQueries()
YIELD query, elapsedTimeMillis
WHERE elapsedTimeMillis > 1000
RETURN query, elapsedTimeMillis
ORDER BY elapsedTimeMillis DESC
```

**3. Audit Log Review**
```cypher
// Review recent access patterns
MATCH (a:AuditLog)
WHERE a.timestamp >= datetime() - duration('P7D')
RETURN a.actorPseudoId, a.action, COUNT(*) as accessCount
ORDER BY accessCount DESC
```

### Backup Strategy

- Daily automated backups of Neo4j database
- Separate encrypted backups of Identity Service database
- Test restoration procedures quarterly
- Retain backups according to data retention policy

### Security Recommendations

1. Enable encryption at rest for Neo4j
2. Use SSL/TLS for all database connections
3. Implement IP allowlisting for database access
4. Regular security audits of access logs
5. Rotate database credentials quarterly
6. Implement rate limiting on API endpoints
7. Use prepared statements to prevent Cypher injection

---

## Future Enhancements

### Potential Additions

1. **Machine Learning Integration**
   - Injury prediction models based on historical patterns
   - Risk scoring for players
   - Automated anomaly detection

2. **Enhanced Analytics**
   - Comparative analysis across organizations
   - Benchmarking tools
   - Real-time dashboards

3. **Integration APIs**
   - Wearable device data integration
   - Medical imaging system connections
   - Third-party analytics tools

4. **Advanced Privacy Features**
   - Differential privacy for statistical queries
   - Homomorphic encryption for certain operations
   - Enhanced k-anonymity controls

---

## Troubleshooting

### Common Issues

**Connection Refused**
- Verify Neo4j database is running
- Check connection string and credentials
- Ensure firewall allows port 7687

**Slow Queries**
- Verify all indexes are created
- Use EXPLAIN and PROFILE to analyze query plans
- Consider adding additional indexes for common query patterns

**Memory Issues**
- Adjust heap size in neo4j.conf
- Implement pagination for large result sets
- Use streaming for bulk operations

---

## Support and Documentation

### Additional Resources

- Neo4j Documentation: https://neo4j.com/docs/
- Cypher Query Language: https://neo4j.com/docs/cypher-manual/
- GDPR Compliance: https://gdpr.eu/
- NestJS Documentation: https://docs.nestjs.com/

### Contact

For questions or issues related to this database schema, please contact your project supervisor or the development team.

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Author**: Nathan - ATU Final Year Project  
**Project**: Multi-Sport Athlete Injury Surveillance System
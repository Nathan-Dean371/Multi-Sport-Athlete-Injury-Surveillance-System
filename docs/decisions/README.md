# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the Multi-Sport Athlete Injury Surveillance System.

---

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. ADRs help us understand:
- Why we made certain technical choices
- What alternatives we considered
- What trade-offs we accepted
- What consequences (positive and negative) resulted

---

## ADR Format

Each ADR follows this structure:

- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Date**: When the decision was made
- **Deciders**: Who was involved in the decision
- **Context**: The problem and why we need to make a decision
- **Decision**: What we decided to do
- **Consequences**: Positive, negative, and mitigation strategies
- **Related Decisions**: Links to other ADRs
- **References**: External resources

---

## Index of ADRs

### Core Architecture

- **[ADR-0001: Monorepo Architecture](./adr-0001-monorepo-architecture.md)**
  - Status: Accepted
  - Summary: Use a monorepo to contain mobile, web, backend, and shared code for easier submission and code sharing

- **[ADR-0002: Neo4j Graph Database](./adr-0002-neo4j-graph-database.md)**
  - Status: Accepted
  - Summary: Use Neo4j as the primary database for relationship-heavy injury tracking data

- **[ADR-0003: Two-Database Privacy Architecture](./adr-0003-two-database-privacy-architecture.md)**
  - Status: Accepted
  - Summary: Separate Neo4j (analytical) and PostgreSQL (identity) databases for GDPR compliance and privacy-by-design

### Technology Stack

- **[ADR-0004: NestJS Backend Framework](./adr-0004-nestjs-backend-framework.md)**
  - Status: Accepted
  - Summary: Use NestJS for structured, TypeScript-first backend development with dependency injection

- **[ADR-0005: React Native for Mobile](./adr-0005-react-native-mobile.md)**
  - Status: Accepted
  - Summary: Use React Native with Expo for cross-platform mobile development with TypeScript

### Security & Authentication

- **[ADR-0006: JWT-Based Authentication](./adr-0006-jwt-authentication.md)**
  - Status: Accepted
  - Summary: Implement stateless JWT authentication with refresh token rotation for mobile and web clients

### Implementation Strategy

- **[ADR-0004.1: MVP Endpoints Implementation Strategy](./adr-0004.1-mvp-endpoints-implementation.md)**
  - Status: Accepted
  - Summary: Phased implementation of backend endpoints prioritized by critical path (auth, players, injuries, coaches)

### Quality Assurance

- **[ADR-0008: Testing Strategy Before Cloud Deployment](./adr-0008-testing-before-deployment.md)**
  - Status: In Progress
  - Summary: Implement comprehensive test suite (unit, integration, E2E) before deploying to Azure or Railway

### Frontend

- **[ADR-0007: React Web Dashboard Technology](./adr-0007-react-web-dashboard.md)**
  - Status: Proposed
  - Summary: Use Vite + React + TypeScript for fast, modern web dashboard with Material-UI components

---

## Future ADRs

The following decisions may need ADRs as development progresses:

### Planned
- **ADR-0009**: Firebase Cloud Messaging for Notifications
- **ADR-0010**: Deployment Strategy (Docker, CI/CD, Azure vs Railway)
- **ADR-0011**: Containerization and Infrastructure as Code

### Potential
- State management strategy (React Query, Redux, Context)
- API versioning approach
- Error handling and logging strategy
- Data retention and backup policies
- Internationalization (i18n) approach
- Offline-first capabilities
- Performance monitoring
- Analytics and telemetry

---

## Creating New ADRs

When creating a new ADR:

1. Use the numbering scheme: `adr-XXXX-short-title.md`
2. Follow the standard ADR format
3. Update this index file
4. Link to related ADRs
5. Include consequences (both positive and negative)

### Template

```markdown
# ADR-XXXX: Title

**Status:** Proposed | Accepted | Deprecated | Superseded

**Date:** YYYY-MM-DD

**Deciders:** Names

---

## Context

What is the issue we're facing? Why do we need to make this decision?

## Decision

What are we going to do?

## Consequences

### Positive
- What are the benefits?

### Negative
- What are the drawbacks?

### Mitigation
- How do we address the negative consequences?

## Related Decisions
- Links to other ADRs

## References
- External resources
```

---

## ADR Lifecycle

1. **Proposed**: Decision under discussion
2. **Accepted**: Decision made and being implemented
3. **Deprecated**: Decision no longer relevant
4. **Superseded**: Replaced by another ADR

---

## Reviewing ADRs

ADRs should be reviewed:
- At the end of each sprint
- When implementing the related feature
- When experiencing consequences not originally anticipated
- At project milestones

Review dates are included in each ADR where appropriate.

---

## Related Documentation

- **[Neo4j Database Documentation](../../FYP-Documentation-Repo/neo4j_database_documentation.md)**: Comprehensive database schema and query examples
- **[Sprint Planning](../sprints/)**: Sprint-by-sprint implementation plans
- **[Architecture Diagrams](../architecture/)**: Visual representations of system architecture

---

**Last Updated**: January 2025
**Total ADRs**: 7
**Status Summary**: 7 Accepted, 0 Proposed, 0 Deprecated, 0 Superseded

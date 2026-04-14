# Documentation

Project documentation including setup guides, architecture decisions, feature implementation notes, and testing guidance.

---

## 🚀 Getting Started (Start Here!)

### First Time Setup?
- **[Quick Start Guide](setup/QUICK_START.md)** - Get everything running in ~15 minutes ⭐
- **[Docker Troubleshooting](setup/docker-troubleshooting.md)** - Common issues and fixes

### Individual Component Setup
- **[PostgreSQL Setup](setup/postgres-setup-guide.md)** - Identity service & PII storage
- **[Neo4j Setup](setup/neo4j-setup-guide.md)** - Graph database for relationships
- **[Mobile App Setup](setup/mobile-app-setup.md)** - Run on iOS/Android device
- **[Swagger Setup](setup/SWAGGER-SETUP-GUIDE.md)** - API documentation

---

## 🏗️ System Architecture & Design

### Overview
- **[Architecture Overview](architecture/README.md)** - System diagrams and components
- **[Schema Management Workflow](architecture/schema-management-workflow.md)** - Database migrations

### Decision Records (ADRs)
- **[All ADRs](decisions/README.md)** - Search all architecture decisions
- Key decisions:
  - [Monorepo Architecture](decisions/adr-0001-monorepo-architecture.md)
  - [Two-Database Privacy Design](decisions/adr-0003-two-database-privacy-architecture.md)
  - [NestJS Backend](decisions/adr-0004-nestjs-backend-framework.md)
  - [JWT Authentication](decisions/adr-0006-jwt-authentication.md)

---

## 🎯 Feature Documentation

### Major Features
- **[Authentication Implementation](authentication-implementation.md)** - JWT login/registration, session management
- **[Coach Injury Reporting](COACH-INJURY-REPORTING.md)** - Enhanced injury reporting workflow for coaches
- **[Report Builder](REPORT-BUILDER.md)** - Dynamic analytics and reporting dashboard

---

## ✅ Testing & Quality

- **[Testing Strategy](TESTING-STRATEGY.md)** - Unit, integration, E2E testing approach
- **[Database Tests](tests/database-tests.md)** - Database connectivity smoke tests
- **[Test Database Setup](tests/TEST-DATABASE-SETUP.md)** - Configure test databases

---

## 📌 Implementation Milestones

- **[Implementation History](sprints/README.md)** - Archived planning notes and implementation checkpoints

---

## 🧾 Feature Changelog (Lightweight)

This project was developed by defining architecture and feature goals first, then implementing directly.

| Feature | Implemented | Status | Documentation |
|---|---|---|---|
| JWT Authentication Module | January 2026 | ✅ Complete | [Authentication Implementation](authentication-implementation.md) |
| Coach Injury Reporting Workflow | February 2026 | ✅ Complete | [Coach Injury Reporting](COACH-INJURY-REPORTING.md) |
| Report Builder Dashboard | 2026 | ✅ Complete | [Report Builder](REPORT-BUILDER.md) |

---

## 🎓 Documentation Standards

- **[Documentation Style Guide](DOCUMENTATION-STYLE-GUIDE.md)** - How to write consistent docs
- Templates and naming conventions for all document types

---

## Subfolders Reference

| Folder | Contents |
|---|---|
| `setup/` | Installation and configuration guides for all components |
| `architecture/` | System architecture, diagrams, and design documentation |
| `decisions/` | Architecture Decision Records (ADRs) with rationale |
| `sprints/` | Archived planning notes and implementation history |
| `tests/` | Testing guides and test database setup |

---

## 📚 Quick Links by Role

### For Backend Developers
1. [Quick Start](setup/QUICK_START.md)
2. [Testing Strategy](TESTING-STRATEGY.md)
3. [Authentication Impl](authentication-implementation.md)
4. [ADR Index](decisions/README.md)

### For Mobile Developers
1. [Quick Start](setup/QUICK_START.md)
2. [Mobile App Setup](setup/mobile-app-setup.md)
3. [Coach Injury Reporting](COACH-INJURY-REPORTING.md)
4. [Architecture Overview](architecture/README.md)

### For Web/Admin Dashboard
1. [Quick Start](setup/QUICK_START.md)
2. [Report Builder](REPORT-BUILDER.md)
3. [Architecture Overview](architecture/README.md)

### For DevOps/DevEx Engineers
1. [Quick Start](setup/QUICK_START.md)
2. [Docker Troubleshooting](setup/docker-troubleshooting.md)
3. [Schema Management](architecture/schema-management-workflow.md)

### For Project Managers
1. [Implementation History](sprints/README.md)
2. [Architecture Overview](architecture/README.md)
3. [Decision Records](decisions/README.md)
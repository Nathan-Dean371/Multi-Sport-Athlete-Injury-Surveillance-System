# FYP Documentation Repository

## Multi-Sport Athlete Injury Surveillance System

Documentation repository for my Final Year Project at Atlantic Technological University. This repository contains comprehensive technical documentation, interactive visualizations, and architectural diagrams for a privacy-focused sports injury tracking system.

---

## Project Overview

This system provides a complete solution for tracking and analyzing sports-related injuries across multiple sports, teams, and organizations while maintaining strict GDPR compliance and data privacy standards.

### Key Features

- Privacy-first architecture with pseudonymization of all personally identifiable information
- Comprehensive injury tracking from occurrence through treatment to resolution
- Multi-sport and multi-team support with flexible organizational structures
- Complete audit trail for compliance and access monitoring
- Temporal analysis capabilities for identifying injury patterns

### Technology Stack

- **Frontend**: React Native
- **Backend**: NestJS
- **Database**: Neo4j (Graph Database)
- **Identity Management**: Separate secure database for PII storage

---

## Documentation Structure

### Core Documentation

- **[Neo4j Database Documentation](neo4j_database_documentation.md)** - Complete database schema, node definitions, relationships, query examples, and integration guidelines. This is the primary technical reference for the system's data architecture.

### Interactive Resources

The following HTML-based interactive documentation is hosted via GitHub Pages and provides visual exploration of the system:

- **[Interactive Neo4j Schema](https://nathan-dean371.github.io/FYP-Documentation-Repo/Html%20Docs/Neo4j-Schema-Interactive.html)** - Visual representation of all database nodes, relationships, and properties. Use this to understand the complete database structure and explore entity connections.

- **[API Endpoints Documentation](https://nathan-dean371.github.io/FYP-Documentation-Repo/Html%20Docs/api_endpoints.html)** - Complete API reference including request/response examples, authentication requirements, and error handling specifications.

### Visual Assets

- **SVG Diagrams** - Static screen mockups and architectural diagrams stored in the repository root for reference in documentation.

---

## Privacy Architecture

This system implements a two-database architecture to ensure complete separation of personally identifiable information from analytical data:

### Neo4j Graph Database
Stores pseudonymized identifiers, relationships between entities, coded injury data, and aggregated statistics suitable for analysis.

### Identity Service (SQL)
Maintains the mapping between pseudonymous IDs and real personal information including names, email addresses, phone numbers, and emergency contacts.

### Access Pattern
When displaying data, the backend fetches pseudonymized data from Neo4j and resolves real identities only when authorized and necessary, with all access logged for compliance.

---

## Database Schema Summary

The system uses 11 core node types in Neo4j:

### Core Entities
- **Player** - Athletes being monitored (pseudonymized)
- **Injury** - Injury incidents with detailed tracking
- **StatusUpdate** - Ongoing health status monitoring
- **Session** - Training and match sessions

### Organizational Entities
- **Team** - Sports teams
- **Sport** - Sport types and classifications
- **Organization** - Clubs, academies, and federations
- **Coach** - Medical and coaching staff

### Administrative Entities
- **Admin** - System administrators
- **Role** - Permission and access control
- **AuditLog** - Compliance and access tracking

For detailed property definitions, relationships, and query examples, see the [Neo4j Database Documentation](neo4j_database_documentation.md).

---

## Key Design Principles

### Privacy by Design
- Pseudonymization of all personally identifiable information
- Data minimization - only essential data stored in graph database
- K-anonymity through generalized attributes (age groups, regions)
- Complete separation of PII from analytical data

### GDPR Compliance
- Comprehensive audit logging for all data access
- Right to erasure support through pseudonym deletion
- Purpose limitation through coded data structures
- Data portability through structured export capabilities

### Security
- No sensitive personal information in Neo4j
- No free-text fields that could contain identifying information
- Standardized, coded values for all medical data
- Encrypted connections between all system components

---

## Getting Started

### Prerequisites

To work with this documentation:
- Modern web browser for viewing interactive HTML documentation
- Markdown viewer for documentation files
- Neo4j Desktop or Neo4j Aura (for implementing the database)
- Node.js and NestJS (for backend implementation)

### Viewing Documentation

1. Clone this repository
2. Open `neo4j_database_documentation.md` for complete technical reference
3. Visit the interactive documentation links above for visual exploration
4. Review SVG diagrams for screen mockups and architecture overviews

### Implementing the Database

Refer to the [Setup Instructions](neo4j_database_documentation.md#setup-instructions) section in the Neo4j documentation for step-by-step guidance on creating the database schema, setting up constraints and indexes, and initializing sample data.

---

## Use Cases

This system supports multiple use cases:

### For Medical Staff
- Track player injuries and recovery progress
- Monitor treatment effectiveness
- Access historical injury data for informed decision-making
- Generate reports for insurance and compliance

### For Coaches
- View player availability and fitness status
- Plan training loads based on injury history
- Make informed selection decisions
- Monitor recovery timelines

### For Administrators
- Generate aggregate statistics and reports
- Identify injury trends across teams and sports
- Ensure compliance with data protection regulations
- Manage access permissions and audit logs

### For Researchers
- Analyze anonymized injury patterns
- Study effectiveness of prevention strategies
- Compare injury rates across sports and age groups
- Investigate risk factors (all with proper ethical approval)

---

## Privacy Considerations

### What is NOT Stored in Neo4j

- Real names
- Email addresses
- Phone numbers
- Home addresses
- Dates of birth (age groups used instead)
- Free-text medical notes
- Any personally identifiable information

### Access Control

All access to player data is logged in AuditLog nodes. The system supports role-based access control with different permission levels:
- Admins can view aggregated statistics
- Coaches can view their team's players
- Medical staff can view detailed injury information
- Research access requires specific purpose documentation

---

## Integration Guidelines

For developers implementing this system, the [Integration Guidelines](neo4j_database_documentation.md#integration-guidelines) section provides:

- NestJS service examples for common operations
- Audit logging implementation patterns
- Identity resolution service architecture
- Query optimization recommendations
- Error handling best practices

---

## Maintenance and Monitoring

Regular maintenance tasks include:
- Database statistics monitoring
- Performance query analysis
- Audit log review for security
- Backup verification
- Index optimization

See the [Maintenance and Monitoring](neo4j_database_documentation.md#maintenance-and-monitoring) section for specific queries and procedures.

---

## Project Status

This documentation represents the current state of the Final Year Project as of December 2025. The system is designed to be extensible and supports future enhancements including machine learning integration, wearable device connectivity, and advanced analytics capabilities.

---

## Academic Context

**Institution**: Atlantic Technological University  
**Programme**: Software Engineering  
**Project Type**: Final Year Project  
**Academic Year**: 2025-2025

This repository serves as the comprehensive documentation package for the project, suitable for academic review, technical implementation, and future development.

---

## License

This project is developed as part of academic coursework at Atlantic Technological University. All rights reserved.

---

## Contact

For questions about this project or documentation:
- Nathan Dean
- nathan@lallytours.com
- Atlantic Technological University

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Documentation Status**: Active Development

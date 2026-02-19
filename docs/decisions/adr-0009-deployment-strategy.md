# ADR-0009: Deployment Strategy

**Status:** Accepted

**Date:** February 19, 2026

**Deciders:** Nathan Dean

---

## Context

The Multi-Sport Athlete Injury Surveillance System has reached a state where cloud deployment is the next logical step. The system consists of:

- ✅ NestJS backend with 16/16 API endpoints implemented
- ✅ PostgreSQL identity database (PII / GDPR-sensitive data)
- ✅ Neo4j graph database (injury analytics data)
- ✅ React Native mobile app (player and coach workflows)
- 🔲 React web dashboard (admin panel — ADR-0007, planned)

The system requires a cloud deployment strategy that:
- Provides remote access for mobile app integration and testing
- Maintains the privacy-by-design architecture established in ADR-0003
- Keeps costs within a $100 AWS credit budget
- Demonstrates deployment knowledge across multiple cloud platforms for FYP academic value
- Supports secure handling of GDPR-sensitive PII in PostgreSQL

**Key Questions:**
1. Which cloud provider(s) should we use?
2. Where should each component be hosted?
3. Should the frontend be co-deployed with the backend or separately?
4. How do we keep costs predictable within the credit budget?

---

## Decision

**Deploy across three separate platforms, each chosen to match the nature of its workload.**

### Three-Tier Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│                                                                 │
│   React Web Dashboard          React Native Mobile              │
│   Vercel (free, static CDN)    Expo (device / simulator)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / JWT
┌──────────────────────────▼──────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│                                                                 │
│              NestJS Backend API                                 │
│              AWS EC2 (t3.micro)                                 │
│              Docker containerised                               │
└──────────────┬────────────────────────────┬─────────────────────┘
               │                            │
┌──────────────▼──────────┐  ┌─────────────▼─────────────────────┐
│      DATA LAYER (PII)   │  │      DATA LAYER (ANALYTICS)        │
│                         │  │                                    │
│  PostgreSQL             │  │  Neo4j                             │
│  AWS RDS (db.t3.micro)  │  │  Neo4j Aura Free Tier             │
│  VPC isolated           │  │  neo4j.com (external, free)       │
└─────────────────────────┘  └────────────────────────────────────┘
```

### Component Decisions

| Component | Platform | Rationale |
|-----------|----------|-----------|
| NestJS Backend | AWS EC2 (t3.micro) | Full control, Docker support, AWS ecosystem |
| PostgreSQL (PII) | AWS RDS (db.t3.micro) | Managed, encrypted at rest, VPC isolated |
| Neo4j (Analytics) | Neo4j Aura Free Tier | Free managed service, no AWS cost |
| React Web Dashboard | Vercel | Free static hosting, Git-based CI/CD |
| React Native Mobile | Expo (device) | No hosting needed, connects to backend API |

---

## Rationale

### Why AWS for Backend and PostgreSQL?

AWS was chosen as the primary cloud provider because:
- $100 student credit is available, covering approximately 2–3 months of runtime
- EC2 provides full control over the Docker containerised NestJS backend
- RDS provides a managed, encrypted PostgreSQL instance appropriate for GDPR-sensitive PII
- VPC (Virtual Private Cloud) ensures the PostgreSQL database is not publicly exposed — only the backend can reach it, enforcing the privacy-by-design principle from ADR-0003

### Why Neo4j Aura Free Tier (Not AWS)?

Neo4j is not available as a native AWS managed service. Options were:
1. **Self-host on EC2** — adds cost and operational burden
2. **Neo4j Aura Free Tier** — fully managed by Neo4j, free, sufficient capacity for FYP scale (200k nodes / 400k relationships)

The Aura Free Tier was already referenced in the project's Neo4j setup documentation as the recommended cloud option. It removes the need to manage Neo4j infrastructure while keeping AWS costs focused on the backend and PII database.

**Connection change required:** Local Docker uses `bolt://localhost:7687`. Aura uses `neo4j+s://` (encrypted bolt). This is an environment variable change, not a code change, and will be validated by the existing E2E test suite after configuration.

### Why Vercel for the React Web Dashboard?

The React web dashboard (ADR-0007) is a Vite + React + TypeScript single-page application. Its characteristics are:
- No server-side rendering required
- All data fetching happens client-side via the NestJS REST API
- TypeScript/JavaScript business logic (aggregation, reporting, charting) runs in the browser
- Output of `npm run build` is a folder of static assets

Static frontends do not require compute infrastructure. Deploying to Vercel:
- Is free with no resource limits for this scale
- Provides automatic deployments on `git push` (CI/CD out of the box)
- Serves assets via a global CDN for fast load times
- Demonstrates understanding that different workloads suit different hosting models

### Why Separate Frontend and Backend Deployments?

Co-deploying the React dashboard as static files served by NestJS was considered and rejected. Keeping them separate:
- Demonstrates deliberate architectural reasoning (presentation vs application layer)
- Allows independent deployments — a frontend change does not require a backend redeploy
- Reflects industry standard practice for SPA + API architectures
- Provides additional academic talking points: three platforms, each chosen for a specific reason
- Costs nothing extra (Vercel free tier)

---

## Estimated Monthly Cost (AWS)

| Service | Spec | Est. Cost/month |
|---------|------|-----------------|
| EC2 | t3.micro (NestJS backend) | ~$8 |
| RDS | db.t3.micro (PostgreSQL) | ~$15 |
| Data transfer / misc | — | ~$5 |
| **Total** | | **~$28/month** |

At ~$28/month, the $100 AWS credit covers approximately **3.5 months** of runtime — sufficient for development, testing, FYP demonstration, and submission period.

Neo4j Aura and Vercel are both **free** with no credit consumption.

---

## Security Considerations

- **VPC Isolation:** RDS PostgreSQL is deployed inside a VPC with no public internet access. Only the EC2 backend instance can connect to it via a private security group rule.
- **Environment Variables:** All secrets (JWT secret, database credentials, Neo4j connection URI) are managed via environment variables, never committed to source control.
- **HTTPS:** All public-facing endpoints (EC2 backend, Vercel dashboard) are served over HTTPS.
- **Neo4j Aura:** Uses `neo4j+s://` encrypted connections by default.
- **RDS Encryption:** Encryption at rest enabled on the PostgreSQL instance, appropriate for GDPR-sensitive PII.
- **JWT Authentication:** All API endpoints require valid JWT tokens as per ADR-0006. No database is directly exposed to the public internet.

---

## Consequences

### Positive

- **Cost-efficient:** ~$28/month stays well within $100 AWS credit
- **Privacy-by-design maintained:** VPC isolation of PostgreSQL reinforces ADR-0003
- **Academic breadth:** Three cloud platforms (AWS, Neo4j Aura, Vercel) each justified by workload characteristics
- **CI/CD demonstrated:** Vercel provides automatic frontend deployments from Git
- **Operational simplicity:** Managed services (RDS, Aura) reduce maintenance burden
- **Independent deployability:** Each tier can be updated without affecting others

### Negative

- **Multiple platforms to manage:** Three platforms instead of one increases configuration complexity
- **Neo4j Aura Free Tier limits:** 1GB storage, no APOC plugin. Sufficient for FYP but not production scale
- **EC2 management:** Unlike a fully managed platform, EC2 requires manual setup, Docker management, and patching
- **Cold start on free tiers:** Not applicable here as EC2/RDS are always-on within the credit period

### Mitigation

- **Platform complexity:** Documented in this ADR and in deployment runbooks. PowerShell scripts already exist for local environment management and will be extended for deployment steps.
- **Aura limits:** Current Neo4j schema and test data is well within free tier limits. If limits become an issue before submission, upgrade options exist.
- **EC2 management:** Docker containerisation (existing Dockerfile in backend) ensures consistent, reproducible deployments. ADR-0011 (Containerisation and Infrastructure as Code) will document this further.

---

## Implementation Plan

### Phase 1 — Neo4j Aura Setup
1. Create account at neo4j.com/cloud/aura-free (not AWS Marketplace)
2. Create a free instance, download credentials
3. Update `.env.production` with `neo4j+s://` connection URI
4. Run E2E test suite against Aura instance to validate connection

### Phase 2 — AWS Setup
1. Create VPC with public subnet (EC2) and private subnet (RDS)
2. Launch RDS `db.t3.micro` PostgreSQL instance in private subnet
3. Configure security groups: EC2 → RDS only, no public RDS access
4. Launch EC2 `t3.micro`, install Docker
5. Pull and run NestJS backend Docker container with production environment variables
6. Verify health check endpoint responds

### Phase 3 — Vercel Setup (when web dashboard is built)
1. Connect GitHub repository to Vercel
2. Set `VITE_API_URL` environment variable to EC2 backend URL
3. Deploy — automatic on every `git push` to main

### Phase 4 — Mobile Integration
1. Update React Native API base URL to EC2 backend
2. Test full end-to-end flows: player injury reporting, coach dashboard
3. Validate JWT authentication against production backend

---

## Related Decisions

- **[ADR-0003: Two-Database Privacy Architecture](./adr-0003-two-database-privacy-architecture.md)** — VPC isolation of RDS enforces this separation in production
- **[ADR-0004: NestJS Backend Framework](./adr-0004-nestjs-backend-framework.md)** — Backend being deployed
- **[ADR-0006: JWT Authentication](./adr-0006-jwt-authentication.md)** — Authentication must function correctly in production environment
- **[ADR-0007: React Web Dashboard](./adr-0007-react-web-dashboard.md)** — Frontend being deployed to Vercel
- **[ADR-0008: Testing Before Deployment](./adr-0008-testing-before-deployment.md)** — E2E tests validate Neo4j Aura connection after config change
- **[ADR-0011: Containerisation and Infrastructure as Code](./adr-0011-containerisation.md)** — Documents Docker setup for EC2 deployment (planned)

---

## References

- [AWS EC2 Pricing](https://aws.amazon.com/ec2/pricing/)
- [AWS RDS Pricing](https://aws.amazon.com/rds/pricing/)
- [Neo4j Aura Free Tier](https://neo4j.com/cloud/aura-free/)
- [Vercel Free Tier](https://vercel.com/pricing)
- [NestJS Deployment Guide](https://docs.nestjs.com/deployment)
- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)

---

**Last Updated:** February 19, 2026
**Next Review:** After Phase 1 (Neo4j Aura) completion
**Status:** Accepted — Implementation pending completion of ADR-0008 testing phase

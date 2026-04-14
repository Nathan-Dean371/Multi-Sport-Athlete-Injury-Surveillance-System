# ADR-0010: CI/CD Pipeline and Automated Deployment

**Status:** Implemented

**Date:** February 19, 2026

**Last Updated:** April 10, 2026 (Admin dashboard added to CI/CD)

**Deciders:** Nathan Dean

---

## Context

With cloud deployment planned (ADR-0009), a decision is needed on how code changes move from local development to the live EC2 environment. The system is developed across multiple machines (desktop and laptop), making a consistent, automated deployment process essential.

The key requirements are:

- Code changes should be reflected in the cloud environment without manual intervention
- The live environment should never be left in a broken state after a deployment
- Both databases (PostgreSQL on RDS, Neo4j on Aura) should be verified as reachable after every deployment
- The local development workflow should remain unchanged — develop locally against Docker, push to GitHub, automation handles the rest
- The test suite from ADR-0008 should be a mandatory gate before any deployment proceeds

**Key Question:** How do we automate building, testing, and deploying the backend (and admin dashboard) to EC2 in a reliable, verifiable way?

---

## Decision

**Implement a GitHub Actions CI/CD pipeline that runs tests, builds Docker images, pushes to AWS ECR, deploys to EC2, and verifies the deployment via an automated health check.**

### Admin Dashboard (Next.js)

The pipeline includes the admin dashboard (`web/admin-dashboard`) alongside the backend:

- **CI (PRs and branch pushes):** `npm ci`, `npm run lint`, `npm run build` for the dashboard.
- **Release (main / manual):** build and push a Docker image to ECR: `injury-surveillance-admin`.
- **Deploy:** the `deploy-to-ec2` job pulls and runs the dashboard container as `injury-surveillance-admin`, exposed on port **3001**.

### Container-Based Deployment

The backend is containerized using Docker with a multi-stage build:

- **Builder stage**: Compiles TypeScript with all dependencies
- **Production stage**: Minimal Alpine Linux image with only production dependencies and compiled code
- **Result**: ~150MB production image (vs ~500MB with dev dependencies)
- **Security**: Non-root user, health checks built-in

Docker images are stored in **AWS Elastic Container Registry (ECR)**, enabling:

- Version-tagged deployments
- Rollback capability
- Consistent environments (dev → test → production)
- Integration with AWS IAM for secure access

### Local Development Workflow (Unchanged)

```
  ↓
Stage 1: Unit Tests
  └── Run 81 unit tests (Jest)
       ↓
Stage 2: E2E Tests (service containers)
  ├── PostgreSQL Docker container
  ├── Neo4j Docker container
  ├── Run E2E test suite
  └── Containers destroyed after tests
       ↓
Stage 3: Build & Push
  ├── Build Docker image (multi-stage)
  ├── Tag with version (latest, sha, branch)
  └── Push to AWS ECR
       ↓
Stage 4: Deploy to EC2 (manual trigger available)
  ├── SSH into EC2
  ├── Login to ECR
  ├── Pull latest Docker image
  ├── Stop old container
  └── Start new container with environment variables
       ↓
Stage 5: Health Check
  └── Verify /status endpoint
      ├── PostgreSQL (RDS) ✅
      └── Neo4j (Aura) ✅
       ↓
Deployment marked successful ✅

```

```
Automatic: Stages 1-3 run on every push to main
Manual: Stage 4 deployment triggered via workflow_dispatch for controlled releases
       ↓
Stage 4: Deploy
  └── SSH into EC2, pull new image, restart container
       ↓
Stage 5: Smoke Test
  └── Hit /health endpoint on EC2
      Terminus confirms:
        ├── PostgreSQL (RDS) ✅
        └── Neo4j (Aura) ✅
       ↓
Deployment marked successful ✅
```

If any stage fails, the pipeline stops and the previous Docker container continues running on EC2. The live environment is never left in a broken state.

### Two-Stage Database Verification

The pipeline validates databases at two distinct stages:

**Stage 2 — Logic validation (throwaway containers on GitHub's servers):**

- Throwaway PostgreSQL and Neo4j Docker containers, identical to local test setup
- Validates that the application code and queries are correct
- Free, runs on GitHub's infrastructure, destroyed after every run
- Does not touch production databases

**Stage 5 — Connection validation (real cloud databases on EC2):**

- Smoke test hits the live `/health` endpoint after deployment
- NestJS Terminus health indicators actively ping RDS and Aura
- Validates that production credentials and network connectivity are working
- This is the only point in the pipeline where Aura and RDS are touched

### Health Check Implementation

The existing health check endpoint will be extended using `@nestjs/terminus` to report the status of both database connections:

```json
GET /health

{
  "status": "ok",
  "info": {
    "postgres": { "status": "up" },
    "neo4j": { "status": "up" }
  }
}
```

GitHub Actions reads this response after deployment. If either database reports as down, the deployment is marked failed.

---

## Rationale

### Why GitHub Actions?

- **Free** for public repositories and generous free tier for private repos
- **Native GitHub integration** — no third-party service needed
- **Service containers** — can spin up Docker databases for E2E tests natively
- **SSH deployment** — can deploy to EC2 directly via SSH action
- **Industry standard** — relevant experience for career development

### Why Not Deploy Manually?

Manual SSH deployment was considered and rejected:

- Error-prone — easy to forget steps or deploy wrong branch
- Not reproducible across machines — laptop vs desktop inconsistency
- No automatic test gate — could deploy broken code
- Does not scale — every future change requires manual intervention
- Weaker thesis narrative — automation demonstrates mature engineering practice

### Why Throwaway Containers for E2E Tests?

Running E2E tests against Aura directly during CI was considered and rejected:

- Would require Aura credentials stored in GitHub secrets for every test run
- Risk of polluting production data during test runs
- Aura free tier has rate limits that could be hit by frequent CI runs
- Throwaway containers are faster, free, and completely isolated

### Why Develop Locally Against Docker?

Developing directly against cloud databases (Aura + RDS) was considered:

- Appealing for multi-machine consistency
- Rejected because mid-feature development risks pushing bad data or schema changes to production databases
- Local Docker provides fast feedback, safe to break things, no cost implications
- Cloud databases are only touched by the deployed backend, never directly by local development

---

## Consequences

### Positive

- **Never manually deploy again** — every push to main triggers the full pipeline
- **Tests are a hard gate** — broken code cannot reach EC2
- **Multi-machine friendly** — laptop or desktop, workflow is identical
- \*\*Live environmeStatus

### ✅ Completed (February 19, 2026)

**Phase 1 — Containerization**

- ✅ Multi-stage Dockerfile created (`backend/Dockerfile`)
- ✅ `.dockerignore` for optimized builds
- ✅ Docker Compose updated with backend service
- ✅ Local testing script (`build-docker.ps1`)

**Phase 2 — CI/CD Pipeline**

- ✅ GitHub Actions workflow (`.github/workflows/ci.yml`)
- ✅ Unit test stage with database service containers
- ✅ E2E test stage with PostgreSQL and Neo4j containers
- ✅ Docker build stage with caching
- ✅ AWS ECR push with version tagging
- ✅ EC2 deployment stage (manual trigger)
- ✅AWS_ACCESS_KEY_ID` — IAM user with ECR permissions
- `AWS_SECRET_ACCESS_KEY` — IAM secret key
- `JWT_SECRET` — Production JWT signing secret
- `POSTGRES_HOST` — RDS endpoint
- `POSTGRES_PORT` — Database port (5432)
- `POSTGRES_DB` — Database name
- `POSTGRES_USER` — Database username
- `POSTGRES_PASSWORD` — Database password
- `NEO4J_URI` — Aura connection URI (neo4j+s://...)
- `NEO4J_USERNAME` — Neo4j username
- `NEO4J_PASSWORD` — Neo4j password
- `EC2_HOST` — EC2 public IP or domain
- `EC2_USER` — EC2 username (ec2-user)
- `EC2_SSH_KEY` — Private SSH key for EC2 access

See `docs/setup/AWS-DEPLOYMENT-GUIDE.md` for detailed setup instructions.

- ✅ AWS Dep09: Deployment Strategy](./adr-0009-deployment-strategy.md)\*\* — Defines the EC2, RDS, and Aura infrastructure this pipeline deploys to
- **[ADR-0011: Containerisation and Infrastructure as Code](./adr-0011-containerisation.md)** — Docker setup that the pipeline builds and deploys

---

## Quick Start

### Local Docker Testing

```powershell
# Build and test locally
.\build-docker.ps1 -Build -Test

# Or use docker-compose
docker compose up -d --build backend
```

### Trigger CI/CD Pipeline

```bash
# Push to main triggers automatic build + push to ECR
git push origin main

# Manual deployment to EC2
# GitHub → Actions → CI/CD Pipeline → Run workflow
```

AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)

- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [AWS Deployment Guide](../setup/AWS-DEPLOYMENT-GUIDE.md)
- [Docker Quick Reference](../setup/DOCKER-REFERENCE.md)

---

**Last Updated:** February 19, 2026 (Implementation completed)
**Next Review:** After first production deployment
**Status:** Implemented — Infrastructure setup in progress
ssh -i key.pem ec2-user@<EC2_IP>
docker logs -f injury-surveillance-backend

````
- ✅ Docker Quick Reference (`docs/setup/DOCKER-REFERENCE.md`)
- ✅ Environment variable template (`.env.production.example`)

### 🔲 Pending

**Phase 4 — Infrastructure Setup**
- 🔲 Create AWS ECR repository
- 🔲 Configure GitHub Secrets (AWS credentials, database connections)
- 🔲 Create RDS PostgreSQL instance
- 🔲 Set up Neo4j Aura instance
- 🔲 Launch EC2 instance
- 🔲 Initialize databases with schemas

**Phase 5 — First Deployment**
- 🔲 Push code to trigger CI/CD pipeline
- 🔲 Verify tests pass
- 🔲 Verify Docker image pushed to ECR
- 🔲 Manual deployment to EC2
- 🔲 Verify health check passes
- 🔲 Test API endpoints from mobile app

---

## Implementation Details

### Multi-Stage Docker Build

```dockerfile
# Stage 1: Builder - Compile TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production - Minimal runtime
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER nestjs  # Non-root for security
EXPOSE 3000
CMD ["node", "dist/main"]
````

Benefits:

- Smaller images (~150MB vs ~500MB)
- Faster deployments
- No dev dependencies in production
- Enhanced security with non-root user

### AWS ECR Integration

Images are tagged with multiple identifiers:

```
<account>.dkr.ecr.us-east-1.amazonaws.com/injury-surveillance-backend:latest
<account>.dkr.ecr.us-east-1.amazonaws.com/injury-surveillance-backend:main-abc1234
<account>.dkr.ecr.us-east-1.amazonaws.com/injury-surveillance-backend:main
```

This enables:

- `latest`: Always points to most recent main build
- `<branch>-<sha>`: Specific commit for rollback
- `<branch>`: Latest on that branch

### GitHub Actions Workflow

**Triggers**:

- `push` to main/develop: Run tests + build + push to ECR
- `pull_request`: Run tests only
- `workflow_dispatch`: Manual deployment to EC2

**Service Containers**:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_DB: identity_service
      POSTGRES_USER: identity_admin
      POSTGRES_PASSWORD: test-password

  neo4j:
    image: neo4j:5.25-community
    env:
      NEO4J_AUTH: neo4j/test-password
```

**Build Optimization**:

- GitHub Actions cache for Docker layers
- Buildx for multi-platform support
- Metadata action for automated tagging

---

## Implementation nt always stable\*\* — failed deployments don't break production

- **Full SDLC demonstrated** — code → test → build → deploy → verify, documented for thesis
- **Free** — GitHub Actions free tier is sufficient for this project scale

### Negative

- **Pipeline setup time** — initial configuration of GitHub Actions workflow takes time
- **SSH key management** — EC2 SSH credentials must be stored as GitHub secrets securely
- **Deployment latency** — a `git push` takes 2–5 minutes to reach EC2, not instant
- **GitHub dependency** — pipeline relies on GitHub Actions availability

### Mitigation

- **Pipeline setup** — documented step by step, done once
- **SSH key management** — GitHub encrypted secrets are the industry standard approach, appropriate for this use case
- **Deployment latency** — acceptable for this project scale; local Docker provides instant feedback during development
- **GitHub dependency** — GitHub Actions has high availability; acceptable risk for FYP scope

---

## Implementation Plan

### Phase 1 — Health Check Extension

1. Install `@nestjs/terminus`
2. Extend existing health check endpoint with PostgreSQL and Neo4j indicators
3. Verify response format locally

### Phase 2 — GitHub Actions Workflow

1. Create `.github/workflows/deploy.yml`
2. Configure unit test stage
3. Configure E2E test stage with PostgreSQL and Neo4j service containers
4. Configure Docker build stage
5. Configure SSH deploy stage to EC2
6. Configure smoke test stage hitting `/health`

### Phase 3 — GitHub Secrets

Store the following as encrypted GitHub repository secrets:

- `EC2_HOST` — EC2 public IP or domain
- `EC2_SSH_KEY` — private SSH key for EC2 access
- `EC2_USER` — EC2 username (typically `ec2-user`)

### Phase 4 — Validation

1. Push a test change to main
2. Observe pipeline stages in GitHub Actions UI
3. Confirm smoke test passes
4. Confirm change is live on EC2

---

## Related Decisions

- **[ADR-0008: Testing Strategy Before Deployment](./adr-0008-testing-before-deployment.md)** — Test suite is the mandatory gate in Stage 1 and 2 of the pipeline
- **[ADR-0009: Deployment Strategy](./adr-0009-deployment-strategy.md)** — Defines the EC2, RDS, and Aura infrastructure this pipeline deploys to
- **[ADR-0011: Containerisation and Infrastructure as Code](./adr-0011-containerisation.md)** — Docker setup that the pipeline builds and deploys

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Service Containers](https://docs.github.com/en/actions/using-containerized-services)
- [NestJS Terminus Health Checks](https://docs.nestjs.com/recipes/terminus)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [SSH Deploy Action](https://github.com/appleboy/ssh-action)

---

**Last Updated:** February 19, 2026
**Next Review:** After Phase 1 (Health Check Extension) completion
**Status:** Accepted — Implementation pending ADR-0009 infrastructure setup

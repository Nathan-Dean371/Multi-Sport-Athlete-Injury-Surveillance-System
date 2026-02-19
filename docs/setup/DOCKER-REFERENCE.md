# Docker Quick Reference for Injury Surveillance System

## Local Development Commands

### Start all services
```bash
docker compose up -d
```

### Start specific service
```bash
docker compose up -d backend
docker compose up -d neo4j postgres
```

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f neo4j
docker compose logs -f postgres
```

### Stop services
```bash
docker compose down
```

### Stop and remove volumes (full reset)
```bash
docker compose down -v
```

### Rebuild backend after code changes
```bash
docker compose up -d --build backend
```

### View running containers
```bash
docker compose ps
```

### Execute commands in backend container
```bash
docker compose exec backend sh
docker compose exec backend npm run test
```

---

## Building for Production

### Build backend Docker image locally
```bash
cd backend
docker build -t injury-surveillance-backend:latest .
```

### Test production image locally
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  -e POSTGRES_HOST=localhost \
  -e NEO4J_URI=bolt://localhost:7687 \
  injury-surveillance-backend:latest
```

---

## AWS ECR Commands

### Login to ECR
```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com
```

### Tag image for ECR
```bash
docker tag injury-surveillance-backend:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/injury-surveillance-backend:latest
```

### Push to ECR
```bash
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/injury-surveillance-backend:latest
```

### Pull from ECR (on EC2)
```bash
docker pull 123456789012.dkr.ecr.us-east-1.amazonaws.com/injury-surveillance-backend:latest
```

---

## EC2 Deployment Commands

### Run backend container on EC2
```bash
docker run -d \
  --name injury-surveillance-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e JWT_SECRET=${JWT_SECRET} \
  -e POSTGRES_HOST=${POSTGRES_HOST} \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_DB=identity_service \
  -e POSTGRES_USER=${POSTGRES_USER} \
  -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
  -e NEO4J_URI=${NEO4J_URI} \
  -e NEO4J_USERNAME=${NEO4J_USERNAME} \
  -e NEO4J_PASSWORD=${NEO4J_PASSWORD} \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/injury-surveillance-backend:latest
```

### Update running container
```bash
# Stop and remove old container
docker stop injury-surveillance-backend
docker rm injury-surveillance-backend

# Pull latest image
docker pull 123456789012.dkr.ecr.us-east-1.amazonaws.com/injury-surveillance-backend:latest

# Run new container (use command above)
```

### View container logs
```bash
docker logs injury-surveillance-backend
docker logs -f injury-surveillance-backend  # Follow
docker logs --tail 100 injury-surveillance-backend  # Last 100 lines
```

### Container health check
```bash
docker inspect injury-surveillance-backend | grep Health -A 10
```

---

## Troubleshooting Commands

### Check container status
```bash
docker ps -a
```

### Inspect container
```bash
docker inspect injury-surveillance-backend
```

### Execute shell in running container
```bash
docker exec -it injury-surveillance-backend sh
```

### View container resource usage
```bash
docker stats injury-surveillance-backend
```

### Clean up unused images
```bash
docker image prune -f
```

### Clean up everything (CAUTION!)
```bash
docker system prune -a --volumes
```

### Check Docker disk usage
```bash
docker system df
```

---

## Database Container Commands

### Access PostgreSQL container
```bash
docker compose exec postgres psql -U identity_admin -d identity_service
```

### Access Neo4j browser
- Development: http://localhost:7474
- Test: http://localhost:7475

### Backup Neo4j data
```bash
docker compose exec neo4j neo4j-admin database dump neo4j --to-path=/backups
docker cp injury-surveillance-neo4j:/backups ./backups/
```

### Backup PostgreSQL data
```bash
docker compose exec postgres pg_dump -U identity_admin identity_service > backup.sql
```

---

## Environment Variables Reference

### Required for Backend Container

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `3000` |
| `JWT_SECRET` | JWT signing secret | `base64-encoded-secret` |
| `POSTGRES_HOST` | PostgreSQL host | `postgres` (Docker) or RDS endpoint |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `identity_service` |
| `POSTGRES_USER` | Database user | `identity_admin` |
| `POSTGRES_PASSWORD` | Database password | *secure-password* |
| `NEO4J_URI` | Neo4j connection URI | `bolt://neo4j:7687` or Aura URI |
| `NEO4J_USERNAME` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | *secure-password* |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3001` |

---

## Multi-stage Build Optimization

The Dockerfile uses a multi-stage build:

1. **Builder stage**: Installs all dependencies and builds TypeScript
2. **Production stage**: Only contains production dependencies and compiled code

**Benefits**:
- Smaller final image (alpine base)
- Faster deployments
- No dev dependencies in production
- Non-root user for security

**Image size comparison**:
- With dev dependencies: ~500MB
- Production image: ~150MB

---

## GitHub Actions Integration

The CI/CD pipeline automatically:
1. ✅ Runs tests on every push
2. ✅ Builds Docker image on `main` branch
3. ✅ Pushes to AWS ECR
4. ✅ (Optional) Deploys to EC2 on manual trigger

**Trigger manual deployment**:
1. Go to GitHub → Actions → CI/CD Pipeline
2. Click "Run workflow" button

---

## Common Issues and Solutions

### Issue: Container exits immediately
```bash
# Check logs for errors
docker logs injury-surveillance-backend

# Common causes:
# - Missing environment variables
# - Database connection failed
# - Port already in use
```

### Issue: Cannot connect to database
```bash
# Test database connectivity
docker compose exec backend sh
apk add --no-cache postgresql-client
psql -h postgres -U identity_admin -d identity_service

# Check network
docker network ls
docker network inspect injury-surveillance-network
```

### Issue: Changes not reflected
```bash
# Rebuild without cache
docker compose build --no-cache backend
docker compose up -d backend
```

### Issue: Port already in use
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in docker-compose.yml
```

---

**Pro Tips**:
- Use `docker compose logs -f backend` during development to watch for errors
- Always test the production build locally before pushing to AWS
- Set up health checks to ensure containers restart on failure
- Use Docker volumes for persistent data (databases)
- Tag images with version numbers for rollback capability

---

**Related Documentation**:
- [AWS Deployment Guide](./AWS-DEPLOYMENT-GUIDE.md)
- [Backend README](../backend/README.md)
- [ADR-0009: Deployment Strategy](../docs/decisions/adr-0009-deployment-strategy.md)

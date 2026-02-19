# AWS Deployment Guide

## Overview

This guide walks you through deploying the Multi-Sport Athlete Injury Surveillance System backend to AWS using containerization and CI/CD automation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                     │
│  1. Run tests  2. Build Docker image  3. Push to ECR       │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                   Amazon ECR (Registry)                     │
│            injury-surveillance-backend:latest               │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      EC2 Instance (t3.micro)                │
│              Docker Container: NestJS Backend               │
│                        Port 3000                            │
└─────────┬───────────────────────────────────┬───────────────┘
          │                                   │
┌─────────▼─────────────┐        ┌───────────▼───────────────┐
│  RDS PostgreSQL       │        │  Neo4j Aura               │
│  (db.t3.micro)        │        │  (Free Tier)              │
│  VPC Isolated         │        │  External Service         │
└───────────────────────┘        └───────────────────────────┘
```

---

## Prerequisites

- [x] AWS Account with $100 student credits
- [x] GitHub repository access
- [x] AWS CLI installed locally
- [x] Docker installed locally (for testing)

---

## Step 1: Create AWS ECR Repository

Amazon Elastic Container Registry (ECR) stores your Docker images.

### Using AWS Console

1. Go to **AWS Console** → **ECR**
2. Click **Create repository**
3. Settings:
   - **Repository name**: `injury-surveillance-backend`
   - **Visibility**: Private
   - **Tag immutability**: Disabled (for development)
   - **Scan on push**: Enabled (optional, for security scanning)
4. Click **Create repository**

### Using AWS CLI

```bash
aws ecr create-repository \
  --repository-name injury-surveillance-backend \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true
```

**Note the repository URI** (e.g., `123456789012.dkr.ecr.us-east-1.amazonaws.com/injury-surveillance-backend`)

---

## Step 2: Create RDS PostgreSQL Instance

Amazon RDS hosts the identity/PII database.

### Using AWS Console

1. Go to **AWS Console** → **RDS** → **Create database**
2. Configuration:
   - **Engine**: PostgreSQL 16.x
   - **Templates**: Free tier
   - **DB instance identifier**: `injury-surveillance-postgres`
   - **Master username**: `identity_admin`
   - **Master password**: *Generate strong password*
   - **DB instance class**: `db.t3.micro`
   - **Storage**: 20 GB SSD
   - **VPC**: Default (or create a new VPC)
   - **Public access**: No (only accessible from EC2)
   - **Database name**: `identity_service`
3. Click **Create database**
4. **Wait 5-10 minutes** for instance to be available
5. **Note the endpoint** (e.g., `injury-surveillance-postgres.abc123.us-east-1.rds.amazonaws.com`)

### Security Group Configuration

1. Go to the RDS instance → **Connectivity & security**
2. Click on the **VPC security group**
3. Edit inbound rules:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: Security group of your EC2 instance (you'll create this in Step 4)

---

## Step 3: Set Up Neo4j Aura (Free Tier)

Neo4j Aura is a managed cloud service for the graph database.

1. Go to [Neo4j Aura](https://neo4j.com/cloud/aura/)
2. Sign up or log in
3. Click **Create database** → **Free tier**
4. Configuration:
   - **Name**: `injury-surveillance`
   - **Region**: Choose closest to your AWS region
5. **Download credentials** (you get this only once!)
   - Save the connection URI (e.g., `neo4j+s://abc123.databases.neo4j.io`)
   - Save the username (`neo4j`)
   - Save the password

### Initialize Schema

1. Open Neo4j Aura console
2. Run the schema setup from `database/neo4j/neo4j-aura-schema.cypher`
3. Load sample data using the Aura-compatible scripts

---

## Step 4: Create EC2 Instance

Amazon EC2 hosts the Docker container running your backend.

### Using AWS Console

1. Go to **AWS Console** → **EC2** → **Launch Instance**
2. Configuration:
   - **Name**: `injury-surveillance-backend`
   - **AMI**: Amazon Linux 2023 (free tier)
   - **Instance type**: `t3.micro`
   - **Key pair**: Create new or select existing (download `.pem` file)
   - **Network settings**:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 3000) from anywhere (or restrict as needed)
   - **Storage**: 8 GB (default)
3. Click **Launch instance**

### Connect to EC2 and Install Dependencies

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# Update system
sudo yum update -y

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install AWS CLI (if not present)
sudo yum install aws-cli -y

# Log out and log back in for group changes to take effect
exit
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# Verify Docker
docker --version
```

---

## Step 5: Configure GitHub Secrets

GitHub Actions needs AWS credentials and database connection strings.

### Required Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `JWT_SECRET` | Random 64-byte base64 string | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"` |
| `POSTGRES_HOST` | RDS endpoint | `injury-surveillance-postgres.abc123.us-east-1.rds.amazonaws.com` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `identity_service` |
| `POSTGRES_USER` | Database username | `identity_admin` |
| `POSTGRES_PASSWORD` | Database password | *Your RDS password* |
| `NEO4J_URI` | Neo4j Aura URI | `neo4j+s://abc123.databases.neo4j.io` |
| `NEO4J_USERNAME` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | *Your Aura password* |
| `EC2_HOST` | EC2 public IP | `3.84.123.45` |
| `EC2_USER` | EC2 username | `ec2-user` |
| `EC2_SSH_KEY` | EC2 private key | *Contents of your .pem file* |

### Creating AWS Access Keys

1. Go to **AWS Console** → **IAM** → **Users**
2. Click your username → **Security credentials**
3. Scroll to **Access keys** → **Create access key**
4. Select **CLI** use case
5. Copy both the **Access Key ID** and **Secret Access Key**

⚠️ **Important**: These credentials should have permissions for:
- ECR (push/pull images)
- EC2 (if using automated deployment)

---

## Step 6: Test the CI/CD Pipeline

### Automatic Build (on push to main)

1. Make a change to the backend code
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```
3. Go to **GitHub** → **Actions** tab
4. Watch the pipeline run:
   - ✅ Test Backend (unit + E2E tests)
   - ✅ Build and Push Docker Image (to ECR)

### Manual Deployment (workflow_dispatch)

1. Go to **GitHub** → **Actions** → **CI/CD Pipeline**
2. Click **Run workflow** → **Run workflow**
3. This will deploy the latest image to EC2

---

## Step 7: Initialize Databases

### PostgreSQL (via EC2)

SSH into EC2 and run the database setup:

```bash
# Connect to RDS from EC2
sudo yum install postgresql15 -y

psql -h <RDS_ENDPOINT> -U identity_admin -d identity_service

-- Run the schema
\i /path/to/identity-service-schema.sql
\i /path/to/sample-identities.sql
```

**Or** run setup via backend API endpoint:
```bash
curl -X POST http://<EC2_IP>:3000/database/setup
```

---

## Step 8: Verify Deployment

### Health Check

```bash
curl http://<EC2_IP>:3000/status
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-19T12:00:00.000Z",
  "uptime": 123.456
}
```

### Test Authentication

```bash
curl -X POST http://<EC2_IP>:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "coach1", "password": "Password123!"}'
```

### View Container Logs

```bash
# SSH into EC2
docker logs injury-surveillance-backend

# Follow logs
docker logs -f injury-surveillance-backend
```

---

## Step 9: Update Mobile App Configuration

Update the mobile app to point to the EC2 backend:

```typescript
// mobile/src/config/api.ts
export const API_BASE_URL = 'http://<EC2_PUBLIC_IP>:3000';
```

⚠️ **For production**: Use HTTPS with a domain name and SSL certificate (e.g., via AWS Certificate Manager + Application Load Balancer)

---

## Cost Monitoring

### Estimated Monthly Costs (within $100 credit)

| Service | Instance | Est. Cost/Month |
|---------|----------|-----------------|
| EC2 | t3.micro | ~$7.50 |
| RDS | db.t3.micro | ~$15.00 |
| ECR | Storage | ~$1.00 |
| Data Transfer | | ~$5.00 |
| Neo4j Aura | Free tier | $0.00 |
| **Total** | | **~$28.50** |

**Your $100 credit will last approximately 3-4 months** with this setup.

### Monitor Usage

1. Go to **AWS Console** → **Billing Dashboard**
2. Set up **Budget alerts** at $50 and $80
3. Enable **Cost Explorer** to track spending

---

## Troubleshooting

### Pipeline fails at "Login to Amazon ECR"
- Check AWS credentials in GitHub Secrets
- Verify IAM user has ECR permissions

### Container won't start
```bash
# Check logs
docker logs injury-surveillance-backend

# Common issues:
# - Database connection strings incorrect
# - JWT_SECRET not set
# - Databases not initialized
```

### Can't connect to RDS from EC2
- Check security group rules
- Verify EC2 and RDS are in same VPC
- Test with: `telnet <RDS_ENDPOINT> 5432`

### Neo4j connection fails
- Verify URI format: `neo4j+s://` (note the `+s` for secure)
- Check username/password from Aura download
- Ensure Aura database is running

---

## Next Steps

- [ ] Set up HTTPS with SSL certificate
- [ ] Configure CloudWatch for monitoring/logging
- [ ] Set up automated backups for RDS
- [ ] Implement staging environment
- [ ] Add deployment notifications (Slack, email)

---

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [Neo4j Aura Documentation](https://neo4j.com/docs/aura/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Last Updated**: February 19, 2026

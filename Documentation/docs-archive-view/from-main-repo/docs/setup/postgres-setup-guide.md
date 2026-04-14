# PostgreSQL Identity Service Setup

**Difficulty:** Intermediate  
**Time to Complete:** ~20 minutes (with Docker) | ~45 minutes (manual setup)  
**Prerequisites:** Docker & Docker Compose OR PostgreSQL 13+ installed locally  

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Installation Options](#installation-options)
- [Configuration](#configuration)
- [Verification](#verification)
- [Integration with Neo4j](#integration-with-neo4j)
- [Production Considerations](#production-considerations)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Overview

The PostgreSQL database stores **real** personally identifiable information (PII) that maps to **pseudonymous IDs** used in Neo4j. This separation ensures GDPR compliance and privacy-by-design.

#### Step 1: Install PostgreSQL

```powershell
# Windows (via Chocolatey or Scoop)
choco install postgresql

# macOS (via Homebrew)
brew install postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
```

#### Step 2: Create Database and User

```powershell
# Start PostgreSQL service
# Windows: Services app or 'net start postgresql-x64-XX'
# macOS: 'brew services start postgresql'
# Linux: 'sudo service postgresql start'

# Connect as superuser
psql -U postgres

# Inside psql:
CREATE DATABASE identity_service;
CREATE USER identity_admin WITH PASSWORD 'injury-surveillance-dev-password';
GRANT ALL PRIVILEGES ON DATABASE identity_service TO identity_admin;
\q
```

#### Step 3: Run Schema and Sample Data

```powershell
# Connect to new database
psql -U identity_admin -d identity_service -h localhost

# Run schema (from project directory)
\i 'database/postgres/identity-service-schema.sql'

# Run sample data
\i 'database/postgres/sample-identities.sql'

# Verify
SELECT COUNT(*) FROM player_identities;
\q
```

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Neo4j Graph   │         │   PostgreSQL     │
│                 │         │                  │
│ PSY-PLAYER-001  │◄───────►│ John Smith       │
│ Injury data     │  Maps   │ john@email.com   │
│ Relationships   │   to    │ +353 87 xxx xxxx │
│ Pseudonymized   │         │ Real PII         │
└─────────────────┘         └──────────────────┘
```

---

## Database Schema

### Core Tables

1. **player_identities** - Real player information
   - Name, DOB, contact details
   - Emergency contacts
   - Medical history (encrypted)
   - GDPR consent tracking

2. **coach_identities** - Staff/coach information
   - Professional registration numbers
   - Insurance details
   - Contact information

3. **admin_identities** - System administrators

4. **user_accounts** - Authentication
   - Login credentials
   - Session management
   - 2FA support
   - Password reset tokens

### GDPR Compliance Tables

5. **data_access_log** - Audit trail
   - Who accessed what, when, and why
   - Complete history for compliance

6. **data_deletion_requests** - Right to erasure
   - Tracking deletion requests
   - Approval workflow

7. **data_export_requests** - Right to portability
   - User data export management

---

## Configuration

### Environment Variables

Set these in your `.env` or `.env.test` file:

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_HOST` | Database hostname | `localhost` |
| `POSTGRES_PORT` | Database port | `5432` |
| `POSTGRES_DB` | Database name | `identity_service` |
| `POSTGRES_USER` | Database user | `identity_admin` |
| `POSTGRES_PASSWORD` | Database password | (required) |

### Connection String

```
postgresql://identity_admin:injury-surveillance-dev-password@localhost:5432/identity_service
```

---

## Verification

### Quick Health Check

```powershell
# Test connection
psql -U identity_admin -d identity_service -h localhost -c "SELECT version();"

# List tables
psql -U identity_admin -d identity_service -h localhost -c "\dt"

# Check sample data loaded
psql -U identity_admin -d identity_service -h localhost -c "SELECT COUNT(*) as total_players FROM player_identities;"
```

### Expected Results

```
count
-------
    7
(1 row)
```

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `Connection refused` | PostgreSQL not running | Start service: `docker-compose up -d` or `brew services start postgresql` |
| `FATAL: password authentication failed` | Wrong password or user | Check `.env` file, verify credentials match in docker-compose.yml |
| `ERROR: database "identity_service" does not exist` | Schema not loaded | Run schema creation: `docker cp database\postgres\identity-service-schema.sql ... -f /tmp/identity-service-schema.sql` |
| `psql: no matches for locale en_US.UTF-8` | Locale not found | Specify locale: `psql --locale=C` |
| `pgAdmin login loop` | Session issue | Clear cookies, restart: `docker-compose restart pgadmin` |
| `Port 5432 already in use` | Port conflict | Find existing process: `netstat -an \| grep 5432` or use different port in docker-compose.yml |

## Integration with Neo4j

### Example Workflow

1. **User logs in** → PostgreSQL authenticates
2. **System retrieves** pseudonym_id from PostgreSQL
3. **Backend queries** Neo4j using pseudonym_id
4. **Display data** combines both sources:
   - Name from PostgreSQL (real)
   - Injury history from Neo4j (anonymized)

### Backend Service Pattern

```typescript
// 1. Authenticate user (PostgreSQL)
const user = await identityService.authenticate(email, password);

// 2. Get pseudonym
const pseudonymId = user.pseudonym_id;

// 3. Query Neo4j with pseudonym
const injuries = await neo4jService.getPlayerInjuries(pseudonymId);

// 4. Optionally resolve real name for display
const realName = await identityService.resolveName(pseudonymId);

// 5. Log the access (GDPR audit)
await identityService.logAccess({
    accessor: currentUser.id,
    target: pseudonymId,
    action: 'read',
    reason: 'Viewing injury dashboard'
});
```

### Mapping Reference

#### Common Queries

**Get Real Identity from Pseudonym**

```sql
SELECT 
    first_name,
    last_name,
    email,
    phone_number
FROM player_identities
WHERE pseudonym_id = 'PSY-PLAYER-A1B2C3D4';
```

**Check Access History**

```sql
SELECT 
    accessor_email,
    access_type,
    access_reason,
    accessed_at
FROM data_access_log
WHERE pseudonym_id = 'PSY-PLAYER-A1B2C3D4'
ORDER BY accessed_at DESC;
```

**Verify Account Status**

```sql
SELECT * FROM account_status_summary
WHERE email = 'liam.murphy@email.com';
```

**Process Deletion Request**

```sql
SELECT 
    requester_email,
    pseudonym_id,
    request_date,
    reason
FROM data_deletion_requests
WHERE status = 'pending'
ORDER BY request_date;
```

---

## Production Considerations

### 🔐 Security Hardening

1. **Enable SSL/TLS** for connections
2. **Encrypt sensitive columns** using pgcrypto
3. **Use secrets manager** for credentials
4. **Enable row-level security** (RLS)
5. **Restrict network access** to specific IPs
6. **Regular security audits**

### 🗄️ Backup Strategy

1. **Daily encrypted backups**
2. **Point-in-time recovery** enabled
3. **Test restoration** regularly
4. **Store backups** in separate location
5. **Backup retention**: 30 days minimum

### 📊 Monitoring & Alerts

1. **Track failed login attempts**
2. **Monitor unusual access patterns**
3. **Alert on data export requests**
4. **Audit log review** weekly
5. **Performance monitoring** - slow queries

### 📜 Compliance Checklist

- ✅ **GDPR audit trail** - All access logged
- ✅ **Data retention** - Automatic cleanup policies
- ✅ **Consent management** - Track and honor preferences
- ✅ **Documentation** - Privacy notices, policies
- ✅ **DPO notification** - Automated breach alerts

---

## Key Features

### Security

- **Encrypted at rest** (configure in production)
- **Password hashing** (bcrypt with salt)
- **Session management** with expiration
- **Failed login tracking** with account locking
- **2FA support** ready to implement

### GDPR Compliance

- **Complete audit trail** - Every access is logged
- **Right to erasure** - Deletion request workflow
- **Right to portability** - Data export functionality
- **Consent management** - Track GDPR consent
- **Data minimization** - Only essential PII stored

### Pseudonymization

Each person has:
- **Real identity** in PostgreSQL (e.g., "John Smith")
- **Pseudonymous ID** in Neo4j (e.g., "PSY-PLAYER-A1B2C3D4")

The mapping is **one-to-one** and **permanent** (unless deleted).

---

## Sample Data

### Test Accounts

All test accounts use password: `password123`

**Players:**
- liam.murphy@email.com (PSY-PLAYER-A1B2C3D4)
- cian.obrien@email.com (PSY-PLAYER-E5F6G7H8)
- sean.kelly@email.com (PSY-PLAYER-I9J0K1L2)
- conor.walsh@email.com (PSY-PLAYER-M3N4O5P6)
- oisin.ryan@email.com (PSY-PLAYER-Q7R8S9T0)
- darragh.brennan@email.com (PSY-PLAYER-U1V2W3X4)
- eoin.mccarthy@email.com (PSY-PLAYER-Y5Z6A7B8)

**Coaches:**
- sarah.oconnor@physio.ie (PSY-COACH-8F2A9D1B) - Physiotherapist
- michael.fitzgerald@coaching.ie (PSY-COACH-3B7E4C9A) - Head Coach
- emma.doyle@strength.ie (PSY-COACH-6D1F8E2C) - S&C Coach

**Admin:**
- james.osullivan@admin.ie (PSY-ADMIN-9A3C5E7D)

---

## File Structure

```
database/
└── postgres/
    ├── identity-service-schema.sql     # Main schema
    ├── sample-identities.sql           # Test data
    ├── README.md                       # Schema documentation
    └── migrations/                     # Future schema changes
        └── (future migration files)
```

---

## Next Steps

1. ✅ Schema created
2. ✅ Sample data loaded
3. ⬜ Test Node.js connection
4. ⬜ Create identity service in NestJS
5. ⬜ Implement encryption for sensitive fields
6. ⬜ Set up automated backups
7. ⬜ Configure SSL/TLS for production

---

## Useful Commands

```powershell
# Connect to PostgreSQL
docker exec -it injury-surveillance-postgres psql -U identity_admin -d identity_service

# List tables
\dt

# Describe table
\d player_identities

# Run SQL file
\i /tmp/filename.sql

# Exit psql
\q

# Backup database
docker exec injury-surveillance-postgres pg_dump -U identity_admin identity_service > backup.sql

# Restore database
docker exec -i injury-surveillance-postgres psql -U identity_admin identity_service < backup.sql
```

---

## Related Documentation

- [Neo4j Setup Guide](neo4j-setup-guide.md)
- [Quick Start Guide](QUICK_START.md)
- [Authentication Implementation](../authentication-implementation.md)
- [Docker Troubleshooting](docker-troubleshooting.md)

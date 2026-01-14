# PostgreSQL Identity Service Setup

## Overview

The PostgreSQL database stores **real** personally identifiable information (PII) that maps to **pseudonymous IDs** used in Neo4j. This separation ensures GDPR compliance and privacy-by-design.

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

## Setup Instructions

### 1. Access PostgreSQL

Your PostgreSQL is already running in Docker. Connect using:

```powershell
# Using psql in Docker
docker exec -it injury-surveillance-postgres psql -U identity_admin -d identity_service

# Or use pgAdmin
# Open: http://localhost:5050
# Email: admin@injury-surveillance.local
# Password: pgadmin-dev-password
```

### 2. Run Schema Creation

```powershell
# Copy schema file into container
docker cp database\postgres\identity-service-schema.sql injury-surveillance-postgres:/tmp/

# Run the schema
docker exec -it injury-surveillance-postgres psql -U identity_admin -d identity_service -f /tmp/identity-service-schema.sql
```

### 3. Load Sample Data

```powershell
# Copy sample data file
docker cp database\postgres\sample-identities.sql injury-surveillance-postgres:/tmp/

# Run the sample data
docker exec -it injury-surveillance-postgres psql -U identity_admin -d identity_service -f /tmp/sample-identities.sql
```

### 4. Verify Setup

```powershell
# Connect to database
docker exec -it injury-surveillance-postgres psql -U identity_admin -d identity_service

# Run verification queries
SELECT * FROM active_identities;
SELECT * FROM account_status_summary;
```

## Key Features

### 🔒 Security

- **Encrypted at rest** (configure in production)
- **Password hashing** (bcrypt with salt)
- **Session management** with expiration
- **Failed login tracking** with account locking
- **2FA support** ready to implement

### 📊 GDPR Compliance

- **Complete audit trail** - Every access is logged
- **Right to erasure** - Deletion request workflow
- **Right to portability** - Data export functionality
- **Consent management** - Track GDPR consent
- **Data minimization** - Only essential PII stored

### 🔑 Pseudonymization

Each person has:
- **Real identity** in PostgreSQL (e.g., "John Smith")
- **Pseudonymous ID** in Neo4j (e.g., "PSY-PLAYER-A1B2C3D4")

The mapping is **one-to-one** and **permanent** (unless deleted).

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

## Common Queries

### Get Real Identity from Pseudonym

```sql
-- Get player details
SELECT 
    first_name,
    last_name,
    email,
    phone_number
FROM player_identities
WHERE pseudonym_id = 'PSY-PLAYER-A1B2C3D4';
```

### Check Access History

```sql
-- See who accessed a person's data
SELECT 
    accessor_email,
    access_type,
    access_reason,
    accessed_at
FROM data_access_log
WHERE pseudonym_id = 'PSY-PLAYER-A1B2C3D4'
ORDER BY accessed_at DESC;
```

### Verify Account Status

```sql
-- Check if account is active and verified
SELECT * FROM account_status_summary
WHERE email = 'liam.murphy@email.com';
```

### Process Deletion Request

```sql
-- Get pending deletion requests
SELECT 
    requester_email,
    pseudonym_id,
    request_date,
    reason
FROM data_deletion_requests
WHERE status = 'pending'
ORDER BY request_date;
```

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

### 📊 Monitoring

1. **Track failed login attempts**
2. **Monitor unusual access patterns**
3. **Alert on data export requests**
4. **Audit log review** weekly
5. **Performance monitoring**

### 📜 Compliance

1. **GDPR audit trail** - All access logged
2. **Data retention** - Automatic cleanup policies
3. **Consent management** - Track and honor preferences
4. **Documentation** - Privacy notices, policies
5. **DPO notification** - Automated breach alerts

## File Structure

```
database/
└── postgres/
    ├── identity-service-schema.sql     # Main schema
    ├── sample-identities.sql           # Test data
    ├── README.md                       # This file
    └── migrations/                     # Future schema changes
        └── (future migration files)
```

## Next Steps

1. ✅ Schema created
2. ✅ Sample data loaded
3. ⬜ Test Node.js connection
4. ⬜ Create identity service in NestJS
5. ⬜ Implement encryption for sensitive fields
6. ⬜ Set up automated backups
7. ⬜ Configure SSL/TLS for production

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

## Support

For questions about the identity service:
- Review the schema comments in identity-service-schema.sql
- Check GDPR compliance features in the schema
- See integration examples in this README

---

**Created:** January 2026  
**Version:** 1.0  
**Last Updated:** January 2026

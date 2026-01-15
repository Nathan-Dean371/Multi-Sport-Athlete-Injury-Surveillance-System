# Demo Cheat Sheet

Quick reference for in-person demonstrations of the Multi-Sport Athlete Injury Surveillance System.

---

## Quick Start

### Option 1: Start Everything with One Command
```powershell
.\start-demo.ps1
```
This will open three terminals for databases, backend, and frontend.

### Option 2: Manual Start
```powershell
# Terminal 1 - Databases
docker-compose up

# Terminal 2 - Backend (in \backend folder)
cd backend
npm run start:dev

# Terminal 3 - Frontend (in \frontend folder)
cd frontend
npm start
```

---

## Credentials & Access

### Neo4j Database
- **URL**: http://localhost:7474
- **Username**: `neo4j`
- **Password**: `injury-surveillance-dev-password`

### PostgreSQL Database
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `identity_service`
- **Username**: `identity_admin`
- **Password**: `identity-service-dev-password`

### pgAdmin (Optional)
- **URL**: http://localhost:5050
- **Email**: `admin@example.com`
- **Password**: `pgadmin-dev-password`

### Test User Accounts
All test accounts use password: **`password123`**

**Sample Player Logins:**
- `liam.murphy@email.com` (Player)
- `emma.oconnor@email.com` (Player)
- `sean.kelly@email.com` (Player)

**Sample Coach Logins:**
- Check the sample-identities.sql file for coach emails

### API Access
- **Backend URL**: http://localhost:3000
- **Swagger API Docs**: http://localhost:3000/api
- **Frontend URL**: http://localhost:3001

---

## Neo4j Demo Queries

### Visualize Complete Graph Structure
```cypher
MATCH (n)
RETURN n
LIMIT 100
```

### Show All Relationships
```cypher
MATCH (n)-[r]->(m)
RETURN n, r, m
LIMIT 50
```

### View All Node Types and Counts
```cypher
MATCH (n)
RETURN labels(n)[0] AS NodeType, count(*) AS Count
ORDER BY Count DESC
```

### Show Full Injury Network
```cypher
MATCH path = (p:Player)-[:SUSTAINED]->(i:Injury)-[:HAS_UPDATE]->(s:StatusUpdate)
RETURN path
LIMIT 20
```

### Team Structure Visualization
```cypher
MATCH (o:Organization)-[:HAS_TEAM]->(t:Team)<-[:PLAYS_FOR]-(p:Player)
RETURN o, t, p
LIMIT 30
```

### Player with All Connections
```cypher
MATCH (p:Player {playerId: 'PLAYER-001'})
OPTIONAL MATCH (p)-[r]-(connected)
RETURN p, r, connected
```

### Injuries by Status
```cypher
MATCH (p:Player)-[:SUSTAINED]->(i:Injury)
RETURN i.status AS Status,
       count(*) AS Count,
       collect(i.injuryType)[0..5] AS ExampleInjuries
ORDER BY Count DESC
```

### Active Injuries with Player Info
```cypher
MATCH (p:Player)-[:SUSTAINED]->(i:Injury {status: 'Active'})
MATCH (p)-[:PLAYS_FOR]->(t:Team)
RETURN p.pseudonymId AS Player,
       t.name AS Team,
       i.injuryType AS Injury,
       i.bodyPart AS BodyPart,
       i.severity AS Severity,
       i.injuryDate AS Date
ORDER BY i.injuryDate DESC
```

### Team Injury Statistics
```cypher
MATCH (t:Team)<-[:PLAYS_FOR]-(p:Player)-[:SUSTAINED]->(i:Injury)
RETURN t.name AS Team,
       count(DISTINCT p) AS PlayersWithInjuries,
       count(i) AS TotalInjuries,
       count(CASE WHEN i.status = 'Active' THEN 1 END) AS ActiveInjuries
ORDER BY TotalInjuries DESC
```

### Injury Recovery Timeline
```cypher
MATCH (i:Injury)-[:HAS_UPDATE]->(s:StatusUpdate)
WHERE i.injuryId = 'INJ-001'
RETURN i.injuryType AS Injury,
       i.injuryDate AS InitialDate,
       collect({
         date: s.updateDate,
         painLevel: s.painLevel,
         status: s.functionalStatus,
         notes: s.notes
       }) AS Updates
ORDER BY s.updateDate
```

### Most Common Injuries
```cypher
MATCH (i:Injury)
RETURN i.injuryType AS InjuryType,
       i.bodyPart AS BodyPart,
       count(*) AS Occurrences,
       round(avg(i.estimatedRecovery)) AS AvgRecoveryDays
ORDER BY Occurrences DESC
LIMIT 10
```

### Schema Overview
```cypher
CALL db.schema.visualization()
```

### View All Constraints
```cypher
SHOW CONSTRAINTS
```

### View All Indexes
```cypher
SHOW INDEXES
```

---

## Useful Commands

### Check Docker Status
```powershell
docker ps
```

### View Docker Logs
```powershell
docker-compose logs -f neo4j
docker-compose logs -f postgres
```

### Restart Databases
```powershell
docker-compose restart
```

### Stop Everything
```powershell
docker-compose down
```

### Reset Databases (WARNING: Deletes all data)
```powershell
docker-compose down -v
docker-compose up -d
```

### Backend Health Check
```powershell
curl http://localhost:3000
```

### Install Dependencies (if needed)
```powershell
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

## API Endpoints (for Postman/Testing)

### Authentication
```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "liam.murphy@email.com",
  "password": "password123"
}
```

### Get All Players
```
GET http://localhost:3000/players
Authorization: Bearer <token>
```

### Get Player by ID
```
GET http://localhost:3000/players/PLAYER-001
Authorization: Bearer <token>
```

### Get All Injuries
```
GET http://localhost:3000/injuries
Authorization: Bearer <token>
```

### Get Injuries by Player
```
GET http://localhost:3000/injuries/player/PLAYER-001
Authorization: Bearer <token>
```

---

## Demo Flow Suggestions

1. **Start with Architecture**
   - Show docker-compose.yml (two databases)
   - Explain privacy architecture (Neo4j for sports data, PostgreSQL for PII)

2. **Database Exploration**
   - Open Neo4j Browser
   - Run graph visualization queries
   - Show relationship patterns

3. **API Testing**
   - Open Swagger UI (http://localhost:3000/api)
   - Test authentication endpoint
   - Show protected endpoints with JWT

4. **Frontend Demo**
   - Login with test account
   - Navigate through dashboard
   - Show injury reports and player data

5. **Data Privacy**
   - Demonstrate pseudonymization
   - Show how Neo4j only has PSY-IDs
   - Show PostgreSQL mapping table

---

## Troubleshooting

### Databases won't start
```powershell
docker-compose down -v
docker-compose up --force-recreate
```

### Port already in use
```powershell
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :7474
netstat -ano | findstr :5432

# Kill process by PID (from above)
taskkill /PID <pid> /F
```

### Backend won't connect to database
- Wait 30 seconds after `docker-compose up` for databases to initialize
- Check docker logs: `docker-compose logs`

### Frontend connection refused
- Ensure backend is running on port 3000
- Check CORS settings in backend

---

## Documentation Links

- Full Setup Guide: `docs/setup/QUICK_START.md`
- Architecture Decisions: `docs/decisions/`
- Database Schemas: `database/`
- API Documentation: http://localhost:3000/api (when running)

---

**Last Updated**: January 2026  
**For Demo Use Only** - Contains test credentials

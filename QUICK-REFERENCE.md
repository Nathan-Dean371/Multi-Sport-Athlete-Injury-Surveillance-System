# DEMO QUICK REFERENCE CARD

## CREDENTIALS

### Neo4j (http://localhost:7474)
```
Username: neo4j
Password: injury-surveillance-dev-password
```

### Test Login (Frontend)
```
Email: liam.murphy@email.com
Password: password123
```

---

## START DEMO
```powershell
.\start-demo.ps1
```

## STOP DEMO
```powershell
.\stop-demo.ps1
```

---

## URLS

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api |
| Neo4j Browser | http://localhost:7474 |
| pgAdmin | http://localhost:5050 |

---

## TOP NEO4J QUERIES

### Show Full Graph
```cypher
MATCH (n) RETURN n LIMIT 100
```

### Show Relationships
```cypher
MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 50
```

### Active Injuries
```cypher
MATCH (p:Player)-[:SUSTAINED]->(i:Injury {status: 'Active'})
MATCH (p)-[:PLAYS_FOR]->(t:Team)
RETURN p.pseudonymId, t.name, i.injuryType, i.bodyPart, i.severity
ORDER BY i.injuryDate DESC
```

### Team Stats
```cypher
MATCH (t:Team)<-[:PLAYS_FOR]-(p:Player)-[:SUSTAINED]->(i:Injury)
RETURN t.name AS Team,
       count(DISTINCT p) AS PlayersWithInjuries,
       count(i) AS TotalInjuries,
       count(CASE WHEN i.status = 'Active' THEN 1 END) AS Active
ORDER BY TotalInjuries DESC
```

### Schema Visualization
```cypher
CALL db.schema.visualization()
```

---

## TROUBLESHOOTING

### Restart Everything
```powershell
docker-compose restart
cd backend; npm run start:dev
cd frontend; npm start
```

### Reset Databases
```powershell
docker-compose down -v
docker-compose up
```

### Check Docker
```powershell
docker ps
docker-compose logs
```

---

## DEMO FLOW

1. [OK] Run `.\start-demo.ps1`
2. [OK] Wait 2-3 minutes for startup
3. [OK] Open Neo4j Browser -> Run graph query
4. [OK] Open Swagger -> Test /auth/login
5. [OK] Open Frontend -> Login -> Show dashboard
6. [OK] Demonstrate privacy (Neo4j PSY-IDs only)

---

**Full Cheat Sheet**: DEMO-CHEAT-SHEET.md

// ============================================================================
// Multi-Sport Athlete Injury Surveillance System
// Database Verification Queries
// ============================================================================
//
// Run these queries to verify your database setup is correct and working
// These queries test schema, data integrity, and performance
//
// ============================================================================

// ============================================================================
// PART 1: SCHEMA VERIFICATION
// ============================================================================

// --- Check all constraints are created ---
SHOW CONSTRAINTS;
// Expected: 12 UNIQUE constraints

// --- Check all indexes are online ---
SHOW INDEXES;
// Expected: 18+ indexes, all should show state: "ONLINE"

// --- Count constraints by type ---
CALL db.constraints() 
YIELD name, type 
RETURN type, count(*) as count 
ORDER BY type;

// --- Count and list all index types ---
CALL db.indexes() 
YIELD name, type, state, labelsOrTypes
WHERE state = 'ONLINE' AND type <> 'LOOKUP'
RETURN type, count(*) as count, collect(name)[0..5] as exampleNames
ORDER BY count DESC;

// ============================================================================
// PART 2: DATA INTEGRITY CHECKS
// ============================================================================

// --- Count all nodes by type ---
MATCH (n)
RETURN labels(n)[0] AS NodeType, count(*) AS Count
ORDER BY Count DESC;
// Should see: Player, Injury, Team, Sport, Organization, etc.

// --- Check for orphaned nodes (nodes with no relationships) ---
MATCH (n)
WHERE NOT (n)--()
RETURN labels(n) AS NodeType, count(*) AS OrphanedCount;
// Ideally should return empty or minimal results

// --- Verify all players have teams ---
MATCH (p:Player)
OPTIONAL MATCH (p)-[:PLAYS_FOR]->(t:Team)
WITH p, t
WHERE t IS NULL
RETURN count(p) AS PlayersWithoutTeams;
// Should return 0

// --- Verify all teams have organizations and sports ---
MATCH (t:Team)
OPTIONAL MATCH (t)-[:BELONGS_TO]->(o:Organization)
OPTIONAL MATCH (t)-[:PLAYS]->(s:Sport)
WHERE o IS NULL OR s IS NULL
RETURN t.name AS Team, 
       CASE WHEN o IS NULL THEN 'Missing' ELSE 'OK' END AS Organization,
       CASE WHEN s IS NULL THEN 'Missing' ELSE 'OK' END AS Sport;
// Should return empty

// --- Check all injuries are linked to players ---
MATCH (i:Injury)
OPTIONAL MATCH (p:Player)-[:SUSTAINED]->(i)
WHERE p IS NULL
RETURN count(i) AS InjuriesWithoutPlayers;
// Should return 0

// --- Verify status updates are linked to injuries ---
MATCH (s:StatusUpdate)
OPTIONAL MATCH (i:Injury)-[:HAS_UPDATE]->(s)
WHERE i IS NULL
RETURN count(s) AS OrphanedStatusUpdates;
// Should return 0

// ============================================================================
// PART 3: DATA QUALITY CHECKS
// ============================================================================

// --- Check for duplicate pseudonymIds in Players ---
MATCH (p:Player)
WITH p.pseudonymId AS id, count(*) AS occurrences
WHERE occurrences > 1
RETURN id, occurrences;
// Should return empty

// --- Check for players with invalid age groups ---
MATCH (p:Player)
WHERE NOT p.ageGroup IN ['Under 18', '18-21', '22-25', '26-30', '31-35', '36+']
RETURN p.playerId, p.ageGroup;
// Should return empty

// --- Check for injuries with invalid status ---
MATCH (i:Injury)
WHERE NOT i.status IN ['Active', 'Recovering', 'Resolved', 'Under Assessment']
RETURN i.injuryId, i.status;
// Should return empty

// --- Check for injuries with invalid severity ---
MATCH (i:Injury)
WHERE NOT i.severity IN ['Mild', 'Moderate', 'Severe', 'Critical']
RETURN i.injuryId, i.severity;
// Should return empty

// --- Check date consistency (returnToPlayDate should be after injuryDate) ---
MATCH (i:Injury)
WHERE i.returnToPlayDate IS NOT NULL 
  AND i.returnToPlayDate < i.injuryDate
RETURN i.injuryId, i.injuryDate, i.returnToPlayDate;
// Should return empty

// ============================================================================
// PART 4: RELATIONSHIP INTEGRITY
// ============================================================================

// --- Verify all relationship types exist ---
CALL db.relationshipTypes() YIELD relationshipType
RETURN relationshipType
ORDER BY relationshipType;
// Should see: BELONGS_TO, CREATED_UPDATE, FOR_TEAM, HAS_ROLE, HAS_UPDATE, 
//             MANAGES, OCCURRED_DURING, PERFORMED, PLAYS, PLAYS_FOR, SUSTAINED

// --- Count relationships by type ---
MATCH ()-[r]->()
RETURN type(r) AS RelationType, count(*) AS Count
ORDER BY Count DESC;

// --- Check for duplicate PLAYS_FOR relationships ---
MATCH (p:Player)-[r:PLAYS_FOR]->(t:Team)
WITH p, t, count(r) AS relationshipCount
WHERE relationshipCount > 1
RETURN p.playerId, t.teamId, relationshipCount;
// Should return empty (one player shouldn't be assigned to same team twice)

// ============================================================================
// PART 5: QUERY PERFORMANCE TESTS
// ============================================================================

// --- Test player lookup by ID (should use index) ---
PROFILE MATCH (p:Player {playerId: 'PLAYER-001'})
RETURN p;
// Check plan shows "NodeUniqueIndexSeek"

// --- Test injury lookup by date range (should use index) ---
PROFILE MATCH (i:Injury)
WHERE i.injuryDate >= date('2025-01-01') 
  AND i.injuryDate <= date('2025-12-31')
RETURN count(i);
// Check plan shows "NodeIndexSeekByRange"

// --- Test active player lookup (should use index) ---
PROFILE MATCH (p:Player {isActive: true})
RETURN count(p);
// Check plan shows "NodeIndexSeek"

// --- Complex query performance test ---
PROFILE MATCH (p:Player)-[:SUSTAINED]->(i:Injury)
WHERE i.status IN ['Recovering', 'Under Assessment']
  AND i.injuryDate >= date('2024-01-01')
RETURN p.pseudonymId, i.injuryType, i.injuryDate
ORDER BY i.injuryDate DESC
LIMIT 10;
// Should execute quickly with proper indexes

// ============================================================================
// PART 6: BUSINESS LOGIC VALIDATION
// ============================================================================

// --- Get team roster with injury status ---
MATCH (t:Team {teamId: 'TEAM-GU-U21-001'})
MATCH (p:Player)-[:PLAYS_FOR]->(t)
OPTIONAL MATCH (p)-[:SUSTAINED]->(i:Injury)
WHERE i.status IN ['Recovering', 'Under Assessment']
RETURN p.pseudonymId AS Player,
       p.position AS Position,
       CASE WHEN i IS NULL THEN 'Available' ELSE 'Injured' END AS Status,
       i.injuryType AS CurrentInjury,
       i.estimatedRecovery AS DaysToRecovery
ORDER BY Status, p.position;

// --- Get coach workload (number of teams managed) ---
MATCH (c:Coach)-[:MANAGES]->(t:Team)
WITH c, count(t) AS teamCount
RETURN c.pseudonymId AS Coach,
       c.specialization AS Role,
       teamCount AS TeamsManaged
ORDER BY teamCount DESC;

// --- Get injury timeline for a player ---
MATCH (p:Player {playerId: 'PLAYER-001'})-[:SUSTAINED]->(i:Injury)
OPTIONAL MATCH (i)-[:HAS_UPDATE]->(s:StatusUpdate)
RETURN i.injuryType AS Injury,
       i.injuryDate AS Date,
       i.status AS Status,
       collect({
         date: s.updateDate,
         painLevel: s.painLevel,
         status: s.functionalStatus
       }) AS Updates
ORDER BY i.injuryDate DESC;

// --- Get team injury statistics ---
MATCH (t:Team {teamId: 'TEAM-GU-U21-001'})
MATCH (p:Player)-[:PLAYS_FOR]->(t)
MATCH (p)-[:SUSTAINED]->(i:Injury)
RETURN t.name AS Team,
       count(DISTINCT p) AS PlayersWithInjuries,
       count(i) AS TotalInjuries,
       count(CASE WHEN i.status = 'Active' THEN 1 END) AS ActiveInjuries,
       count(CASE WHEN i.status = 'Recovering' THEN 1 END) AS Recovering,
       count(CASE WHEN i.status = 'Resolved' THEN 1 END) AS Resolved;

// --- Get most common injuries across all teams ---
MATCH (i:Injury)
RETURN i.injuryType AS InjuryType,
       i.bodyPart AS BodyPart,
       count(*) AS Occurrences,
       round(avg(i.estimatedRecovery)) AS AvgRecoveryDays
ORDER BY Occurrences DESC
LIMIT 10;

// ============================================================================
// PART 7: AUDIT TRAIL VERIFICATION
// ============================================================================

// --- Recent audit activity ---
MATCH (al:AuditLog)
OPTIONAL MATCH (u)-[:PERFORMED]->(al)
RETURN al.timestamp AS When,
       al.action AS Action,
       al.entityType AS Entity,
       labels(u)[0] AS UserType,
       CASE WHEN u:Coach THEN u.pseudonymId
            WHEN u:Admin THEN u.pseudonymId
            ELSE 'Unknown' END AS User
ORDER BY al.timestamp DESC
LIMIT 20;

// --- Audit log completeness check ---
MATCH (i:Injury)
OPTIONAL MATCH (al:AuditLog {entityType: 'Injury', entityId: i.injuryId})
WITH i, al
WHERE al IS NULL
RETURN count(i) AS InjuriesWithoutAuditLog;
// Ideally should be 0 for production data

// ============================================================================
// PART 8: PRIVACY COMPLIANCE CHECKS
// ============================================================================

// --- Verify no real names in pseudonymized fields ---
MATCH (p:Player)
WHERE p.pseudonymId =~ '.*[a-z]{3,}.*' // Check for words (potential names)
  AND NOT p.pseudonymId STARTS WITH 'PSY-'
RETURN p.playerId, p.pseudonymId;
// Should return empty - all pseudonymIds should be hashed

// --- Check for any free-text fields that might contain PII ---
MATCH (i:Injury)
WHERE i.notes IS NOT NULL
  AND (i.notes =~ '.*email.*' 
    OR i.notes =~ '.*phone.*'
    OR i.notes =~ '.*address.*')
RETURN i.injuryId, substring(i.notes, 0, 100) AS notesPreview;
// Should return empty - notes should not contain PII

// ============================================================================
// PART 9: GRAPH VISUALIZATION QUERIES
// ============================================================================

// --- Visualize a team's complete structure ---
MATCH path = (t:Team {teamId: 'TEAM-GU-U21-001'})-[*1..2]-()
RETURN path
LIMIT 50;

// --- Visualize injury network for a player ---
MATCH path = (p:Player {playerId: 'PLAYER-001'})-[:SUSTAINED]->(i:Injury)
OPTIONAL MATCH updates = (i)-[:HAS_UPDATE]->(s:StatusUpdate)
OPTIONAL MATCH session = (i)-[:OCCURRED_DURING]->(sess:Session)
RETURN path, updates, session;

// --- Visualize organizational hierarchy ---
MATCH path = (o:Organization)<-[:BELONGS_TO]-(t:Team)<-[:PLAYS_FOR]-(p:Player)
WHERE o.orgId = 'ORG-GALWAY-FC-001'
RETURN path
LIMIT 100;

// ============================================================================
// SUCCESS CHECK
// ============================================================================

// --- Final comprehensive check ---
MATCH (n)
WITH labels(n)[0] AS nodeType, count(*) AS nodeCount
RETURN 
  CASE 
    WHEN nodeCount > 0 THEN '✓ Database has data'
    ELSE '✗ Database is empty'
  END AS Status,
  collect({type: nodeType, count: nodeCount}) AS Summary;

// ============================================================================
// COMPLETION MESSAGE
// ============================================================================

RETURN "Verification complete! Review results above for any issues." AS message;

// ============================================================================
// EXPECTED RESULTS SUMMARY (with sample data):
// ============================================================================
// Constraints: 12 UNIQUE constraints
// Indexes: 18+ indexes, all ONLINE
// Node types: Player (7), Injury (3), Team (4), Sport (4), Organization (3),
//             Coach (3), Admin (1), Role (4), Session (3), StatusUpdate (3),
//             AuditLog (3)
// Relationships: ~50+ relationships across 11 types
// ============================================================================

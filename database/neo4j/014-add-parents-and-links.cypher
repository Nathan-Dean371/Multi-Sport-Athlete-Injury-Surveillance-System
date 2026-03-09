// Idempotent script to add Parent nodes and link them to Players
// Safe to run multiple times (uses MERGE)

// Create parents if missing
MERGE (p1:Parent {parentId: 'PARENT-001'})
ON CREATE SET p1 += {
  pseudonymId: 'PSY-PARENT-001', firstName: 'Mary', lastName: 'Murphy',
  email: 'mary.murphy@example.com', phone: '087-1234567', relationship: 'Mother',
  createdAt: datetime(), updatedAt: datetime()
};

MERGE (p2:Parent {parentId: 'PARENT-002'})
ON CREATE SET p2 += {
  pseudonymId: 'PSY-PARENT-002', firstName: 'John', lastName: "O'Connor",
  email: 'john.oconnor@example.com', phone: '087-7654321', relationship: 'Father',
  createdAt: datetime(), updatedAt: datetime()
};

MERGE (p3:Parent {parentId: 'PARENT-003'})
ON CREATE SET p3 += {pseudonymId: 'PSY-PARENT-003', firstName: 'Anne', lastName: 'Kelly', email: 'anne.kelly@example.com', phone: '085-7776666', relationship: 'Mother', createdAt: datetime(), updatedAt: datetime()};
MERGE (p4:Parent {parentId: 'PARENT-004'})
ON CREATE SET p4 += {pseudonymId: 'PSY-PARENT-004', firstName: 'Patrick', lastName: 'Walsh', email: 'patrick.walsh@example.com', phone: '087-6665555', relationship: 'Father', createdAt: datetime(), updatedAt: datetime()};
MERGE (p5:Parent {parentId: 'PARENT-005'})
ON CREATE SET p5 += {pseudonymId: 'PSY-PARENT-005', firstName: 'Siobhan', lastName: 'Ryan', email: 'siobhan.ryan@example.com', phone: '086-5554444', relationship: 'Mother', createdAt: datetime(), updatedAt: datetime()};
MERGE (p6:Parent {parentId: 'PARENT-006'})
ON CREATE SET p6 += {pseudonymId: 'PSY-PARENT-006', firstName: 'Eileen', lastName: 'Brennan', email: 'eileen.brennan@example.com', phone: '085-4443333', relationship: 'Mother', createdAt: datetime(), updatedAt: datetime()};
MERGE (p7:Parent {parentId: 'PARENT-007'})
ON CREATE SET p7 += {pseudonymId: 'PSY-PARENT-007', firstName: 'Michael', lastName: 'McCarthy', email: 'michael.mccarthy@example.com', phone: '087-3332222', relationship: 'Father', createdAt: datetime(), updatedAt: datetime()};

// Link parents to players idempotently
MATCH (p1:Parent {parentId: 'PARENT-001'}), (pl:Player {playerId: 'PLAYER-001'})
MERGE (p1)-[:PARENT_OF {relationship: 'Mother', isPrimaryContact: true, consentGiven: true}]->(pl);
MATCH (p2:Parent {parentId: 'PARENT-002'}), (pl2:Player {playerId: 'PLAYER-002'})
MERGE (p2)-[:PARENT_OF {relationship: 'Father', isPrimaryContact: true, consentGiven: true}]->(pl2);
MATCH (p3:Parent {parentId: 'PARENT-003'}), (pl3:Player {playerId: 'PLAYER-003'})
MERGE (p3)-[:PARENT_OF {relationship: 'Mother', isPrimaryContact: true, consentGiven: true}]->(pl3);
MATCH (p4:Parent {parentId: 'PARENT-004'}), (pl4:Player {playerId: 'PLAYER-004'})
MERGE (p4)-[:PARENT_OF {relationship: 'Father', isPrimaryContact: true, consentGiven: true}]->(pl4);
MATCH (p5:Parent {parentId: 'PARENT-005'}), (pl5:Player {playerId: 'PLAYER-005'})
MERGE (p5)-[:PARENT_OF {relationship: 'Mother', isPrimaryContact: true, consentGiven: true}]->(pl5);
MATCH (p6:Parent {parentId: 'PARENT-006'}), (pl6:Player {playerId: 'PLAYER-006'})
MERGE (p6)-[:PARENT_OF {relationship: 'Mother', isPrimaryContact: true, consentGiven: true}]->(pl6);
MATCH (p7:Parent {parentId: 'PARENT-007'}), (pl7:Player {playerId: 'PLAYER-007'})
MERGE (p7)-[:PARENT_OF {relationship: 'Father', isPrimaryContact: true, consentGiven: true}]->(pl7);

// Verification output
MATCH (p:Player) OPTIONAL MATCH (parent)-[:PARENT_OF]->(p)
RETURN count(p) AS total_players, sum(CASE WHEN parent IS NOT NULL THEN 1 ELSE 0 END) AS players_with_parent;

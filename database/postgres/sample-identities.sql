-- ============================================================================
-- Multi-Sport Athlete Injury Surveillance System
-- Sample Identity Data
-- ============================================================================
--
-- This creates test identity records that map to the pseudonymous IDs
-- in your Neo4j database.
--
-- IMPORTANT: This is TEST DATA ONLY - use fake/generated data in production
--
-- ============================================================================

-- ============================================================================
-- PART 1: PLAYER IDENTITIES
-- ============================================================================

-- Map to Neo4j Players (from sample-data.cypher)
INSERT INTO player_identities (
    pseudonym_id,
    neo4j_player_id,
    first_name,
    last_name,
    date_of_birth,
    email,
    phone_number,
    address_line1,
    city,
    county,
    postal_code,
    country,
    emergency_contact_name,
    emergency_contact_relationship,
    emergency_contact_phone,
    gdpr_consent_given,
    gdpr_consent_date,
    data_processing_consent,
    is_verified
) VALUES
-- PLAYER-001 (PSY-PLAYER-A1B2C3D4)
(
    'PSY-PLAYER-A1B2C3D4',
    'PLAYER-001',
    'Liam',
    'Murphy',
    '2003-05-15',
    'liam.murphy@email.com',
    '+353 87 123 4567',
    '45 St. Patrick Street',
    'Galway',
    'Galway',
    'H91 ABC1',
    'Ireland',
    'Mary Murphy',
    'Mother',
    '+353 87 999 8888',
    true,
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    true,
    true
),

-- PLAYER-002 (PSY-PLAYER-E5F6G7H8)
(
    'PSY-PLAYER-E5F6G7H8',
    'PLAYER-002',
    'Cian',
    'O''Brien',
    '2004-08-22',
    'cian.obrien@email.com',
    '+353 86 234 5678',
    '12 Eyre Square',
    'Galway',
    'Galway',
    'H91 XYZ2',
    'Ireland',
    'John O''Brien',
    'Father',
    '+353 86 888 7777',
    true,
    CURRENT_TIMESTAMP - INTERVAL '25 days',
    true,
    true
),

-- PLAYER-003 (PSY-PLAYER-I9J0K1L2)
(
    'PSY-PLAYER-I9J0K1L2',
    'PLAYER-003',
    'Seán',
    'Kelly',
    '2003-11-30',
    'sean.kelly@email.com',
    '+353 85 345 6789',
    '78 Shop Street',
    'Galway',
    'Galway',
    'H91 DEF3',
    'Ireland',
    'Anne Kelly',
    'Mother',
    '+353 85 777 6666',
    true,
    CURRENT_TIMESTAMP - INTERVAL '20 days',
    true,
    true
),

-- PLAYER-004 (PSY-PLAYER-M3N4O5P6)
(
    'PSY-PLAYER-M3N4O5P6',
    'PLAYER-004',
    'Conor',
    'Walsh',
    '2002-03-10',
    'conor.walsh@email.com',
    '+353 87 456 7890',
    '23 Quay Street',
    'Galway',
    'Galway',
    'H91 GHI4',
    'Ireland',
    'Patrick Walsh',
    'Father',
    '+353 87 666 5555',
    true,
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    true,
    true
),

-- PLAYER-005 (PSY-PLAYER-Q7R8S9T0)
(
    'PSY-PLAYER-Q7R8S9T0',
    'PLAYER-005',
    'Oisín',
    'Ryan',
    '2004-01-18',
    'oisin.ryan@email.com',
    '+353 86 567 8901',
    '89 Dominick Street',
    'Galway',
    'Galway',
    'H91 JKL5',
    'Ireland',
    'Siobhan Ryan',
    'Mother',
    '+353 86 555 4444',
    true,
    CURRENT_TIMESTAMP - INTERVAL '15 days',
    true,
    true
),

-- PLAYER-006 (PSY-PLAYER-U1V2W3X4)
(
    'PSY-PLAYER-U1V2W3X4',
    'PLAYER-006',
    'Darragh',
    'Brennan',
    '1999-07-25',
    'darragh.brennan@email.com',
    '+353 85 678 9012',
    '34 Salthill Promenade',
    'Galway',
    'Galway',
    'H91 MNO6',
    'Ireland',
    'Eileen Brennan',
    'Mother',
    '+353 85 444 3333',
    true,
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    true,
    true
),

-- PLAYER-007 (PSY-PLAYER-Y5Z6A7B8)
(
    'PSY-PLAYER-Y5Z6A7B8',
    'PLAYER-007',
    'Eoin',
    'McCarthy',
    '1995-12-05',
    'eoin.mccarthy@email.com',
    '+353 87 789 0123',
    '56 Newcastle Road',
    'Galway',
    'Galway',
    'H91 PQR7',
    'Ireland',
    'Michael McCarthy',
    'Father',
    '+353 87 333 2222',
    true,
    CURRENT_TIMESTAMP - INTERVAL '90 days',
    true,
    true
);

-- ============================================================================
-- PART 2: COACH IDENTITIES
-- ============================================================================

INSERT INTO coach_identities (
    pseudonym_id,
    neo4j_coach_id,
    first_name,
    last_name,
    date_of_birth,
    email,
    phone_number,
    address_line1,
    city,
    county,
    postal_code,
    country,
    professional_registration_number,
    insurance_provider,
    insurance_policy_number,
    gdpr_consent_given,
    gdpr_consent_date,
    is_verified
) VALUES
-- COACH-001 (PSY-COACH-8F2A9D1B) - Physiotherapist
(
    'PSY-COACH-8F2A9D1B',
    'COACH-001',
    'Sarah',
    'O''Connor',
    '1988-04-12',
    'sarah.oconnor@physio.ie',
    '+353 91 234 5678',
    '12 Medical Centre, NUIG',
    'Galway',
    'Galway',
    'H91 ABC8',
    'Ireland',
    'CORU-PT-12345',
    'MedMal Insurance Ireland',
    'MMI-2024-789',
    true,
    CURRENT_TIMESTAMP - INTERVAL '120 days',
    true
),

-- COACH-002 (PSY-COACH-3B7E4C9A) - Head Coach
(
    'PSY-COACH-3B7E4C9A',
    'COACH-002',
    'Michael',
    'Fitzgerald',
    '1982-09-20',
    'michael.fitzgerald@coaching.ie',
    '+353 91 345 6789',
    '45 Coaching Road',
    'Galway',
    'Galway',
    'H91 DEF9',
    'Ireland',
    'UEFA-A-67890',
    'Sports Coach Insurance Ltd',
    'SCI-2024-456',
    true,
    CURRENT_TIMESTAMP - INTERVAL '150 days',
    true
),

-- COACH-003 (PSY-COACH-6D1F8E2C) - Strength and Conditioning
(
    'PSY-COACH-6D1F8E2C',
    'COACH-003',
    'Emma',
    'Doyle',
    '1990-06-18',
    'emma.doyle@strength.ie',
    '+353 91 456 7890',
    '78 Fitness Centre',
    'Galway',
    'Galway',
    'H91 GHI0',
    'Ireland',
    'CSCS-54321',
    'Professional Trainers Insurance',
    'PTI-2024-123',
    true,
    CURRENT_TIMESTAMP - INTERVAL '100 days',
    true
);

-- ============================================================================
-- PART 3: ADMIN IDENTITIES
-- ============================================================================

INSERT INTO admin_identities (
    pseudonym_id,
    neo4j_admin_id,
    first_name,
    last_name,
    email,
    phone_number,
    is_verified
) VALUES
-- ADMIN-001 (PSY-ADMIN-9A3C5E7D)
(
    'PSY-ADMIN-9A3C5E7D',
    'ADMIN-001',
    'James',
    'O''Sullivan',
    'james.osullivan@admin.ie',
    '+353 91 567 8901',
    true
);

-- ============================================================================
-- PART 4: USER ACCOUNTS (For Authentication)
-- ============================================================================

-- NOTE: In production, use bcrypt or argon2 for password hashing
-- These are example hashes for 'password123' (DO NOT USE IN PRODUCTION!)

INSERT INTO user_accounts (
    identity_type,
    identity_id,
    pseudonym_id,
    email,
    password_hash,
    password_salt,
    is_active,
    is_verified
)
-- Link to player identities
SELECT 
    'player',
    id,
    pseudonym_id,
    email,
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7fBb0FXw0i', -- 'password123' hashed
    'random_salt_' || pseudonym_id,
    is_active,
    is_verified
FROM player_identities
WHERE deleted_at IS NULL;

-- Link to coach identities
INSERT INTO user_accounts (
    identity_type,
    identity_id,
    pseudonym_id,
    email,
    password_hash,
    password_salt,
    is_active,
    is_verified
)
SELECT 
    'coach',
    id,
    pseudonym_id,
    email,
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7fBb0FXw0i',
    'random_salt_' || pseudonym_id,
    is_active,
    is_verified
FROM coach_identities
WHERE deleted_at IS NULL;

-- Link to admin identities
INSERT INTO user_accounts (
    identity_type,
    identity_id,
    pseudonym_id,
    email,
    password_hash,
    password_salt,
    is_active,
    is_verified
)
SELECT 
    'admin',
    id,
    pseudonym_id,
    email,
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7fBb0FXw0i',
    'random_salt_' || pseudonym_id,
    is_active,
    is_verified
FROM admin_identities
WHERE deleted_at IS NULL;

-- ============================================================================
-- PART 5: SAMPLE DATA ACCESS LOGS
-- ============================================================================

-- Log some sample access events
INSERT INTO data_access_log (
    accessor_type,
    accessor_email,
    target_type,
    target_id,
    pseudonym_id,
    access_type,
    access_reason,
    ip_address
)
SELECT 
    'user',
    'sarah.oconnor@physio.ie',
    'player_identity',
    id,
    pseudonym_id,
    'read',
    'Reviewing injury history for treatment plan',
    '192.168.1.100'::inet
FROM player_identities
WHERE pseudonym_id = 'PSY-PLAYER-A1B2C3D4';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show all identities with their types
SELECT * FROM active_identities ORDER BY type, pseudonym_id;

-- Show player identities
SELECT 
    pseudonym_id,
    first_name || ' ' || last_name AS full_name,
    email,
    date_of_birth,
    is_active
FROM player_identities
WHERE deleted_at IS NULL;

-- Show account status
SELECT * FROM account_status_summary ORDER BY identity_type, email;

-- Count records
SELECT 
    'player_identities' AS table_name, 
    COUNT(*) AS count 
FROM player_identities WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'coach_identities', 
    COUNT(*) 
FROM coach_identities WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'admin_identities', 
    COUNT(*) 
FROM admin_identities WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'user_accounts', 
    COUNT(*) 
FROM user_accounts WHERE is_active = true;

-- Show pseudonym mappings
SELECT 
    'Player: ' || first_name || ' ' || last_name AS person,
    pseudonym_id,
    neo4j_player_id
FROM player_identities
WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'Coach: ' || first_name || ' ' || last_name,
    pseudonym_id,
    neo4j_coach_id
FROM coach_identities
WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'Admin: ' || first_name || ' ' || last_name,
    pseudonym_id,
    neo4j_admin_id
FROM admin_identities
WHERE deleted_at IS NULL
ORDER BY person;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Sample Identity Data Created!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - 7 Player identities';
    RAISE NOTICE '  - 3 Coach identities';
    RAISE NOTICE '  - 1 Admin identity';
    RAISE NOTICE '  - 11 User accounts';
    RAISE NOTICE '';
    RAISE NOTICE 'Test credentials (all use password: password123):';
    RAISE NOTICE '  - liam.murphy@email.com (Player)';
    RAISE NOTICE '  - sarah.oconnor@physio.ie (Coach/Physio)';
    RAISE NOTICE '  - james.osullivan@admin.ie (Admin)';
    RAISE NOTICE '';
    RAISE NOTICE 'Pseudonym mappings match Neo4j database';
    RAISE NOTICE '========================================';
END $$;

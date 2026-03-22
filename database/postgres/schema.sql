-- ============================================================================
-- Multi-Sport Athlete Injury Surveillance System
-- Consolidated PostgreSQL Schema (v1.0)
-- ============================================================================
--
-- This file represents the complete current state of the identity_service
-- database and should be used for:
-- 1. Fresh deployments to new environments
-- 2. Disaster recovery
-- 3. Understanding the full schema at a glance
--
-- Individual migration files (001-007) should still be maintained for:
-- - Version control history
-- - Incremental updates to existing deployments
-- - Understanding what changed when
--
-- For fresh setups, this file can be run instead of all 7 migrations.
-- For existing deployments, individual migrations should be applied instead.
--
-- ============================================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PART 1: IDENTITY TABLES
-- ============================================================================

-- Player Identities
CREATE TABLE IF NOT EXISTS player_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pseudonym_id VARCHAR(50) NOT NULL UNIQUE,
    neo4j_player_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    county VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Ireland',
    emergency_contact_name VARCHAR(200),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(20),
    medical_history TEXT,
    current_medications TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    gdpr_consent_given BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMP WITH TIME ZONE,
    data_processing_consent BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_dob_reasonable CHECK (date_of_birth >= '1900-01-01' AND date_of_birth <= CURRENT_DATE)
);

CREATE INDEX IF NOT EXISTS idx_player_identities_pseudonym ON player_identities(pseudonym_id);
CREATE INDEX idx_player_identities_neo4j_id ON player_identities(neo4j_player_id);
CREATE INDEX IF NOT EXISTS idx_player_identities_email ON player_identities(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_player_identities_active ON player_identities(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_player_identities_deleted ON player_identities(deleted_at) WHERE deleted_at IS NULL;

-- Coach/Staff Identities
CREATE TABLE IF NOT EXISTS coach_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pseudonym_id VARCHAR(50) NOT NULL UNIQUE,
    neo4j_coach_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    county VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Ireland',
    professional_registration_number VARCHAR(100),
    insurance_provider VARCHAR(200),
    insurance_policy_number VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    gdpr_consent_given BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_coach_identities_pseudonym ON coach_identities(pseudonym_id);
CREATE INDEX idx_coach_identities_neo4j_id ON coach_identities(neo4j_coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_identities_email ON coach_identities(email);
CREATE INDEX IF NOT EXISTS idx_coach_identities_active ON coach_identities(is_active) WHERE is_active = true;

-- Admin Identities
CREATE TABLE IF NOT EXISTS admin_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pseudonym_id VARCHAR(50) NOT NULL UNIQUE,
    neo4j_admin_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_admin_identities_pseudonym ON admin_identities(pseudonym_id);
CREATE INDEX IF NOT EXISTS idx_admin_identities_email ON admin_identities(email);

-- Parent Identities (Migration 007)
CREATE TABLE IF NOT EXISTS parent_identities (
    parent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pseudonym_id TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- PART 2: AUTHENTICATION & SECURITY
-- ============================================================================

-- User Accounts (for authentication)
CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identity_type VARCHAR(20) NOT NULL,
    identity_id UUID NOT NULL,
    pseudonym_id VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    lock_reason TEXT,
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    current_session_token VARCHAR(500),
    session_expires_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_identity_type CHECK (identity_type IN ('player', 'coach', 'admin', 'parent')),
    CONSTRAINT chk_failed_attempts CHECK (failed_login_attempts >= 0)
);

CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_pseudonym ON user_accounts(pseudonym_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_identity ON user_accounts(identity_type, identity_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_active ON user_accounts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_accounts_reset_token ON user_accounts(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Parent Invitations (Migration 007)
CREATE TABLE IF NOT EXISTS parent_invitations (
    invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_pseudonym_id TEXT NOT NULL,
    parent_email TEXT NOT NULL,
    parent_phone TEXT,
    token TEXT NOT NULL,
    accepted BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Player Invitations (Migration 010)
CREATE TABLE IF NOT EXISTS player_invitations (
    invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_pseudonym_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    accepted BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- User Activity (Migration 009)
-- Records login attempts for audit and admin reporting
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_occurred_at ON user_activity(user_account_id, occurred_at DESC);

-- ============================================================================
-- PART 3: GDPR COMPLIANCE
-- ============================================================================

-- Data Access Log (for GDPR audit trail)
CREATE TABLE IF NOT EXISTS data_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accessor_type VARCHAR(20) NOT NULL,
    accessor_id UUID,
    accessor_email VARCHAR(255),
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    pseudonym_id VARCHAR(50),
    access_type VARCHAR(50) NOT NULL,
    access_reason TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    CONSTRAINT chk_accessor_type CHECK (accessor_type IN ('user', 'system', 'api', 'admin')),
    CONSTRAINT chk_access_type CHECK (access_type IN ('read', 'create', 'update', 'delete', 'export'))
);

CREATE INDEX IF NOT EXISTS idx_data_access_log_target ON data_access_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_data_access_log_accessor ON data_access_log(accessor_type, accessor_id);
CREATE INDEX IF NOT EXISTS idx_data_access_log_time ON data_access_log(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_log_pseudonym ON data_access_log(pseudonym_id);

-- Data Deletion Requests (Right to Erasure)
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_type VARCHAR(20) NOT NULL,
    requester_id UUID NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    pseudonym_id VARCHAR(50) NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID,
    data_retained_until TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_deletion_status CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_requester ON data_deletion_requests(requester_type, requester_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_date ON data_deletion_requests(request_date DESC);

-- Data Export Requests (Right to Portability)
CREATE TABLE IF NOT EXISTS data_export_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_type VARCHAR(20) NOT NULL,
    requester_id UUID NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    pseudonym_id VARCHAR(50) NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    export_format VARCHAR(20) DEFAULT 'json',
    include_neo4j_data BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    export_file_path TEXT,
    download_expires_at TIMESTAMP WITH TIME ZONE,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_export_format CHECK (export_format IN ('json', 'csv', 'pdf')),
    CONSTRAINT chk_export_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_export_requests_requester ON data_export_requests(requester_type, requester_id);

-- ============================================================================
-- PART 4: TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_identities_updated_at
    BEFORE UPDATE ON player_identities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_identities_updated_at
    BEFORE UPDATE ON coach_identities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_identities_updated_at
    BEFORE UPDATE ON admin_identities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_accounts_updated_at
    BEFORE UPDATE ON user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 5: VIEWS FOR EASY ACCESS
-- ============================================================================

CREATE OR REPLACE VIEW active_identities AS
SELECT 
    'player' AS type,
    pseudonym_id,
    first_name || ' ' || last_name AS full_name,
    email,
    is_active,
    created_at
FROM player_identities
WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'coach' AS type,
    pseudonym_id,
    first_name || ' ' || last_name AS full_name,
    email,
    is_active,
    created_at
FROM coach_identities
WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'admin' AS type,
    pseudonym_id,
    first_name || ' ' || last_name AS full_name,
    email,
    is_active,
    created_at
FROM admin_identities
WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW account_status_summary AS
SELECT 
    ua.email,
    ua.identity_type,
    ai.full_name,
    ua.is_active,
    ua.is_locked,
    ua.last_login_at,
    ua.failed_login_attempts,
    ua.two_factor_enabled
FROM user_accounts ua
LEFT JOIN active_identities ai ON ua.pseudonym_id = ai.pseudonym_id;

-- ============================================================================
-- PART 6: SAMPLE DATA
-- ============================================================================

-- Player Identities
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
('PSY-PLAYER-A1B2C3D4', 'PLAYER-001', 'Liam', 'Murphy', '2003-05-15', 'liam.murphy@email.com', '+353 87 123 4567', '45 St. Patrick Street', 'Galway', 'Galway', 'H91 ABC1', 'Ireland', 'Mary Murphy', 'Mother', '+353 87 999 8888', true, CURRENT_TIMESTAMP - INTERVAL '30 days', true, true),
('PSY-PLAYER-E5F6G7H8', 'PLAYER-002', 'Cian', 'O''Brien', '2004-08-22', 'cian.obrien@email.com', '+353 86 234 5678', '12 Eyre Square', 'Galway', 'Galway', 'H91 XYZ2', 'Ireland', 'John O''Brien', 'Father', '+353 86 888 7777', true, CURRENT_TIMESTAMP - INTERVAL '25 days', true, true),
('PSY-PLAYER-I9J0K1L2', 'PLAYER-003', 'Seán', 'Kelly', '2003-11-30', 'sean.kelly@email.com', '+353 85 345 6789', '78 Shop Street', 'Galway', 'Galway', 'H91 DEF3', 'Ireland', 'Anne Kelly', 'Mother', '+353 85 777 6666', true, CURRENT_TIMESTAMP - INTERVAL '20 days', true, true),
('PSY-PLAYER-M3N4O5P6', 'PLAYER-004', 'Conor', 'Walsh', '2002-03-10', 'conor.walsh@email.com', '+353 87 456 7890', '23 Quay Street', 'Galway', 'Galway', 'H91 GHI4', 'Ireland', 'Patrick Walsh', 'Father', '+353 87 666 5555', true, CURRENT_TIMESTAMP - INTERVAL '45 days', true, true),
('PSY-PLAYER-Q7R8S9T0', 'PLAYER-005', 'Oisín', 'Ryan', '2004-01-18', 'oisin.ryan@email.com', '+353 86 567 8901', '89 Dominick Street', 'Galway', 'Galway', 'H91 JKL5', 'Ireland', 'Siobhan Ryan', 'Mother', '+353 86 555 4444', true, CURRENT_TIMESTAMP - INTERVAL '15 days', true, true),
('PSY-PLAYER-U1V2W3X4', 'PLAYER-006', 'Darragh', 'Brennan', '1999-07-25', 'darragh.brennan@email.com', '+353 85 678 9012', '34 Salthill Promenade', 'Galway', 'Galway', 'H91 MNO6', 'Ireland', 'Eileen Brennan', 'Mother', '+353 85 444 3333', true, CURRENT_TIMESTAMP - INTERVAL '60 days', true, true),
('PSY-PLAYER-Y5Z6A7B8', 'PLAYER-007', 'Eoin', 'McCarthy', '1995-12-05', 'eoin.mccarthy@email.com', '+353 87 789 0123', '56 Newcastle Road', 'Galway', 'Galway', 'H91 PQR7', 'Ireland', 'Michael McCarthy', 'Father', '+353 87 333 2222', true, CURRENT_TIMESTAMP - INTERVAL '90 days', true, true)
ON CONFLICT (pseudonym_id) DO NOTHING;

-- Coach Identities
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
('PSY-COACH-8F2A9D1B', 'COACH-001', 'Sarah', 'O''Connor', '1988-04-12', 'sarah.oconnor@physio.ie', '+353 91 234 5678', '12 Medical Centre, NUIG', 'Galway', 'Galway', 'H91 ABC8', 'Ireland', 'CORU-PT-12345', 'MedMal Insurance Ireland', 'MMI-2024-789', true, CURRENT_TIMESTAMP - INTERVAL '120 days', true),
('PSY-COACH-3B7E4C9A', 'COACH-002', 'Michael', 'Fitzgerald', '1982-09-20', 'michael.fitzgerald@coaching.ie', '+353 91 345 6789', '45 Coaching Road', 'Galway', 'Galway', 'H91 DEF9', 'Ireland', 'UEFA-A-67890', 'Sports Coach Insurance Ltd', 'SCI-2024-456', true, CURRENT_TIMESTAMP - INTERVAL '150 days', true),
('PSY-COACH-6D1F8E2C', 'COACH-003', 'Emma', 'Doyle', '1990-06-18', 'emma.doyle@strength.ie', '+353 91 456 7890', '78 Fitness Centre', 'Galway', 'Galway', 'H91 GHI0', 'Ireland', 'CSCS-54321', 'Professional Trainers Insurance', 'PTI-2024-123', true, CURRENT_TIMESTAMP - INTERVAL '100 days', true)
ON CONFLICT (pseudonym_id) DO NOTHING;

-- Admin Identities
INSERT INTO admin_identities (
    pseudonym_id,
    neo4j_admin_id,
    first_name,
    last_name,
    email,
    phone_number,
    is_verified
) VALUES
('PSY-ADMIN-9A3C5E7D', 'ADMIN-001', 'James', 'O''Sullivan', 'james.osullivan@admin.ie', '+353 91 567 8901', true)
ON CONFLICT (pseudonym_id) DO NOTHING;

-- User Accounts
INSERT INTO user_accounts (
    identity_type,
    identity_id,
    pseudonym_id,
    email,
    password_hash,
    password_salt,
    is_active
)
SELECT 
    'player',
    id,
    pseudonym_id,
    email,
    '$2b$12$zN5zTkdktQNsKE98TwTaiOofXt5HPA4iGxo1xzgix6saB9F4NdSya',
    'bcrypt',
    is_active
FROM player_identities
WHERE deleted_at IS NULL
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_accounts (
    identity_type,
    identity_id,
    pseudonym_id,
    email,
    password_hash,
    password_salt,
    is_active
)
SELECT 
    'coach',
    id,
    pseudonym_id,
    email,
    '$2b$12$zN5zTkdktQNsKE98TwTaiOofXt5HPA4iGxo1xzgix6saB9F4NdSya',
    'bcrypt',
    is_active
FROM coach_identities
WHERE deleted_at IS NULL
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_accounts (
    identity_type,
    identity_id,
    pseudonym_id,
    email,
    password_hash,
    password_salt,
    is_active
)
SELECT 
    'admin',
    id,
    pseudonym_id,
    email,
    '$2b$12$zN5zTkdktQNsKE98TwTaiOofXt5HPA4iGxo1xzgix6saB9F4NdSya',
    'bcrypt',
    is_active
FROM admin_identities
WHERE deleted_at IS NULL
ON CONFLICT (email) DO NOTHING;

-- Sample Data Access Log
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
WHERE pseudonym_id = 'PSY-PLAYER-A1B2C3D4'
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICATION & SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Identity Service Schema Created!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - player_identities';
    RAISE NOTICE '  - coach_identities';
    RAISE NOTICE '  - admin_identities';
    RAISE NOTICE '  - parent_identities';
    RAISE NOTICE '  - user_accounts';
    RAISE NOTICE '  - parent_invitations';
    RAISE NOTICE '  - data_access_log';
    RAISE NOTICE '  - data_deletion_requests';
    RAISE NOTICE '  - data_export_requests';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  - active_identities';
    RAISE NOTICE '  - account_status_summary';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample data loaded (7 players, 3 coaches, 1 admin)';
    RAISE NOTICE 'Test credentials: password123 for all accounts';
    RAISE NOTICE '========================================';
END $$;

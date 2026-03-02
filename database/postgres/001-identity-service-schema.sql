-- ============================================================================
-- Multi-Sport Athlete Injury Surveillance System
-- PostgreSQL Identity Service Schema
-- ============================================================================
-- 
-- This database stores the mapping between pseudonymous IDs and real
-- personally identifiable information (PII). This separation ensures
-- GDPR compliance and data privacy.
--
-- CRITICAL SECURITY NOTES:
-- 1. This database should be encrypted at rest
-- 2. Access should be strictly controlled and audited
-- 3. Backups must be encrypted
-- 4. Connection should use SSL/TLS in production
-- 5. Consider using PostgreSQL's pgcrypto for field-level encryption
--
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PART 1: IDENTITY TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Player Identities
-- ----------------------------------------------------------------------------
CREATE TABLE player_identities (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Pseudonymous ID (matches Neo4j)
    pseudonym_id VARCHAR(50) NOT NULL UNIQUE,
    neo4j_player_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    
    -- Contact Information
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    county VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Ireland',
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(20),
    
    -- Medical Information (encrypted)
    medical_history TEXT, -- Should be encrypted in production
    current_medications TEXT, -- Should be encrypted in production
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Consent Management
    gdpr_consent_given BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMP WITH TIME ZONE,
    data_processing_consent BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    
    -- Constraints
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_dob_reasonable CHECK (date_of_birth >= '1900-01-01' AND date_of_birth <= CURRENT_DATE)
);

-- Indexes for player_identities
CREATE INDEX idx_player_identities_pseudonym ON player_identities(pseudonym_id);
CREATE INDEX idx_player_identities_neo4j_id ON player_identities(neo4j_player_id);
CREATE INDEX idx_player_identities_email ON player_identities(email) WHERE email IS NOT NULL;
CREATE INDEX idx_player_identities_active ON player_identities(is_active) WHERE is_active = true;
CREATE INDEX idx_player_identities_deleted ON player_identities(deleted_at) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE player_identities IS 'Stores real identity information for players, linked to Neo4j via pseudonym_id';
COMMENT ON COLUMN player_identities.pseudonym_id IS 'Pseudonymous ID used in Neo4j (e.g., PSY-PLAYER-A1B2C3D4)';
COMMENT ON COLUMN player_identities.medical_history IS 'Encrypted medical history - use pgcrypto in production';

-- ----------------------------------------------------------------------------
-- Coach/Staff Identities
-- ----------------------------------------------------------------------------
CREATE TABLE coach_identities (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Pseudonymous ID (matches Neo4j)
    pseudonym_id VARCHAR(50) NOT NULL UNIQUE,
    neo4j_coach_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    
    -- Contact Information
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    county VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Ireland',
    
    -- Professional Information
    professional_registration_number VARCHAR(100),
    insurance_provider VARCHAR(200),
    insurance_policy_number VARCHAR(100),
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Consent Management
    gdpr_consent_given BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

-- Indexes for coach_identities
CREATE INDEX idx_coach_identities_pseudonym ON coach_identities(pseudonym_id);
CREATE INDEX idx_coach_identities_neo4j_id ON coach_identities(neo4j_coach_id);
CREATE INDEX idx_coach_identities_email ON coach_identities(email);
CREATE INDEX idx_coach_identities_active ON coach_identities(is_active) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- Admin Identities
-- ----------------------------------------------------------------------------
CREATE TABLE admin_identities (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Pseudonymous ID (matches Neo4j)
    pseudonym_id VARCHAR(50) NOT NULL UNIQUE,
    neo4j_admin_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Contact Information
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT true,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

-- Indexes for admin_identities
CREATE INDEX idx_admin_identities_pseudonym ON admin_identities(pseudonym_id);
CREATE INDEX idx_admin_identities_email ON admin_identities(email);

-- ============================================================================
-- PART 2: AUTHENTICATION & SECURITY
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Accounts (for authentication)
-- ----------------------------------------------------------------------------
CREATE TABLE user_accounts (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link to identity (polymorphic)
    identity_type VARCHAR(20) NOT NULL, -- 'player', 'coach', 'admin'
    identity_id UUID NOT NULL,
    pseudonym_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- Authentication
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    
    -- Two-Factor Authentication
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    lock_reason TEXT,
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP WITH TIME ZONE,
    
    -- Session Management
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    current_session_token VARCHAR(500),
    session_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Password Management
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_identity_type CHECK (identity_type IN ('player', 'coach', 'admin')),
    CONSTRAINT chk_failed_attempts CHECK (failed_login_attempts >= 0)
);

-- Indexes for user_accounts
CREATE INDEX idx_user_accounts_email ON user_accounts(email);
CREATE INDEX idx_user_accounts_pseudonym ON user_accounts(pseudonym_id);
CREATE INDEX idx_user_accounts_identity ON user_accounts(identity_type, identity_id);
CREATE INDEX idx_user_accounts_active ON user_accounts(is_active) WHERE is_active = true;
CREATE INDEX idx_user_accounts_reset_token ON user_accounts(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- ============================================================================
-- PART 3: GDPR COMPLIANCE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Data Access Log (for GDPR audit trail)
-- ----------------------------------------------------------------------------
CREATE TABLE data_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who accessed
    accessor_type VARCHAR(20) NOT NULL, -- 'user', 'system', 'api'
    accessor_id UUID,
    accessor_email VARCHAR(255),
    
    -- What was accessed
    target_type VARCHAR(50) NOT NULL, -- 'player_identity', 'coach_identity', etc.
    target_id UUID NOT NULL,
    pseudonym_id VARCHAR(50),
    
    -- How it was accessed
    access_type VARCHAR(50) NOT NULL, -- 'read', 'update', 'delete', 'export'
    access_reason TEXT,
    
    -- When and where
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    -- What changed (for updates)
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    
    CONSTRAINT chk_accessor_type CHECK (accessor_type IN ('user', 'system', 'api', 'admin')),
    CONSTRAINT chk_access_type CHECK (access_type IN ('read', 'create', 'update', 'delete', 'export'))
);

-- Indexes for data_access_log
CREATE INDEX idx_data_access_log_target ON data_access_log(target_type, target_id);
CREATE INDEX idx_data_access_log_accessor ON data_access_log(accessor_type, accessor_id);
CREATE INDEX idx_data_access_log_time ON data_access_log(accessed_at DESC);
CREATE INDEX idx_data_access_log_pseudonym ON data_access_log(pseudonym_id);

-- ----------------------------------------------------------------------------
-- Data Deletion Requests (Right to Erasure)
-- ----------------------------------------------------------------------------
CREATE TABLE data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who requested deletion
    requester_type VARCHAR(20) NOT NULL, -- 'player', 'coach', 'admin'
    requester_id UUID NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    pseudonym_id VARCHAR(50) NOT NULL,
    
    -- Request details
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    
    -- Processing
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Completion
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID,
    
    -- Retention (for audit trail)
    data_retained_until TIMESTAMP WITH TIME ZONE, -- Usually 30 days after deletion
    
    CONSTRAINT chk_deletion_status CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled'))
);

-- Indexes for data_deletion_requests
CREATE INDEX idx_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX idx_deletion_requests_requester ON data_deletion_requests(requester_type, requester_id);
CREATE INDEX idx_deletion_requests_date ON data_deletion_requests(request_date DESC);

-- ----------------------------------------------------------------------------
-- Data Export Requests (Right to Portability)
-- ----------------------------------------------------------------------------
CREATE TABLE data_export_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who requested export
    requester_type VARCHAR(20) NOT NULL,
    requester_id UUID NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    pseudonym_id VARCHAR(50) NOT NULL,
    
    -- Request details
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    export_format VARCHAR(20) DEFAULT 'json', -- 'json', 'csv', 'pdf'
    include_neo4j_data BOOLEAN DEFAULT true,
    
    -- Processing
    status VARCHAR(50) DEFAULT 'pending',
    
    -- Completion
    completed_at TIMESTAMP WITH TIME ZONE,
    export_file_path TEXT, -- Encrypted storage location
    download_expires_at TIMESTAMP WITH TIME ZONE,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT chk_export_format CHECK (export_format IN ('json', 'csv', 'pdf')),
    CONSTRAINT chk_export_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired'))
);

-- Indexes for data_export_requests
CREATE INDEX idx_export_requests_status ON data_export_requests(status);
CREATE INDEX idx_export_requests_requester ON data_export_requests(requester_type, requester_id);

-- ============================================================================
-- PART 4: TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
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

-- View to get all active identities
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

-- View for account status
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
-- PART 6: SAMPLE QUERIES (FOR TESTING)
-- ============================================================================

-- These are commented out - uncomment to test

/*
-- Get identity from pseudonym ID
SELECT * FROM player_identities 
WHERE pseudonym_id = 'PSY-PLAYER-A1B2C3D4';

-- Get all access logs for a specific person
SELECT * FROM data_access_log 
WHERE pseudonym_id = 'PSY-PLAYER-A1B2C3D4' 
ORDER BY accessed_at DESC;

-- Get pending deletion requests
SELECT * FROM data_deletion_requests 
WHERE status = 'pending' 
ORDER BY request_date;

-- Check account status
SELECT * FROM account_status_summary 
WHERE email = 'player@example.com';
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Identity Service Schema Created Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - player_identities';
    RAISE NOTICE '  - coach_identities';
    RAISE NOTICE '  - admin_identities';
    RAISE NOTICE '  - user_accounts';
    RAISE NOTICE '  - data_access_log';
    RAISE NOTICE '  - data_deletion_requests';
    RAISE NOTICE '  - data_export_requests';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  - active_identities';
    RAISE NOTICE '  - account_status_summary';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Run sample-identities.sql to add test data';
    RAISE NOTICE '  2. Configure encryption for sensitive fields';
    RAISE NOTICE '  3. Set up SSL connections in production';
    RAISE NOTICE '  4. Review and adjust GDPR retention policies';
    RAISE NOTICE '========================================';
END $$;

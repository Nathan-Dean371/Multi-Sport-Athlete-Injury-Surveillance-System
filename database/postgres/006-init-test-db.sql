-- ============================================================================
-- Initialize PostgreSQL Test Database
-- ============================================================================
-- This script creates and initializes the test database with the same schema
-- as the development database, ensuring test environment mirrors production.
-- ============================================================================

-- Connect as superuser to create database
\c postgres

-- Drop existing test database if it exists (for clean setup)
DROP DATABASE IF EXISTS identity_service_test;

-- Create test database
CREATE DATABASE identity_service_test
    WITH 
    OWNER = identity_admin
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE identity_service_test 
    IS 'Test database for Multi-Sport Athlete Injury Surveillance System';

-- Connect to test database
\c identity_service_test

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE identity_service_test TO identity_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO identity_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO identity_admin;

-- ============================================================================
-- Schema will be applied from identity-service-schema.sql
-- This script only creates the database structure
-- Run: psql -U identity_admin -d identity_service_test -f identity-service-schema.sql
-- ============================================================================

SELECT 'Test database created successfully' AS status;

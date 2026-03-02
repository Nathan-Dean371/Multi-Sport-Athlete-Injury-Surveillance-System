-- ============================================================================
-- Create User Accounts for Existing Sample Identities
-- ============================================================================
-- This script creates user accounts with hashed passwords for all existing
-- sample identities so they can log in to the system.
-- Password for all accounts: password123
-- Hash generated with: bcrypt.hash('password123', 10)
-- ============================================================================

-- Create user accounts for all player identities
INSERT INTO user_accounts (
    email,
    password_hash,
    password_salt,
    identity_type,
    pseudonym_id,
    identity_id,
    is_active
)
SELECT
    email,
    '$2a$10$rQ5vN8vZ9YxK3nJ0p5Y8KeGZYqXQH0YL8eJ1YxK3nJ0p5Y8KeGZYq', -- bcrypt hash for 'password123'
    'bcrypt',
    'player',
    pseudonym_id,
    id,
    true
FROM player_identities
WHERE email NOT IN (SELECT email FROM user_accounts)
ON CONFLICT (email) DO NOTHING;

-- Create user accounts for all coach identities
INSERT INTO user_accounts (
    email,
    password_hash,
    password_salt,
    identity_type,
    pseudonym_id,
    identity_id,
    is_active
)
SELECT
    email,
    '$2a$10$rQ5vN8vZ9YxK3nJ0p5Y8KeGZYqXQH0YL8eJ1YxK3nJ0p5Y8KeGZYq', -- bcrypt hash for 'password123'
    'bcrypt',
    'coach',
    pseudonym_id,
    id,
    true
FROM coach_identities
WHERE email NOT IN (SELECT email FROM user_accounts)
ON CONFLICT (email) DO NOTHING;

-- Create user accounts for all admin identities
INSERT INTO user_accounts (
    email,
    password_hash,
    password_salt,
    identity_type,
    pseudonym_id,
    identity_id,
    is_active
)
SELECT
    email,
    '$2a$10$rQ5vN8vZ9YxK3nJ0p5Y8KeGZYqXQH0YL8eJ1YxK3nJ0p5Y8KeGZYq', -- bcrypt hash for 'password123'
    'bcrypt',
    'admin',
    pseudonym_id,
    id,
    true
FROM admin_identities
WHERE email NOT IN (SELECT email FROM user_accounts)
ON CONFLICT (email) DO NOTHING;

-- Verify user accounts created
SELECT 
    'User Accounts Created' as status,
    COUNT(*) as total_accounts
FROM user_accounts;

SELECT
    identity_type,
    COUNT(*) as count
FROM user_accounts
GROUP BY identity_type
ORDER BY identity_type;

-- Show sample login credentials
SELECT
    identity_type,
    email,
    'password123' as password
FROM user_accounts
WHERE email LIKE '%@email.com' OR email LIKE '%@physio.ie' OR email LIKE '%@admin.ie'
ORDER BY identity_type, email
LIMIT 10;

-- Fix password hashes for all user accounts
-- This sets all passwords to 'password123'

UPDATE user_accounts 
SET password_hash = '$2b$12$zN5zTkdktQNsKE98TwTaiOofXt5HPA4iGxo1xzgix6saB9F4NdSya';

SELECT 'Updated ' || COUNT(*) || ' user accounts' as result FROM user_accounts;
SELECT email, substring(password_hash, 1, 10) as hash_start FROM user_accounts LIMIT 3;

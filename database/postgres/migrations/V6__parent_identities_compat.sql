-- Migration: Align parent_identities schema with current backend expectations
--
-- Context:
-- - V1 baseline created parent_identities with phone_number + required neo4j_parent_id.
-- - Current backend code expects phone and does not provide neo4j_parent_id.
--
-- This migration makes the table backward/forward compatible by:
-- - Ensuring both phone and phone_number columns exist
-- - Allowing neo4j_parent_id to be NULL (unique constraint still applies)
-- - Backfilling phone/phone_number/neo4j_parent_id when possible

BEGIN;

-- Ensure columns exist (handles either V1-style or V2-style schemas)
ALTER TABLE IF EXISTS parent_identities
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE IF EXISTS parent_identities
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

ALTER TABLE IF EXISTS parent_identities
  ADD COLUMN IF NOT EXISTS neo4j_parent_id VARCHAR(50);

-- If neo4j_parent_id exists and is NOT NULL, relax it to allow inserts from backend
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'parent_identities'
      AND column_name = 'neo4j_parent_id'
      AND is_nullable = 'NO'
  ) THEN
    EXECUTE 'ALTER TABLE parent_identities ALTER COLUMN neo4j_parent_id DROP NOT NULL';
  END IF;
END $$;

-- Backfill phone fields both ways
UPDATE parent_identities
SET phone = COALESCE(phone, phone_number)
WHERE phone IS NULL;

UPDATE parent_identities
SET phone_number = COALESCE(phone_number, phone)
WHERE phone_number IS NULL AND phone IS NOT NULL;

-- Backfill neo4j_parent_id from pseudonym_id when missing
UPDATE parent_identities
SET neo4j_parent_id = pseudonym_id
WHERE neo4j_parent_id IS NULL;

COMMIT;

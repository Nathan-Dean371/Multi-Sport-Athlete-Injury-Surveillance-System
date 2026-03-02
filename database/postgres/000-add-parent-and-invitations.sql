-- Migration: add parent identities and invitations table
BEGIN;

-- Create parent identities table
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

-- Invitations from coach -> parent
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

-- Allow user_accounts.identity_type to include 'parent'
ALTER TABLE IF EXISTS user_accounts
  DROP CONSTRAINT IF EXISTS user_accounts_identity_type_check;

ALTER TABLE IF EXISTS user_accounts
  ADD CONSTRAINT user_accounts_identity_type_check
  CHECK (identity_type IN ('player','coach','admin','parent'));

COMMIT;

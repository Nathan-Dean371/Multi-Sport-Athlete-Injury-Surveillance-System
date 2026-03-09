-- Migration: add coach invitations table
-- This enables admins to invite coaches to join the platform via email

BEGIN;

-- Create coach invitations table
CREATE TABLE IF NOT EXISTS coach_invitations (
  invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_pseudonym_id TEXT NOT NULL,
  coach_email TEXT NOT NULL,
  coach_first_name TEXT,
  coach_last_name TEXT,
  token TEXT NOT NULL UNIQUE,
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days')
);

-- Create index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_coach_invitations_token 
  ON coach_invitations(token);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_coach_invitations_email 
  ON coach_invitations(coach_email);

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_coach_invitations_admin 
  ON coach_invitations(admin_pseudonym_id);

COMMIT;

-- Migration: add player invitations table
-- This enables parents to invite athletes/players to register and link to them

BEGIN;

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

COMMIT;

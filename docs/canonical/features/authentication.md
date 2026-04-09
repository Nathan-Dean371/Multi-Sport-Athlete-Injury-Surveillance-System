---
title: Authentication
doc_type: feature
status: active-staging
last_updated: 2026-04-09
owner: docs
canonical: true
---

# Authentication (Canonical)

## Current Behavior

Authentication is JWT-based and implemented in `backend/src/auth`.

Code-backed defaults:

- JWT expiry: `1d` (`backend/src/config/configuration.ts`, `backend/src/auth/auth.module.ts`)

## Endpoints

- `POST /auth/register`
- `POST /auth/login`

Additional auth flows should be documented only after code is merged.

## Source Documents

- Legacy implementation write-up: `docs/authentication-implementation.md` (deprecated banner added)
- Backend API module overview: `backend/README.md`

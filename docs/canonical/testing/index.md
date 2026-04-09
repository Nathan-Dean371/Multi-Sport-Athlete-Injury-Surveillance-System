---
title: Testing
doc_type: hub
status: active-staging
last_updated: 2026-04-09
owner: docs
canonical: true
---

# Testing

## Test Paths

- Root database tests: `tests/databases/*`
- Backend unit and e2e tests: `backend/` (`npm run test`, `npm run test:e2e`)

## Test Environment Setup

Use isolated test database workflow:

```powershell
.\scripts\setup-test-databases.ps1
.\scripts\sync-test-schema.ps1
```

## Canonical Notes

- Test databases are intentionally separated from development databases.
- Keep this page as the main entry for testing docs; legacy testing pages are redirects.

## Legacy Sources

- `docs/tests/database-tests.md`
- `docs/tests/TEST-DATABASE-SETUP.md`

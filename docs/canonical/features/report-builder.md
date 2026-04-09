---
title: Report Builder
doc_type: feature
status: active-staging
last_updated: 2026-04-09
owner: docs
canonical: true
---

# Report Builder (Canonical)

## Summary

The report builder supports dynamic metrics, filters, and aggregate functions for injury analytics.

## API Surface

- `POST /reports/build`
- `POST /reports/save`
- `GET /reports/saved`
- `GET /reports/saved/:id`
- `POST /reports/saved/:id/generate`
- `DELETE /reports/saved/:id`

## Implementation References

- Backend reports module: `backend/src/reports/`
- Admin dashboard report UI: `web/admin-dashboard/`

## Source Material

- Legacy feature page: `docs/REPORT-BUILDER.md` (deprecated banner added)

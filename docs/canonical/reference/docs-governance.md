---
title: Documentation Governance
doc_type: policy
status: active-staging
last_updated: 2026-04-09
owner: docs
canonical: true
---

# Documentation Governance

## Purpose

Define how documentation stays accurate, discoverable, and non-contradictory.

## Source-of-Truth Rules

- Canonical guidance lives in `docs/canonical/`.
- Legacy guides must include a deprecation banner and canonical redirect link.
- For behavior conflicts, source code and tests are authoritative over prose docs.

## Update Requirements

When changing runtime behavior, update all of:

1. Relevant canonical page(s)
2. Entry-point links if navigation changes
3. Legacy redirect notes if affected
4. ADR(s) when architecture decisions change

## Metadata Standard

Canonical pages must include frontmatter keys:

- `title`
- `doc_type`
- `status`
- `last_updated`
- `owner`
- `canonical`

## Review Checklist

- Links resolve to existing files
- No duplicate setup path presented as equally primary
- Demo URLs match current runtime
- Auth/security values in docs match code defaults
- ADR links are current

## Suggested Cadence

- Quick docs sanity review each sprint
- Full docs consistency review before demos/release milestones

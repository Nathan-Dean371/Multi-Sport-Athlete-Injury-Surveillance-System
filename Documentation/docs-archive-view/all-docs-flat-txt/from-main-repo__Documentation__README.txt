# Documentation Archive

**Status:** ✅ Reference Only  
**Last Updated:** April 14, 2026  
**Purpose:** Archived documentation snapshots for comparison and reference  

---

## Overview

This folder contains archived copies of documentation from two sources:
1. **Main project repository** — Recent snapshots of active documentation
2. **FYP documentation repository** — Thesis and planning-related documentation

## How This Project Was Built

The delivery approach was architecture-first and feature-driven:
- Define system structure and key feature requirements in documentation
- Implement directly against those definitions
- Capture decisions through ADRs and implementation documents

Formal sprint planning/tracking was not the primary workflow. Any sprint-style notes in this archive should be treated as historical context.

> ⚠️ **NOTE:** These are archived copies, not the active source of truth. For current operational documentation, refer to the main repo:
> - `docs/` — Active project documentation
> - `scripts/`, `ops/`, `web/`, `database/postgres/` — Component-specific documentation

---

## Contents

### Main Repository Archive
- **[docs-archive-view/from-main-repo/docs](docs-archive-view/from-main-repo/docs/)** — Complete snapshot of active project documentation
  - Architecture guides and ADRs
  - Setup guides for all components
  - Feature implementation documentation
  - Testing strategy and guides

### FYP Documentation Archive
- **[docs-archive-view/from-fyp-doc-repo](docs-archive-view/from-fyp-doc-repo/)** — Thesis and planning documentation
  - Project planning and initial requirements
  - Sprint planning documents
  - FYP-specific notes and analysis

### Inventory
- **[docs-archive-view/INVENTORY.txt](docs-archive-view/INVENTORY.txt)** — Complete listing of all archived files

---

## When to Use This Archive

✅ **Do use this archive for:**
- Comparing documentation versions over time
- Reviewing how documentation has evolved
- Finding planning documents from early project phases
- Offline reference copies

❌ **Don't use this archive for:**
- Current setup instructions → Use [docs/setup/](../docs/setup/) instead
- Active feature documentation → Use [docs/](../docs/) instead
- Current architecture decisions → Check [docs/decisions/](../docs/decisions/) instead

---

## Related Documentation

- **[Active Documentation](../docs/README.md)** — Live documentation hub
- **[Documentation Style Guide](../docs/DOCUMENTATION-STYLE-GUIDE.md)** — How docs are structured
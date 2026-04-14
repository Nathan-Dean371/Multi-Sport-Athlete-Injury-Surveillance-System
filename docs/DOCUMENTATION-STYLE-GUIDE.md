# Documentation Style Guide & Consistency Improvements

## Overview

This guide establishes consistent structure and formatting for all documentation in the Multi-Sport Athlete Injury Surveillance System project. Using consistent patterns makes documentation easier to maintain, navigate, and understand.

---

## Document Classification

Documentation falls into five main categories, each with its own structure template:

### 1. **Feature Implementation Docs**
Documents describing new features or system components (e.g., `authentication-implementation.md`, `REPORT-BUILDER.md`)

### 2. **Setup & Installation Guides**
Step-by-step guides for installing, configuring, or troubleshooting (e.g., `neo4j-setup-guide.md`, `postgres-setup-guide.md`)

### 3. **Strategy & Planning Docs**
High-level documentation of project strategies and decisions (e.g., `TESTING-STRATEGY.md`)

### 4. **Architecture Decision Records (ADRs)**
Formal records of major architectural decisions with context and consequences

### 5. **Reference & Index Docs**
Navigation hubs and reference material (`README.md` files in subdirectories)

---

## Naming Conventions

**Establish a consistent naming pattern across all documents:**

| Document Type | Pattern | Example |
|---|---|---|
| Setup guides | `kebab-case-guide.md` or `SCREAMING_SETUP.md` | `neo4j-setup-guide.md` |
| Feature implementation | `FEATURE-NAME.md` | `COACH-INJURY-REPORTING.md` |
| Strategy documents | `FEATURE-STRATEGY.md` | `TESTING-STRATEGY.md` |
| ADRs | `adr-XXXX-description.md` | `adr-0001-monorepo-architecture.md` |
| Guides (quick refs) | `DESCRIPTIVE_REFERENCE.md` | `QUICK_START.md` |

**Current Issues:**
- Mix of kebab-case (`postgres-setup-guide.md`) and SCREAMING_CASE (`QUICK_START.md`)
- Inconsistent capitalization

**Recommendation:** Choose ONE pattern per document type and update existing files to match.

---

## Template: Feature Implementation Documents

**Files affected:** `authentication-implementation.md`, `COACH-INJURY-REPORTING.md`, `REPORT-BUILDER.md`

**Current state:** Each document has different structure and level of detail.

### Recommended Structure

```markdown
# Feature Name

**Status:** ✅ Complete | 🚀 In Progress | ⚠️ Proposed  
**Last Updated:** January 14, 2026  
**Author:** Team or Individual Name

---

## Overview
Brief description of what the feature does and why it matters. Include key business value.

---

## Quick Start / TL;DR
For busy readers: how to access/use this feature in 2-3 bullet points.

---

## Features & Capabilities
Detailed feature list with sub-sections if needed. Use emojis consistently if present.

### Key Capability 1
Description and context.

### Key Capability 2
Description and context.

---

## Architecture

### Components
List of files/modules with brief description.

### Technology Stack
Key technologies and dependencies used.

### Data Model / Database Schema
If applicable, show database structure or data model.

---

## Configuration & Setup
Steps to enable/configure this feature in development and production.

---

## User Features & Workflows

### For [User Type 1]
Step-by-step workflow or user journey.

### For [User Type 2]
Step-by-step workflow or user journey.

---

## API Reference
If this feature exposes API endpoints, document them:

### Endpoint Name
**Method** `/path`  
Description  
**Request** | **Response** examples  

---

## Related Documentation
- Link to related features
- Link to architecture documentation
- Link to setup guides

---

## Known Limitations
List any known issues or limitations.

---

## Troubleshooting
Common issues and solutions.
```

### Current Issues in Feature Docs:
1. **authentication-implementation.md** - Excellent structure ✅
2. **COACH-INJURY-REPORTING.md** - Missing metadata (status, date), inconsistent section organization
3. **REPORT-BUILDER.md** - No status/date metadata, missing "Quick Start" section for quick reference

---

## Template: Setup & Installation Guides

**Files affected:** `neo4j-setup-guide.md`, `postgres-setup-guide.md`, `QUICK_START.md`, `mobile-app-setup.md`

**Current state:** Each guide has different structure and organization.

### Recommended Structure

```markdown
# [Component] Setup Guide

**Difficulty:** Beginner | Intermediate | Advanced  
**Time to Complete:** ~15 minutes  
**Prerequisites:** List key requirements  

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation-options)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

---

## Installation Options

### Option 1: [Approach Name] (Recommended)
**Best for:** Use case or environment type

Steps:
1. Step one
2. Step two

#### Connection Details / Verification
Show how to verify this option worked.

### Option 2: [Alternative Approach]
**Best for:** Use case or environment type

Steps:
1. Step one
2. Step two

---

## Configuration

### Initial Setup
Steps for first-time configuration.

### Environment Variables
Table of required environment variables.

### Advanced Configuration
Optional tuning and customization.

---

## Verification

How to verify the installation was successful.

```bash
# Command to verify
expected output here
```

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| Error message | Why it happens | How to fix it |

---

## Next Steps
What to do after successful setup.

---

## Related Documentation
- Link to other setup guides
- Link to architecture documentation
```

### Current Issues in Setup Guides:
1. **neo4j-setup-guide.md** - Good structure with Table of Contents ✅
2. **postgres-setup-guide.md** - Missing Table of Contents, no difficulty level, incomplete
3. **QUICK_START.md** - Incomplete, needs difficulty/time estimates
4. **mobile-app-setup.md** - Needs review for consistency

---

## Template: Strategy & Planning Documents

**Files affected:** `TESTING-STRATEGY.md`, and similar planning docs

### Recommended Structure

```markdown
# [Strategy Name]

**Status:** ✅ Active | 🚀 Proposed | ⚠️ Under Review  
**Effective Date:** January 2026  
**Owner:** Team or Person  

---

## Executive Summary
1-2 paragraph overview of the strategy and its importance.

---

## Goals & Objectives

### Primary Goals
- Goal 1
- Goal 2
- Goal 3

### Success Metrics
How we measure if this strategy is working.

---

## Principles
Core beliefs and values guiding this strategy.

---

## [Main Topic Sections]

### Section 1
Content and details.

### Section 2
Content and details.

---

## Implementation Timeline
Phases and milestones (if applicable).

---

## Responsible Parties
Who owns this strategy and its execution.

---

## Related Documentation
Links to related strategies and implementation guides.

---

## Review & Updates
When this strategy will be reviewed and updated.
```

### Current State:
- **TESTING-STRATEGY.md** has good structure but lacks clear status and objectives section

---

## Cross-Document Recommendations

### 1. **Metadata Section (All Documents)**
Every document should start with:
```markdown
# Document Title

**Status:** ✅ Complete | 🚀 In Progress | ⚠️ Proposed  
**Last Updated:** [Date]  
**Author/Owner:** [Name]  

---
```

**Benefit:** Makes document freshness and authorship clear at a glance.

### 2. **Table of Contents (Docs longer than 500 words)**
Add markdown TOC for easy navigation:
```markdown
## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
- [Subsection 2.1](#subsection-21)
```

**Current state:**
- ✅ neo4j-setup-guide.md has this
- ❌ Most others don't

### 3. **Quick Start / TL;DR Section**
For any document over 1000 words, add a quick-reference at the top:
```markdown
## TL;DR (Too Long; Didn't Read)
- Bullet point 1
- Bullet point 2
- Point to where full details are
```

**Benefit:** Helps busy developers get immediate value.

### 4. **Related Documentation Footer**
All documents should end with:
```markdown
---

## Related Documentation
- [Document Title](path/to/document.md)
- [Other Related Guide](path/to/guide.md)
```

**Current state:** Not consistently used

### 5. **Emoji Usage Standardization**

Inconsistent emoji usage:
- ✅ Complete / Done
- 🚀 In Progress / Active
- ⚠️ Proposed / Caution
- ❌ Failed / Not Recommended
- 💡 Tip / Note
- 🔒 Security-related
- 📋 Documentation / Reference

**Current issues:**
- COACH-INJURY-REPORTING.md uses ⚡📋🟢🟠🔴 (needs clarity)
- REPORT-BUILDER.md uses 🎯📊🔍⚡ (needs standardization)
- Other docs avoid emoji entirely

**Recommendation:** Use emoji consistently for metadata/status, avoid in feature descriptions unless essential.

### 6. **Code Block Language Labels**
Always specify language in code blocks:

```markdown
✅ Correct:
\`\`\`typescript
const user = await getUserById(id);
\`\`\`

❌ Avoid:
\`\`\`
const user = await getUserById(id);
\`\`\`
```

---

## Documentation Categories & Updates Needed

### Priority 1 (High-Impact Changes)

| Document | Category | Issue | Fix |
|---|---|---|---|
| `COACH-INJURY-REPORTING.md` | Feature Impl | Inconsistent structure, missing metadata | Apply Feature Template, add status/date |
| `REPORT-BUILDER.md` | Feature Impl | Missing Quick Start, no author info | Apply Feature Template with TL;DR |
| `postgres-setup-guide.md` | Setup Guide | Incomplete, no TOC, missing difficulty level | Apply Setup Template |
| `TESTING-STRATEGY.md` | Strategy | Missing status/date headers | Add metadata section |

### Priority 2 (Medium-Impact Changes)

| Document | Category | Issue | Fix |
|---|---|---|---|
| `neo4j-setup-guide.md` | Setup Guide | Good structure, could use difficulty level | Minor enhancements |
| `QUICK_START.md` | Setup Guide | Could be more consistent with other guides | Apply Setup Template |
| `authentication-implementation.md` | Feature Impl | Excellent structure ✅ | Minor: add status/date header |

### Priority 3 (Low-Impact Changes)

| Document | Category | Issue | Fix |
|---|---|---|---|
| All README.md files | Reference | Add cross-references to main docs | Link updates |
| All ADRs | Decision Record | Generally good structure | Verify status field consistency |

---

## Implementation Steps

1. **Document the templates** → Create DOCUMENTATION-STYLE-GUIDE.md (this file)
2. **Priority 1 documents** → Restructure 4 documents to match templates
3. **Add metadata** → Add status/date/author to all documents
4. **Cross-reference** → Update README.md files with better navigation
5. **Naming consistency** → Standardize file naming conventions
6. **Review & iterate** → Establish periodic documentation review schedule

---

## Maintenance & Future Guidelines

- **New documents** must follow the appropriate template from this guide
- **Document owner** is responsible for keeping status/date current
- **Review cycle** documents quarterly for accuracy and completeness
- **Link validation** check that cross-references still work every sprint

---

## Questions & Clarifications

For questions about these guidelines:
- Check the template that matches your document type
- Follow the structure and naming conventions
- When in doubt, refer to the "Most Consistent Example" in each category

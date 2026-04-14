## Plan: Unify Project Documentation

Build a single documentation base inside this repository, with a new canonical structure created non-destructively alongside the current scattered docs. The goal is to remove contradictions, make the docs easier to navigate, and establish one source of truth per topic before retiring the legacy pages.

**Steps**
1. Audit and classify the current documentation, then assign a canonical owner to each topic. This includes root guidance, setup, architecture, testing, feature docs, and database docs. Flag stale or unverifiable statements for correction, especially the claim that documentation lives in a separate repo, the JWT expiry mismatch, the Neo4j schema workflow ambiguity, and duplicated quick-start paths.
2. Define the target information architecture and navigation model. Recommended structure: a docs landing page plus focused hubs for getting started, architecture, features, reference, testing, and decisions. Each hub should point to one canonical page per topic, with legacy pages clearly marked as deprecated during the migration.
3. Create the new canonical docs tree inside a dedicated staging folder without deleting the old files yet. Use the imported `FYP-Documentation-Repo-main/` folder as the temporary source/staging area for external docs and assets, alongside the existing in-repo documentation. Reuse the strongest existing content from `README.md`, `docs/README.md`, `backend/README.md`, `docs/authentication-implementation.md`, `docs/COACH-INJURY-REPORTING.md`, `docs/REPORT-BUILDER.md`, `docs/setup/*`, `docs/tests/*`, `database/neo4j/README.md`, `DEMO-CHEAT-SHEET.md`, and `QUICK-REFERENCE.md` by splitting and consolidating them into the new staging structure.
4. Normalize content so each topic has a single source of truth. Resolve conflicting setup instructions, environment variable formats, demo credentials, database workflow guidance, and API/documentation claims. Replace unsupported assertions with references to code, scripts, or tests where possible.
5. Update the entry points and cross-links. Make the root `README.md` point to the new docs landing page, make `docs/README.md` the index for the canonical docs tree, and ensure top-level scripts and module READMEs link users to the correct new pages instead of competing guides.
6. Mark the old docs as legacy, not primary. Keep them in place for now, but add clear deprecation notes and redirect links so users are not forced to guess which guide is current. Remove or rewrite the most misleading statements first, then retire or archive the duplicates after the new structure is validated.
7. Verify the new doc structure by searching for broken or conflicting references and reviewing the rewritten journey flow end to end. Confirm that the main user paths are covered: new contributor setup, demo startup, backend setup, database setup, feature reference, testing, and deployment.

**Relevant files**
- `README.md` — root landing page and current contradiction about the docs repo.
- `docs/README.md` — canonical docs index to redesign.
- `backend/README.md` — backend setup, environment variables, and API reference material to consolidate.
- `docs/authentication-implementation.md` — detailed feature doc with at least one documented mismatch to correct.
- `docs/COACH-INJURY-REPORTING.md` — feature deep-dive to reuse under the new feature structure.
- `docs/REPORT-BUILDER.md` — feature deep-dive to reuse under the new feature structure.
- `docs/setup/*` — setup guides to split into a clearer getting-started flow.
- `docs/tests/*` — test database guidance to normalize and centralize.
- `database/neo4j/README.md` — schema workflow and migration guidance to clarify.
- `DEMO-CHEAT-SHEET.md` and `QUICK-REFERENCE.md` — demo and reference material to consolidate.
- `start-demo.ps1` and `dev_start.ps1` — startup scripts that should match the docs and stop competing with each other.

**Verification**
1. Search the repo for the removed or rewritten claims, especially the external-docs-repo statement, the JWT expiry text, and the old Neo4j setup instructions, and confirm they either no longer appear or clearly point to the canonical replacement.
2. Review the new docs landing page and navigation flow from the perspective of three users: a new contributor, someone running a demo, and someone looking for architecture or feature details.
3. Confirm every canonical doc has exactly one obvious home and that legacy pages are clearly labeled as deprecated rather than silently competing with the new pages.
4. Check that cross-links from the root README, backend docs, setup docs, and reference docs land on the intended canonical page and not on duplicate guidance.

**Decisions**
- The external documentation repo is being retired; documentation should live in this workspace.
- The migration should be non-destructive at first: build the new structure alongside the old docs, then retire the legacy pages after validation.
- The first pass should prioritize setup/onboarding, architecture, feature docs, and reference material; lesser-used content can be reorganized after the main paths are stable.

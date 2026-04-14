## Plan: Sequence For Foundations + Features

The fastest, lowest-risk path is to (1) get the Admin Dashboard into CI/CD first (so admin work can ship reliably), (2) fix the high-impact mobile navigation bug early (quick win, prevents accidental duplicate injuries), then (3) expand injury editing for players (small, well-contained), before (4) shipping admin user-management flows (cross-cutting DB + API + UI), and finally (5) tackle training-session persistence (largest scope + hardest data-sync problem).

**Steps**

1. Foundations — Admin Dashboard in CI/CD (blocks clean delivery of admin features)
   1. Add a production Docker build for the admin dashboard (multi-stage Next.js build).
   2. Add the dashboard as a service in docker-compose for prod-like parity (and optionally dev parity).
   3. Update GitHub Actions workflow to lint/build the dashboard on PRs.
   4. Extend image build+push to include a dashboard image (alongside backend).
   5. Extend deploy job to run both backend + dashboard on the EC2 host; decide whether to expose it via a separate port or reverse proxy.
   6. Add a basic health check endpoint/check for the dashboard container.

2. Feature (bug fix) — Prevent back-navigation into injury wizard after success (high user-impact, localized)
   1. Replace delayed navigation with a stack reset so the wizard route is removed from history.
   2. Ensure wizard form state is cleared after a successful submission (and/or on screen focus).
   3. Apply same pattern to both standard and “quick report” flows if both exist.

3. Feature — Player can update/edit an existing injury (depends on step 2 only for UX quality)
   1. Define edit policy for players (field-level permissions): core fields + notes/status updates, but preserve audit trail.
   2. Backend: introduce a player-scoped update path (either a dedicated endpoint or role-aware validation) that enforces ownership (player can only edit their own injuries).
   3. Backend: ensure edits create/append audit information (e.g., status updates remain append-only; field edits recorded as an update event).
   4. Mobile: add the “Edit Injury” interaction for players (screen entry points from injury detail/history), and ensure successful edit returns to a non-wizard screen.

4. Feature — Admins can invite/create/update/edit all user types (best after dashboard is deployable)
   1. Backend: consolidate/admin-guard endpoints that cover CRUD for admin/coaches/parents/players and invitation issuance/resend/revoke.
   2. Backend: ensure PostgreSQL identity + user_accounts consistency; handle Neo4j sync for player entities where required.
   3. Admin dashboard: implement UI for listing each user type, creating/inviting, editing, and disabling/revoking.
   4. Add e2e tests for at least one path per user type (invite + accept + admin edit).

5. Feature — Persist player training session history in the database (largest scope; do last unless it’s the immediate product priority)
   1. Confirm canonical server model (Neo4j vs Postgres) and API shape for: schedule items, completed-session reports, edits.
   2. Backend: expand sessions APIs to support querying by player and date ranges; ensure relationships from Player to Session/Report.
   3. Mobile: replace “local-only” reads with “read-through cache” (server first when online, fallback to local).
   4. Hybrid sync: define reconciliation rules (recommended minimal: server accepts idempotent upserts by client-generated IDs; last-write-wins by updatedAt; conflict surfaced only if needed).
   5. Data migration: on first launch after upgrade, upload existing local history to server once, then mark as synced.

**Parallelism**

- Step 1 (CI/CD) can run in parallel with steps 2–3 (mobile injury work), because they touch different surfaces.
- Step 4 (admin user management) should wait on Step 1 to avoid building UI that can’t be deployed.
- Step 5 (training persistence) can start discovery/design work earlier, but full implementation is best after stabilizing releases with steps 1–4.

**Relevant files**

- .github/workflows/ci.yml — add web/admin-dashboard build job + image push + deploy changes
- docker-compose.yml — add admin dashboard service for prod parity
- scripts/start-web.ps1 — reference for how dashboard is currently started
- web/admin-dashboard/package.json — build/lint/start scripts
- mobile/src/screens/injuries/ReportInjuryScreen.tsx — wizard success navigation + form reset
- mobile/src/screens/injuries/QuickReportInjuryScreen.tsx — similar pattern, ensure consistent behavior
- backend/src/injuries/ — player-safe update path + audit trail
- backend/src/auth/ and backend/src/\*/ — admin user-management endpoints span auth/coaches/parents/players
- backend/src/sessions/ and mobile/src/screens/training/ — training persistence + sync
- mobile/src/utils/trainingStorage.ts — current local persistence to migrate/sync

**Verification**

1. CI: confirm dashboard job runs on PR and fails on lint/build errors.
2. Deploy: on EC2, confirm both containers start and dashboard is reachable (direct port or via proxy) and can call backend.
3. Mobile: reproduce bug (submit injury → attempt back) and confirm it’s impossible to re-enter the wizard post-success.
4. API: add/confirm tests for player injury edit authorization and audit behavior.
5. Admin: add/confirm e2e flows for inviting and editing at least one user type end-to-end.
6. Training: verify local history migrates once, server list matches, and offline fallback still shows history.

**Decisions**

- Deployment target for dashboard: same EC2 host as backend (docker-compose).
- Player injury edits: allow both core field edits and adding notes/status updates, but enforce ownership and maintain audit.
- Training persistence: hybrid approach; recommend idempotent upserts + last-write-wins as minimal viable reconciliation.

**Further Considerations**

1. Dashboard exposure: choose separate port (simpler) vs reverse proxy under one domain (cleaner UX); recommend reverse proxy only if you already have TLS termination and routing in place.
2. Player injury edit constraints: consider limiting edits after a coach has assessed/locked an injury, to avoid conflicting clinical records.
3. Training sync conflicts: if you need strong consistency, add server-side versioning; otherwise keep it minimal with timestamps and idempotency keys.

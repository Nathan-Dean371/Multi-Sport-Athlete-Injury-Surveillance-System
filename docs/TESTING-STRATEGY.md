# Testing Strategy

**Status:** ✅ Active  
**Last Updated:** April 13, 2026  
**Owner:** Development Team  

---

## Executive Summary

This document describes the testing philosophy for the Multi-Sport Athlete Injury Surveillance System. We follow a layered testing approach: fast unit tests with mocks, lightweight database smoke tests, comprehensive E2E tests with real infrastructure, and web/mobile validation checks. The guiding principle is that tests must be disposable, isolated, and accurate reflections of production deployments.

---

## Goals & Objectives

### Primary Goals

- Keep unit tests fast and isolated.
- Use real database services when the code under test depends on database behavior.
- Run schema migrations before integration or end-to-end tests so test runs match real deployments.
- Keep test data disposable and isolated from development data.
- Make the CI pipeline a faithful version of the local validation flow.

### Success Metrics

- Unit tests run in <30 seconds
- E2E tests complete within 5 minutes
- 100% test cleanup (no leftover test data)
- CI pipeline matches local test behavior
- Zero test flakiness (reliable results)

---

## Principles

- **Isolation**: Tests don't interfere with each other or development data
- **Repeatability**: Same test always produces same result
- **Speed**: Fast feedback loops for developers
- **Accuracy**: Tests validate real-world scenarios, not mocked fantasies
- **Clarity**: Test names describe what they verify

---

## Test Layers

- Keep unit tests fast and isolated.
- Use real database services when the code under test depends on database behavior.
- Run schema migrations before integration or end-to-end tests so test runs match real deployments.
- Keep test data disposable and isolated from development data.
- Make the CI pipeline a faithful version of the local validation flow.

## Test Layers

### 1. Unit Tests

Backend unit tests live alongside source files in `backend/src/**/*.spec.ts` and use `backend/jest.config.js`.

Characteristics:

- run with `npm run test` inside `backend/`
- keep a short timeout for fast failure detection
- mock external dependencies instead of talking to live databases
- focus on service logic, validation, and branching behavior

### 2. Database Smoke Tests

The root `tests/` folder contains lightweight database connectivity tests. They are useful for quick sanity checks of PostgreSQL and Neo4j connectivity, but they are not the main release gate.

Run them with:

```powershell
npm run test:databases
```

### 3. Integration And E2E Tests

Backend E2E tests live in `backend/e2e-tests/` and use `backend/e2e-tests/jest-e2e.json`.

Characteristics:

- run with `npm run test:e2e` inside `backend/`
- use real PostgreSQL and Neo4j services
- rely on the `backend/e2e-tests/setup.ts` bootstrap file
- allow longer timeouts because they exercise real infrastructure
- validate auth, CRUD flows, and cross-service behavior

### 4. Web Checks

The admin dashboard currently uses linting and build validation instead of a dedicated test suite.

- `npm run lint`
- `npm run build`

This is enough to verify the current Next.js surface, but it remains a gap if the UI grows more complex.

### 5. Mobile Checks

The mobile app currently relies on manual verification through Expo and real-device or emulator testing.

## Test Data Management

The E2E helpers define the current test data lifecycle:

- `backend/e2e-tests/helpers/seed-data.ts` creates disposable PostgreSQL and Neo4j records for admin, coach, player, and team scenarios.
- `backend/e2e-tests/helpers/cleanup.ts` removes test data between runs by truncating PostgreSQL tables and detaching all Neo4j nodes in the test database.
- `backend/e2e-tests/setup.ts` loads `.env.test` and sets a longer Jest timeout for the suite.

The guiding rule is simple: if a test mutates data, it must be able to clean up after itself or operate against a database that is reset before each run.

## CI Flow

The GitHub Actions pipeline follows this order for backend validation:

1. start isolated PostgreSQL and Neo4j services
2. run Flyway `validate`
3. run Flyway `migrate`
4. apply Neo4j migrations
5. run backend linting
6. run backend unit tests
7. run backend E2E tests
8. upload coverage

The web dashboard has a lighter CI check today:

1. install dependencies
2. run lint
3. run build

## Required Environment Values

The backend test suites expect these values, either from the shell or from `.env.test`:

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `NEO4J_URI`
- `NEO4J_USERNAME`
- `NEO4J_PASSWORD`
- `JWT_SECRET`

CI uses the same set of values, but with disposable test credentials and isolated services.

## Known Gaps

- No dedicated automated test suite exists yet for the Next.js dashboard.
- No automated test suite exists yet for the mobile app.
- The root-level database smoke tests are helpful, but they are still narrower than the backend E2E suite.

## Review & Updates

This strategy is reviewed **quarterly** or when major architectural changes are planned. Last review: April 13, 2026.

---

## Related Documentation

- [Schema management workflow](architecture/schema-management-workflow.md)
- [Database test guide](tests/database-tests.md)
- [Testing database setup](tests/TEST-DATABASE-SETUP.md)
- [Coach Injury Reporting](COACH-INJURY-REPORTING.md) (feature example with testing)
- [Authentication Implementation](authentication-implementation.md) (tested module)
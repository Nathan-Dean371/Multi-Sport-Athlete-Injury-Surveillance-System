# ADR-0008: Comprehensive Testing Strategy Before Cloud Deployment

**Status:** In Progress

**Date:** February 15, 2026

**Deciders:** Nathan Dean

---

## Context

The Multi-Sport Athlete Injury Surveillance System has reached a functional state with:

- ✅ NestJS backend with 7 core MVP endpoints implemented
- ✅ PostgreSQL identity database with user accounts
- ✅ Neo4j graph database for medical data
- ✅ React Native mobile app with full coaching workflow
- ✅ Local development environment with Docker Compose

The next logical step is cloud deployment to Azure or Railway for:

- Remote access for testing
- Mobile app integration with live backend
- Demonstration for FYP presentation
- Portfolio/thesis showcase

**Key Question:** Should we deploy immediately or implement a comprehensive test suite first?

---

## Decision

**Implement comprehensive testing before cloud deployment.**

We will create a full test suite following the testing pyramid strategy:

1. **Unit Tests** - Test business logic in isolation (70% coverage target)
2. **Integration Tests** - Test with real databases (20% coverage)
3. **E2E Tests** - Test full request/response cycles (10% coverage)

Only after achieving satisfactory test coverage will we proceed with containerization and cloud deployment.

---

## Rationale

### Academic Benefits (FYP Context)

- **Thesis Content:** Dedicated testing chapter demonstrates mature software engineering
- **Process Over Product:** Shows understanding of SDLC beyond feature implementation
- **Professional Standards:** Industry-standard TDD/BDD practices valuable for career
- **Examiner Discussion:** Provides talking points about quality assurance strategies
- **Documentation:** Tests serve as living documentation of system behavior

### Technical Benefits

- **Bug Discovery:** Find and fix issues in free local environment vs paid cloud resources
- **Deployment Confidence:** Know what works before containerizing
- **Regression Prevention:** Future changes won't break existing functionality
- **Refactoring Safety:** Can improve code with confidence
- **CI/CD Foundation:** Tests enable automated deployment pipelines

### Risk Mitigation

- **Cost Efficiency:** Debugging in cloud costs money and time
- **Azure Credits Preservation:** Student credits are finite, don't waste on debugging
- **Railway Limits:** Free tier has resource constraints, avoid failed deployments
- **Database State:** Testing prevents data corruption in production
- **Authentication Security:** Verify JWT and role-based access before exposing publicly

**Conclusion:** Time is available, so prioritize quality over speed.

---

## Implementation Strategy

### Phase 1: Unit Tests ✅ COMPLETE (81 tests)

**Duration:** ~4 hours (February 15, 2026)

Test modules in order of criticality:

1. **Auth Service** ✅ COMPLETE (16 tests)
   - Login flow (password validation, account states)
   - Registration (all identity types, transactions)
   - User validation (JWT payload verification)
2. **Injuries Service** ✅ COMPLETE (17 tests)
   - Create injury (role-based access)
   - Update injury (status changes)
   - Get injury details with player info
   - Query injuries by role (player/coach/admin)
   - Resolve injury workflow
   - Filter by status, severity, date range
3. **Teams Service** ✅ COMPLETE (19 tests)
   - Get team roster with player statuses
   - Get team details with coaches
   - Coach team access validation
   - Multi-team coach scenarios
   - Player identity merging from PostgreSQL
4. **Status Service** ✅ COMPLETE (15 tests)
   - Update player daily status (GREEN/ORANGE/RED)
   - Get status history
   - Team status aggregation for coaches
   - Status count calculations
5. **Players Service** ✅ COMPLETE (14 tests)
   - Get all players with team info
   - Get player profile details
   - Get player injury history
   - Handle missing teams and injuries

**Mocking Strategy:**

- Mock database connections (PostgreSQL Pool, Neo4j Driver)
- Mock external services (JwtService)
- Test business logic only, not database/library behavior
- Fast execution (~10 seconds per test file)

### Phase 2: Integration Tests (Target: 8-12 tests)

**Duration:** 2-3 hours

Test with real dependencies:

1. **Auth E2E** (3-4 tests)
   - POST /auth/register creates user in database
   - POST /auth/login returns valid JWT
   - Protected routes reject invalid tokens
   - Role-based access control works
2. **Injuries E2E** (3-4 tests)
   - POST /injuries creates injury in Neo4j
   - GET /injuries/:id retrieves correct data
   - PATCH /injuries/:id updates status
   - Coach can report for player, player cannot report for others
3. **Guards E2E** (2-3 tests)
   - JwtAuthGuard blocks unauthenticated requests
   - RolesGuard enforces role requirements
   - Custom guards work correctly

**Testing Environment:**

- Use local Docker Compose stack
- Seed test data before each test suite
- Clean up database after tests
- Slower execution (~30-60 seconds per test file)

### Phase 3: Test Reporting & Documentation

**Duration:** 1 hour

1. Generate coverage report: `npm run test:cov`
2. Target: 70-80% code coverage (realistic for academic project)
3. Document testing strategy in README
4. Create testing guide for future contributors
5. Add test results to FYP thesis

---

## Comparison: Test-First vs Deploy-First

### Test-First Approach (CHOSEN)

**Timeline:**

- Day 1-2: Complete test suite
- Day 3: Review coverage, fix bugs discovered
- Day 4: Docker containerization
- Day 5: Azure deployment
- **Result:** Confident, stable deployment

**Pros:**

- Find bugs locally (free)
- Understand system behavior before deployment
- CI/CD ready from day one
- Better thesis content
- Professional portfolio piece

**Cons:**

- Delayed initial deployment (by 2-3 days)
- Requires discipline to write tests

### Deploy-First Approach (REJECTED)

**Timeline:**

- Day 1: Rush deployment to Railway/Azure
- Day 2-5: Debug production issues
- Week 2: Realize need for tests anyway
- **Result:** Stressful firefighting

**Pros:**

- Faster initial deployment
- See it live quickly

**Cons:**

- Debugging in cloud costs time and money
- No safety net for future changes
- Weak testing section in thesis
- Lower code quality
- Potential security issues discovered too late

---

## Success Criteria

### Minimum Viable Testing (Before Deployment)

- ✅ Auth service unit tests passing (16/16)
- ✅ Injuries service unit tests passing (17/17)
- ✅ Teams service unit tests passing (19/19)
- ✅ Status service unit tests passing (15/15)
- ✅ Players service unit tests passing (14/14)
- ✅ **Total: 81 unit tests passing**
- ⏳ At least 2 E2E test suites passing
- ⏳ 70% code coverage achieved
- ⏳ All tests run in <2 minutes total

### Ideal Testing (Before FYP Submission)

- All service unit tests (40-50 tests)
- All E2E integration tests (8-12 tests)
- 80%+ code coverage
- CI/CD pipeline with automated testing
- Test results documented in thesis

---

## Testing Best Practices Applied

### Unit Testing

- **Isolation:** Mock external dependencies
- **Fast:** Each test file runs in ~10 seconds
- **Focused:** Test one function/method at a time
- **Readable:** Clear arrange/act/assert structure
- **Comprehensive:** Happy path + edge cases + error conditions

### Integration Testing

- **Real Dependencies:** Use actual databases
- **Cleanup:** Reset state between tests
- **E2E Flows:** Test full user journeys
- **Environment:** Separate test database from development

### Organization

- **Co-location:** `*.spec.ts` files next to source files
- **Naming:** Descriptive test names explain behavior
- **Structure:** Grouped by feature/module
- **Coverage:** Track and report metrics

---

## Progress Tracking

### Completed (February 15, 2026)

- [x] Decision to implement testing first
- [x] Testing strategy defined
- [x] Auth service unit tests (16 tests passing)
- [x] Injuries service unit tests (17 tests passing)
- [x] Teams service unit tests (19 tests passing)
- [x] Status service unit tests (15 tests passing)
- [x] Players service unit tests (14 tests passing)
- [x] **Phase 1: All unit tests complete (81 tests)**
- [x] TypeScript configuration fixed for Jest
- [x] VSCode Jest extension configured
- [x] Test infrastructure validated

### In Progress

- [ ] Integration test setup
- [ ] Coverage report generation

### Not Started

- [ ] E2E test implementation
- [ ] Coverage report generation
- [ ] CI/CD pipeline with tests
- [ ] Test documentation in thesis

---

## Related Decisions

- **[ADR-0004: NestJS Backend Framework](./adr-0004-nestjs-backend-framework.md)** - Testing capabilities influenced framework choice
- **[ADR-0004.1: MVP Endpoints Implementation](./adr-0004.1-mvp-endpoints-implementation.md)** - Defines endpoints to test
- **[ADR-0006: JWT Authentication](./adr-0006-jwt-authentication.md)** - Security requires thorough testing

---

## Future Enhancements

After successful deployment with tests:

1. **Performance Testing** - Load testing with artillery or k6
2. **Security Testing** - Penetration testing, OWASP compliance
3. **Mutation Testing** - Verify test quality with mutations
4. **Visual Regression Testing** - Screenshot comparison for mobile app
5. **Contract Testing** - API contract validation

---

## Lessons Learned (To Be Updated)

_This section will be updated after test suite completion and deployment._

### What Worked Well

- TBD

### What Could Be Improved

- TBD

### Unexpected Challenges

- TBD

---

**Last Updated:** February 15, 2026  
**Next Review:** After Phase 1 completion  
**Status:** Active Development

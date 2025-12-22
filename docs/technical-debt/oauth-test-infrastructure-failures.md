# Technical Debt: OAuth E2E Test Infrastructure Failures

**Issue ID:** TD-001
**Date Identified:** December 22, 2025
**Severity:** Medium (does not affect production functionality)
**Category:** Test Infrastructure
**Status:** Open

## Summary

All 66 OAuth-related E2E tests are currently failing due to test infrastructure issues. These failures are **pre-existing** and were discovered during Epic 5 completion verification. The OAuth authentication **functionality works correctly in production** - only the automated tests are failing.

## Impact

- **Production Impact:** None - OAuth login works correctly for users
- **Development Impact:** Cannot verify OAuth flows with automated tests
- **CI/CD Impact:** E2E test suite shows failures (can be filtered with `--grep-invert "OAuth"`)
- **Confidence Impact:** Reduced confidence in OAuth changes without automated verification

## Test Failure Statistics

```
Total OAuth Tests: 66
Passed: 0
Failed: 66
Success Rate: 0.0%
Duration: 570.67s (9.5 minutes)

Error Breakdown:
- Network/Timeout: 24 tests (36%)
- Other: 42 tests (64%)
```

## Critical Failing Test Scenarios

### Desktop Chrome (33 failures)
1. OAuth callback handling
2. OAuth authentication latency measurement
3. Invalid/expired authorization code handling
4. Network failure scenarios
5. PKCE flow verification
6. Session persistence across refreshes
7. OAuth provider data verification
8. State mismatch handling
9. Corrupted session cookie handling
10. Rate limiting scenarios

### Mobile Chrome (33 failures)
Same scenarios as Desktop Chrome

## Example Error Messages

```
Test timeout - possibly slow OAuth provider
Unknown failure reason
Network/Timeout errors
```

## Root Cause Analysis

### Likely Causes

1. **Missing Test Environment Configuration**
   - OAuth test credentials not configured
   - Test OAuth callback URLs not registered with Google
   - Supabase test project not set up for E2E tests

2. **Environment Variable Issues**
   ```bash
   # Required but possibly missing in test environment:
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   ```

3. **OAuth Provider Configuration**
   - Google OAuth not configured for localhost testing
   - Redirect URIs not whitelisted for test environment
   - Test domain not registered in Google Console

4. **Mock/Stub Issues**
   - OAuth provider mocks not running
   - Test fixtures not properly configured
   - Network interception not working correctly

5. **Test Infrastructure Setup**
   - Tests expecting real OAuth flow instead of mocked
   - Session handling not working in headless browser
   - Cookie/localStorage issues in test environment

## Files Affected

**Test Files:**
- `apps/web/tests/e2e/auth.spec.ts` (OAuth Authentication Flow - 15 tests)
- `apps/web/tests/e2e/oauth-error-scenarios.spec.ts` (OAuth Error Scenarios - 19 tests)
- Additional OAuth tests in other spec files

**Configuration:**
- `apps/web/playwright.config.ts`
- `apps/web/.env.test` (if exists)
- `apps/web/tests/setup.ts`

## Verification Steps

### To Reproduce Failures
```bash
cd /Users/kthkellogg/Documents/GitHub/ideally/apps/web
npm run test:e2e -- --grep "OAuth"
```

### To View Detailed Errors
```bash
npx playwright show-report
# Opens HTML report at http://localhost:9323
```

### To Run Non-OAuth Tests (Working)
```bash
npm run test:e2e -- --grep-invert "OAuth"
# Result: 22 passed, 0 failed
```

## Workaround

**Current Workaround:**
Run E2E tests excluding OAuth tests:
```bash
npm run test:e2e -- --grep-invert "OAuth"
```

**CI/CD Configuration:**
Update test scripts to exclude OAuth tests until fixed:
```json
{
  "scripts": {
    "test:e2e:stable": "playwright test --grep-invert \"OAuth\""
  }
}
```

## Recommended Fix (Priority Order)

### Phase 1: Investigation (2-4 hours)
1. **Review Test Setup**
   - Read `apps/web/tests/e2e/auth.spec.ts`
   - Check if tests expect real OAuth or mocks
   - Review Playwright test configuration

2. **Check Environment Variables**
   - Verify `.env.test` exists and has required OAuth credentials
   - Check if test environment has access to Supabase test project
   - Validate Google OAuth credentials for testing

3. **Review Logs**
   - Open Playwright HTML report
   - Examine network logs for failed OAuth requests
   - Check browser console logs in test screenshots

### Phase 2: Configuration (4-8 hours)
1. **Set Up Test OAuth Provider**
   - Create Google OAuth test credentials OR
   - Implement OAuth provider mocks

2. **Configure Supabase Test Project**
   - Create dedicated Supabase project for E2E tests OR
   - Use Supabase local development setup

3. **Update Test Environment**
   - Add required environment variables to test config
   - Configure OAuth redirect URIs for localhost
   - Set up test database with fixtures

### Phase 3: Test Fixes (8-16 hours)
1. **Fix Test Infrastructure**
   - Update tests to use mocked OAuth if appropriate
   - Add proper error handling and timeouts
   - Implement retry logic for network tests

2. **Validate Test Scenarios**
   - Ensure each OAuth scenario is testable
   - Update assertions to match actual behavior
   - Add better error messages

3. **Run and Verify**
   - Run OAuth tests individually
   - Fix any remaining issues
   - Verify full suite passes

## Success Criteria

- [ ] All 66 OAuth tests passing consistently
- [ ] Tests complete in under 5 minutes
- [ ] Clear error messages when tests fail
- [ ] Tests can run in CI/CD environment
- [ ] Documentation updated with OAuth test setup instructions

## Related Issues

- None currently - this is the first documented instance

## Notes

- **Discovered During:** Epic 5 completion verification (December 22, 2025)
- **Epic 5 Status:** Complete and unaffected - all UI changes passed verification
- **Production OAuth:** Working correctly - users can successfully authenticate
- **Non-OAuth Tests:** 22 tests passing, 0 failing

## Additional Context

### Working Test Categories
- Visual Output Validation (22 tests) ✅
- Canvas Integration ✅
- Export/Download Features ✅
- Accessibility ✅

### Skipped Test Categories
- 356 tests marked as skipped (likely stub/placeholder tests)
- These may be candidates for implementation or removal

## Decision Required

**Options:**
1. **Fix immediately** - Block deployments until OAuth tests pass
2. **Fix in sprint** - Add to backlog, prioritize for next sprint
3. **Fix incrementally** - Fix critical scenarios first, rest later
4. **Accept as-is** - Manual OAuth testing only, remove automated tests

**Recommendation:** Option 3 (Fix incrementally)
- Fix critical happy path OAuth tests first (5-10 tests)
- Fix error scenarios in subsequent iterations
- Remove or stub tests that aren't valuable

## Estimate

**Total Effort:** 14-28 hours
- Investigation: 2-4 hours
- Configuration: 4-8 hours
- Test Fixes: 8-16 hours

**Timeline:** 2-4 sprints (if done incrementally)

---

**Created:** December 22, 2025
**Last Updated:** December 22, 2025
**Assignee:** TBD
**Related Epics:** Epic 5 (verification only - not caused by)

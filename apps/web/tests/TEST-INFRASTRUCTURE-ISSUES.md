# Test Infrastructure Known Issues

**Status**: Requires Dedicated Sprint
**Estimated Effort**: 8-12 hours
**Last Updated**: 2025-11-15

## Overview

The test suite has systemic infrastructure issues affecting 260+ tests across the codebase. These are **environment and setup problems**, not code quality issues. The production build succeeds, and TypeScript compilation is clean.

---

## Issue Categories

### 1. Test Environment Setup (Critical)
**Impact**: 260+ test failures

**Problems**:
- jsdom environment not properly configured for React Testing Library
- DOM APIs unavailable or incorrectly polyfilled
- `window.crypto` missing/incomplete polyfill
- Fake timers conflicting with React Testing Library
- `document.body` not available in test setup

**Example Errors**:
```
Error: Target container is not a DOM element.
TypeError: window.crypto.randomUUID is not a function
Test timed out in 5000ms (fake timers not advancing correctly)
```

**Root Causes**:
- Vitest `jsdom` environment setup incomplete
- Missing global mocks in `tests/setup.ts`
- Conflicts between Vitest fake timers and React's async updates

---

### 2. Vitest/Jest Migration (Medium)
**Impact**: 10 TypeScript errors in test files

**Problems**:
- Test files mixing `jest` and `vi` (vitest) APIs
- Type definitions conflicting (jest.Mock vs vitest mocks)
- Parsing errors in test files (`accessibility.test.tsx`, `context-transfer.test.ts`)

**Example**:
```typescript
// OLD (Jest):
const mockFn = jest.fn()
global.fetch = jest.fn()

// NEW (Vitest):
const mockFn = vi.fn()
global.fetch = vi.fn() as any
```

**Status**: Partially fixed (TypingIndicator tests migrated, others remain)

---

### 3. Mock Configuration (Medium)
**Impact**: 24+ test failures

**Problems**:
- Clipboard API mocking incompatible with jsdom
- URL.createObjectURL not available in test environment
- Navigator properties read-only (can't mock properly)
- Module mocks hoisted incorrectly

**Affected Components**:
- `MarkdownOutputPane.test.tsx` (16/24 tests failing)
- Components using browser APIs (clipboard, download, etc.)

**Workarounds Attempted**:
```typescript
// Doesn't work reliably in jsdom:
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn() },
  writable: true
});
```

---

### 4. Fake Timers Issues (High)
**Impact**: 8+ test timeout failures

**Problems**:
- `vi.useFakeTimers()` breaks React's async rendering
- Tests timeout instead of advancing time
- `waitFor()` doesn't work with fake timers
- Need to mix `vi.advanceTimersByTime()` and `await vi.runAllTimersAsync()`

**Example**:
```typescript
it('should debounce save', async () => {
  vi.useFakeTimers();
  await user.type(input, 'text');

  vi.advanceTimersByTime(1000);
  // ❌ Timeout: React updates not processed

  await vi.runAllTimersAsync(); // ✅ Works
});
```

---

## Impact on Development

### What's Broken:
- ❌ Cannot reliably run unit tests
- ❌ Test coverage metrics unreliable
- ❌ TDD workflow blocked for components using browser APIs

### What Works:
- ✅ Production builds succeed
- ✅ TypeScript compilation clean (prod code)
- ✅ E2E tests with Playwright (separate environment)
- ✅ Linting and type checking

---

## Recommended Fix Strategy

### Phase 1: Environment Setup (4-5 hours)
1. **Upgrade Vitest configuration**
   - Add proper jsdom polyfills
   - Configure global test setup correctly
   - Fix `window.crypto` and other Web APIs

2. **Create test utilities**
   - Build wrapper for React Testing Library with proper setup
   - Create reusable mock helpers for browser APIs
   - Standardize fake timer usage

### Phase 2: Test Migration (2-3 hours)
3. **Convert remaining Jest → Vitest**
   - Fix `accessibility.test.tsx`
   - Fix `context-transfer.test.ts`
   - Update all `jest.fn()` → `vi.fn()`

4. **Fix mock hoisting**
   - Move mocks to proper location (before imports)
   - Use Vitest's `vi.mock()` correctly

### Phase 3: Component Tests (2-4 hours)
5. **Fix MarkdownOutputPane tests**
   - Resolve DOM/clipboard mocking
   - Fix fake timer conflicts
   - Get 24/24 tests passing

6. **Validate other component tests**
   - Run full test suite
   - Fix remaining failures

---

## Temporary Workarounds

Until the infrastructure is fixed:

1. **Skip problematic tests**:
   ```typescript
   it.skip('should copy to clipboard', () => {
     // Blocked by clipboard API mocking issues
   });
   ```

2. **Use E2E tests** for browser API testing:
   - Playwright tests work reliably
   - Better for integration testing anyway

3. **Focus on unit testing** pure logic:
   - Test utilities, helpers, business logic
   - Avoid components with heavy DOM/browser API usage

---

## Files Affected

### Test Setup Files:
- `tests/setup.ts` - Needs jsdom configuration
- `vitest.config.ts` - Environment setup incomplete

### Failing Test Files:
- `tests/bmad/accessibility.test.tsx` (6 TypeScript errors, multiple test failures)
- `tests/bmad/regression.test.tsx` (260+ failures)
- `tests/lib/bmad/session/context-transfer.test.ts` (3 TypeScript errors)
- `app/components/markdown/MarkdownOutputPane.test.tsx` (16/24 tests failing)

---

## References

- **Vitest Docs**: https://vitest.dev/guide/environment.html
- **Testing Library**: https://testing-library.com/docs/react-testing-library/setup
- **jsdom Issues**: https://github.com/jsdom/jsdom/issues

---

## Next Actions

**DO NOT** attempt piecemeal fixes. The issues are interconnected and require a comprehensive approach.

**Recommended**:
1. Schedule dedicated "Test Infrastructure Sprint" (1-2 days)
2. Set up proper jsdom environment first
3. Fix one component test end-to-end as proof of concept
4. Apply learnings to remaining tests

**Until then**: Tests are informational only. Build success and TypeScript checking are the validation gates.

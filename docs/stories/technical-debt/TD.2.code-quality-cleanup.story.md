# TD.2: Code Quality Cleanup

## Status
**Ready** - Can be addressed incrementally

## Priority
Medium - Should be addressed before significant new feature work

## Story
**As a** developer maintaining the ThinkHaven codebase,
**I want** to address accumulated technical debt and code quality issues,
**so that** the codebase remains maintainable, secure, and production-ready.

## Issues Identified

### Critical (Fix Soon)

1. **Build Configuration Ignores Errors**
   - File: `apps/web/next.config.ts`
   - Issue: `ignoreDuringBuilds: true` for ESLint and `ignoreBuildErrors: true` for TypeScript
   - Risk: Type errors and lint issues go unnoticed
   - Fix: Enable error checking, address existing issues

### High Priority

2. **Excessive Console Logging in Production**
   - Files: `apps/web/app/api/chat/stream/route.ts`, `apps/web/lib/monitoring/auth-logger.ts`
   - Issue: Multiple console.log/console.error calls in production code paths
   - Risk: Performance impact, potential information exposure
   - Fix: Implement proper logging service or remove debug statements

3. **Type Safety Issues (15+ uses of `any`)**
   - Files:
     - `apps/web/lib/security/rate-limiter.ts`
     - `apps/web/lib/bmad/types/index.ts`
     - `apps/web/lib/bmad/analysis/revenue-optimization-engine.ts`
     - `apps/web/app/components/chat/ChatInterface.tsx`
   - Risk: Reduced type safety, harder debugging
   - Fix: Replace `any` with proper TypeScript interfaces

### Medium Priority

4. ~~**Disabled Files Accumulation**~~ - **RESOLVED (2025-12-16)**
   - All 9 disabled files deleted during cleanup

5. **TODO Comments in Production Code**
   - `apps/web/lib/canvas/canvas-export.ts:400` - "TODO: Implement PNG tEXt chunk writing"
   - `apps/web/app/components/assessment/StrategyQuiz.tsx:243` - "TODO: Send to Supabase"
   - `apps/web/app/workspace/[id]/page.tsx:671` - "TODO: Implement export functionality"
   - Fix: Implement or remove

6. **Duplicate Migration Numbers**
   - Files: `008_add_message_limits.sql` and `008_rollback_message_limits.sql`
   - Issue: Unclear which is the intended state
   - Fix: Clarify and rename appropriately

### Low Priority

7. **Environment Validator Exit Behavior**
   - File: `apps/web/lib/security/env-validator.ts:185`
   - Issue: Calls `process.exit(1)` which could terminate during deployment
   - Fix: Throw error instead of exiting

8. **Non-Standard Logging Format**
   - File: `apps/web/lib/security/env-validator.ts:162-173`
   - Issue: Uses emojis in log output
   - Fix: Standardize to structured logging

## Tasks / Subtasks

- [ ] Task 1: Enable Build Error Checking
  - [ ] Subtask 1.1: Set `ignoreDuringBuilds: false` for ESLint
  - [ ] Subtask 1.2: Set `ignoreBuildErrors: false` for TypeScript
  - [ ] Subtask 1.3: Fix any resulting errors

- [ ] Task 2: Reduce Console Logging
  - [ ] Subtask 2.1: Audit all console.log/console.error calls
  - [ ] Subtask 2.2: Remove or replace with proper logging
  - [ ] Subtask 2.3: Consider implementing a logging service

- [ ] Task 3: Improve Type Safety
  - [ ] Subtask 3.1: Create proper TypeScript interfaces
  - [ ] Subtask 3.2: Replace `any` types with specific types
  - [ ] Subtask 3.3: Add type tests

- [ ] Task 4: Resolve TODO Comments
  - [ ] Subtask 4.1: Evaluate each TODO for necessity
  - [ ] Subtask 4.2: Implement or create stories for important ones
  - [ ] Subtask 4.3: Remove obsolete TODOs

- [x] Task 5: Disabled Files Decision - **DONE (2025-12-16)**
  - [x] Subtask 5.1: Review each disabled file
  - [x] Subtask 5.2: Delete unused files (9 files deleted)
  - [x] Subtask 5.3: N/A - No files to re-enable

## Acceptance Criteria

1. Build passes with error checking enabled
2. No `any` types in core business logic
3. Console logging replaced with proper logging approach
4. All TODO comments resolved or documented as stories
5. ~~Disabled files either deleted or documented with rationale~~ - **DONE**

## Dev Notes

### Build Configuration Fix
```typescript
// next.config.ts - Change to:
eslint: {
  ignoreDuringBuilds: false,
},
typescript: {
  ignoreBuildErrors: false,
},
```

### Logging Approach Options
1. Use a logging library (pino, winston)
2. Create a simple wrapper that respects NODE_ENV
3. Use Vercel's built-in logging

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-16 | 1.0 | Created during project cleanup | Development Team |

## QA Results

*This section will be populated by the QA Agent upon story completion*

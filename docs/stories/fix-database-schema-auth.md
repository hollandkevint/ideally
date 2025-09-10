# Fix Database Schema Authentication Issues - Brownfield Addition

## User Story

As a **user trying to access the application after login**,
I want **database queries to succeed and workspaces to load properly**,
So that **I can access my dashboard and workspaces without infinite redirect loops**.

## Story Context

**Existing System Integration:**
- Integrates with: Supabase database and authentication system
- Technology: Next.js 15, Supabase client, PostgreSQL with RLS
- Follows pattern: Existing workspace fetching in dashboard/page.tsx
- Touch points: Workspace table queries, RLS policies, user authentication context

## Acceptance Criteria

**Functional Requirements:**
1. Database queries for workspaces return successful responses (no PGRST205 errors)
2. Authenticated users can fetch their workspaces from the database
3. Dashboard page loads successfully after login without infinite redirects

**Integration Requirements:**
4. Existing authentication flow continues to work unchanged
5. New database schema follows existing Supabase patterns
6. Integration with workspace components maintains current behavior

**Quality Requirements:**
7. Change is covered by database migration testing
8. RLS policies are documented and verified
9. No regression in existing user authentication verified

## Technical Notes

**Integration Approach:**
- Verify Supabase table schema matches application expectations in apps/web/app/dashboard/page.tsx
- Check workspaces table column names and data types
- Ensure RLS policies allow authenticated users to access their own workspaces
- Validate user_id foreign key relationships

**Existing Pattern Reference:**
- Follow workspace fetching pattern in dashboard/page.tsx:fetchWorkspaces()
- Use existing Supabase client configuration from lib/supabase/client.ts
- Maintain existing error handling patterns

**Key Constraints:**
- Must not break existing workspace functionality
- RLS policies must maintain data security
- Schema changes should be additive only

## Root Cause Analysis

**Console Errors:** PGRST205 suggests table/column mismatches
**Specific Issues:**
- "Could not find the 'dual_pane_state' column of 'workspaces'" error from demo seeding
- Database queries failing with schema mismatch errors
- User authentication succeeds but workspace queries fail

## Definition of Done

- [ ] PGRST205 errors eliminated from console
- [ ] Workspace queries return successful responses for authenticated users
- [ ] Dashboard loads without infinite redirect loops
- [ ] Demo account can access pre-loaded workspaces
- [ ] Existing workspace functionality works unchanged
- [ ] RLS policies verified for security
- [ ] Database schema documented

## Risk and Compatibility Check

**Minimal Risk Assessment:**
- **Primary Risk:** Breaking existing workspace functionality
- **Mitigation:** Test existing workflows before and after changes
- **Rollback:** Database schema changes are additive and can be easily reverted

**Compatibility Verification:**
- [x] No breaking changes to existing APIs (schema additions only)
- [x] Database changes are additive only (no column removals)
- [x] UI changes follow existing patterns (no UI changes needed)
- [x] Performance impact is negligible (query optimization)

## Validation Checklist

**Scope Validation:**
- [x] Story can be completed in one development session
- [x] Integration approach is straightforward (schema verification)
- [x] Follows existing patterns exactly (Supabase + RLS)
- [x] No design or architecture work required

**Clarity Check:**
- [x] Story requirements are unambiguous
- [x] Integration points are clearly specified
- [x] Success criteria are testable
- [x] Rollback approach is simple

---

**Priority:** CRITICAL
**Estimated Effort:** 2-4 hours
**Dependencies:** None
**Risk Level:** Low (additive changes only)
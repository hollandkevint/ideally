-- Check RLS Policies for bmad_sessions table
-- Run this in Supabase SQL Editor to verify canvas columns are accessible

-- ============================================================================
-- 1. CHECK IF RLS IS ENABLED
-- ============================================================================
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'bmad_sessions';

-- ============================================================================
-- 2. LIST ALL POLICIES ON bmad_sessions
-- ============================================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'bmad_sessions'
ORDER BY policyname;

-- ============================================================================
-- 3. CHECK COLUMN PERMISSIONS
-- ============================================================================
-- Verify that canvas columns exist and are accessible
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bmad_sessions'
AND column_name IN ('canvas_data', 'canvas_version', 'canvas_updated_at')
ORDER BY column_name;

-- ============================================================================
-- 4. TEST CANVAS COLUMN ACCESS (requires valid session)
-- ============================================================================
-- Replace 'YOUR_SESSION_ID' with actual session ID from user
-- Run this while logged in as the user to test RLS

-- SELECT
--     id,
--     canvas_data,
--     canvas_version,
--     canvas_updated_at
-- FROM bmad_sessions
-- WHERE id = 'YOUR_SESSION_ID';

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- 1. rls_enabled should be TRUE
-- 2. Should see policies like:
--    - "Users can view their own sessions"
--    - "Users can update their own sessions"
-- 3. Should see all three canvas columns with correct types
-- 4. SELECT test should return canvas data (or null if not set yet)

-- ============================================================================
-- IF RLS IS BLOCKING:
-- ============================================================================
-- You'll see:
-- - Empty result sets when querying as user
-- - "new row violates row-level security policy" errors on UPDATE
-- - Need to update policies to explicitly include canvas columns

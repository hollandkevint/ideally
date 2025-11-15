-- Migration: Rollback Message Limit Tracking (008)
-- Created: 2025-11-15
-- Description: Safely rollback migration 008 if needed
--              Removes message limit columns, functions, and index

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS check_message_limit(TEXT);
DROP FUNCTION IF EXISTS increment_message_count(TEXT);

-- ============================================================================
-- DROP INDEX
-- ============================================================================

DROP INDEX IF EXISTS idx_bmad_sessions_message_count;

-- ============================================================================
-- REMOVE COLUMNS FROM bmad_sessions
-- ============================================================================

ALTER TABLE bmad_sessions
DROP COLUMN IF EXISTS limit_reached_at,
DROP COLUMN IF EXISTS message_limit,
DROP COLUMN IF EXISTS message_count;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify columns removed
-- Run this query to confirm rollback was successful:
--
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_name = 'bmad_sessions'
-- AND column_name IN ('message_count', 'message_limit', 'limit_reached_at');
--
-- Expected: 0 rows (columns should be gone)

-- Verify functions removed
--
-- SELECT routine_name
-- FROM information_schema.routines
-- WHERE routine_name IN ('check_message_limit', 'increment_message_count');
--
-- Expected: 0 rows (functions should be gone)

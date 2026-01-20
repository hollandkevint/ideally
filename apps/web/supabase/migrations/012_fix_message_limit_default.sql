-- Migration: Fix Message Limit Default and Update Existing Sessions
-- Created: 2026-01-19
-- Description: Changes default message_limit from 20 to 10 and updates existing active sessions

-- ============================================================================
-- UPDATE EXISTING ACTIVE SESSIONS TO USE 10-MESSAGE LIMIT
-- ============================================================================

-- Only update sessions that haven't reached their limit yet
-- (sessions that already hit 20 messages should keep their limit)
UPDATE bmad_sessions
SET message_limit = 10
WHERE status = 'active'
  AND message_limit > 10
  AND limit_reached_at IS NULL;

-- ============================================================================
-- CHANGE DEFAULT FOR NEW SESSIONS
-- ============================================================================

ALTER TABLE bmad_sessions
ALTER COLUMN message_limit SET DEFAULT 10;

-- ============================================================================
-- UPDATE COLUMN COMMENT
-- ============================================================================

COMMENT ON COLUMN bmad_sessions.message_limit IS 'Maximum messages allowed per session (default: 10 for SLC launch)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify default was changed
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'bmad_sessions'
  AND column_name = 'message_limit';

-- Show count of sessions updated
SELECT
  COUNT(*) FILTER (WHERE message_limit = 10) as sessions_with_10_limit,
  COUNT(*) FILTER (WHERE message_limit = 20) as sessions_with_20_limit,
  COUNT(*) FILTER (WHERE limit_reached_at IS NOT NULL) as sessions_that_hit_limit
FROM bmad_sessions
WHERE status = 'active';

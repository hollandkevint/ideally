-- Migration: Add Message Limit Tracking for Launch Mode
-- Created: 2025-11-14
-- Description: Adds message_count column to bmad_sessions for enforcing session message limits
--              during the SLC launch period (before Stripe integration)

-- ============================================================================
-- ADD MESSAGE TRACKING COLUMNS TO bmad_sessions
-- ============================================================================

ALTER TABLE bmad_sessions
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS message_limit INTEGER DEFAULT 10 NOT NULL,
ADD COLUMN IF NOT EXISTS limit_reached_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================================
-- CREATE INDEX FOR MESSAGE LIMIT QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bmad_sessions_message_count
ON bmad_sessions(message_count, message_limit)
WHERE message_count >= message_limit;

-- ============================================================================
-- CREATE FUNCTION TO INCREMENT MESSAGE COUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_message_count(p_session_id TEXT)
RETURNS TABLE(
  new_count INTEGER,
  limit_reached BOOLEAN,
  message_limit INTEGER
) AS $$
DECLARE
  v_count INTEGER;
  v_limit INTEGER;
  v_reached BOOLEAN;
BEGIN
  -- Atomically increment message count and get current values
  UPDATE bmad_sessions
  SET
    message_count = message_count + 1,
    updated_at = NOW(),
    limit_reached_at = CASE
      WHEN message_count + 1 >= message_limit AND limit_reached_at IS NULL
      THEN NOW()
      ELSE limit_reached_at
    END
  WHERE id = p_session_id
  RETURNING message_count, message_limit, (message_count >= message_limit)
  INTO v_count, v_limit, v_reached;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  RETURN QUERY SELECT v_count, v_reached, v_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE FUNCTION TO CHECK MESSAGE LIMIT
-- ============================================================================

CREATE OR REPLACE FUNCTION check_message_limit(p_session_id TEXT)
RETURNS TABLE(
  current_count INTEGER,
  message_limit INTEGER,
  remaining INTEGER,
  limit_reached BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    message_count,
    bmad_sessions.message_limit,
    GREATEST(0, bmad_sessions.message_limit - message_count) as remaining,
    message_count >= bmad_sessions.message_limit as limit_reached
  FROM bmad_sessions
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN bmad_sessions.message_count IS 'Number of messages sent in this session (user messages only)';
COMMENT ON COLUMN bmad_sessions.message_limit IS 'Maximum messages allowed per session (default: 10 for SLC launch)';
COMMENT ON COLUMN bmad_sessions.limit_reached_at IS 'Timestamp when message limit was reached';

COMMENT ON FUNCTION increment_message_count(TEXT) IS 'Atomically increments message count and returns limit status';
COMMENT ON FUNCTION check_message_limit(TEXT) IS 'Checks current message count against limit';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify columns were added
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bmad_sessions'
AND column_name IN ('message_count', 'message_limit', 'limit_reached_at')
ORDER BY column_name;

-- Verify functions were created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('increment_message_count', 'check_message_limit')
AND routine_schema = 'public';

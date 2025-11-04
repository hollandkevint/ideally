-- Migration: Add Canvas Support to BMad Sessions
-- Created: 2025-11-04
-- Description: Adds columns to bmad_sessions for canvas state persistence

-- ============================================================================
-- ADD CANVAS COLUMNS TO bmad_sessions
-- ============================================================================

ALTER TABLE bmad_sessions
ADD COLUMN IF NOT EXISTS canvas_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS canvas_version INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS canvas_updated_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================================
-- CREATE INDEX FOR CANVAS QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bmad_sessions_canvas_updated
ON bmad_sessions(canvas_updated_at DESC)
WHERE canvas_data IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN bmad_sessions.canvas_data IS 'Stores canvas state as JSON (elements, diagrams, viewport)';
COMMENT ON COLUMN bmad_sessions.canvas_version IS 'Version number for optimistic locking and conflict resolution';
COMMENT ON COLUMN bmad_sessions.canvas_updated_at IS 'Timestamp of last canvas update';

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
AND column_name IN ('canvas_data', 'canvas_version', 'canvas_updated_at')
ORDER BY column_name;

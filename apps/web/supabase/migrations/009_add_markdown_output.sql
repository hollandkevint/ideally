-- Migration: Add Markdown Output Support
-- Created: 2025-11-15
-- Description: Adds markdown_output and output_metadata to user_workspace
--              for text-only structured output (replaces canvas)

-- ============================================================================
-- ADD MARKDOWN OUTPUT COLUMNS
-- ============================================================================

ALTER TABLE user_workspace
ADD COLUMN IF NOT EXISTS markdown_output TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS output_metadata JSONB DEFAULT '{"question_count": 0, "last_generated": null, "template_type": null}';

-- ============================================================================
-- UPDATE EXISTING WORKSPACES
-- ============================================================================

-- Initialize new columns for existing workspaces
UPDATE user_workspace
SET
  markdown_output = '',
  output_metadata = '{"question_count": 0, "last_generated": null, "template_type": null}'
WHERE markdown_output IS NULL OR output_metadata IS NULL;

-- ============================================================================
-- DEPRECATE CANVAS ELEMENTS (FEATURE-FLAGGED)
-- ============================================================================

-- Mark canvas_elements as deprecated but keep for backward compatibility
COMMENT ON COLUMN user_workspace.canvas_elements IS
  'DEPRECATED (2025-11-15): Replaced by markdown_output. Feature-flagged via ENABLE_CANVAS env var. Kept for rollback capability.';

-- ============================================================================
-- ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Full-text search index on markdown output
CREATE INDEX IF NOT EXISTS idx_user_workspace_markdown_search
ON user_workspace USING gin(to_tsvector('english', markdown_output));

-- Index on output metadata for filtering by template type
CREATE INDEX IF NOT EXISTS idx_user_workspace_output_metadata
ON user_workspace USING gin(output_metadata);

-- ============================================================================
-- ADD HELPFUL COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_workspace.markdown_output IS
  'Structured markdown output generated from conversations with Mary AI. Replaces canvas_elements in text-only UX.';

COMMENT ON COLUMN user_workspace.output_metadata IS
  'Metadata about generated markdown outputs: question_count, last_generated timestamp, template_type (summary/lean-canvas/business-model).';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify columns added
-- Run this to confirm migration success:
--
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'user_workspace'
-- AND column_name IN ('markdown_output', 'output_metadata');
--
-- Expected: 2 rows

-- Verify indexes created
--
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'user_workspace'
-- AND indexname LIKE '%markdown%';
--
-- Expected: 2 rows (markdown_search, output_metadata)

-- Check existing data initialized
--
-- SELECT COUNT(*) as total_workspaces,
--        COUNT(markdown_output) as with_markdown_column,
--        COUNT(CASE WHEN markdown_output != '' THEN 1 END) as with_content
-- FROM user_workspace;
--
-- Expected: total_workspaces = with_markdown_column (all initialized)

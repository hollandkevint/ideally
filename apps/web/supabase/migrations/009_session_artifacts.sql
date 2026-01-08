-- Migration 009: Session Artifacts
-- Stores artifacts generated during BMad sessions for persistence and later retrieval

CREATE TABLE IF NOT EXISTS session_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES bmad_sessions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  view_mode VARCHAR(20) DEFAULT 'inline',
  render_mode VARCHAR(20) DEFAULT 'rendered',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast session lookup
CREATE INDEX IF NOT EXISTS idx_session_artifacts_session ON session_artifacts(session_id);

-- Index for type-based queries
CREATE INDEX IF NOT EXISTS idx_session_artifacts_type ON session_artifacts(type);

-- Enable Row Level Security
ALTER TABLE session_artifacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access artifacts from their own sessions
CREATE POLICY "Users can access own session artifacts" ON session_artifacts
  FOR ALL USING (
    session_id IN (
      SELECT id FROM bmad_sessions WHERE user_id = auth.uid()
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_artifacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_session_artifacts_updated_at ON session_artifacts;
CREATE TRIGGER trigger_update_session_artifacts_updated_at
  BEFORE UPDATE ON session_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_session_artifacts_updated_at();

-- Comment on table
COMMENT ON TABLE session_artifacts IS 'Stores artifacts (lean canvas, diagrams, documents) generated during BMad sessions';
COMMENT ON COLUMN session_artifacts.type IS 'Artifact type: lean-canvas, diagram, working-document, code, etc.';
COMMENT ON COLUMN session_artifacts.metadata IS 'Additional artifact metadata (e.g., source message ID, generation parameters)';
COMMENT ON COLUMN session_artifacts.view_mode IS 'Display mode: collapsed, inline, panel';
COMMENT ON COLUMN session_artifacts.render_mode IS 'Render mode: raw, rendered';

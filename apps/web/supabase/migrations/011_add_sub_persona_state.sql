-- Migration 011: Add sub-persona state to bmad_sessions
-- Enables persistence of Mary's sub-persona mode, user state detection, and kill decision tracking

-- Add sub_persona_state JSONB column to bmad_sessions
-- Stores: currentMode, modeHistory, exchangeCount, userControlEnabled,
--         detectedUserState, killDecision, pathwayWeights, modeWeightOverrides
ALTER TABLE bmad_sessions
ADD COLUMN IF NOT EXISTS sub_persona_state JSONB DEFAULT NULL;

-- Add a comment explaining the structure
COMMENT ON COLUMN bmad_sessions.sub_persona_state IS 'Sub-persona system state: {currentMode, modeHistory, exchangeCount, userControlEnabled, detectedUserState, killDecision, pathwayWeights, modeWeightOverrides}';

-- Create an index for queries that filter by current mode (optional, for analytics)
CREATE INDEX IF NOT EXISTS idx_bmad_sessions_sub_persona_mode
ON bmad_sessions ((sub_persona_state->>'currentMode'))
WHERE sub_persona_state IS NOT NULL;

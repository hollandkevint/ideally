-- Update pathway enum to include new pathway types for Epic 2
-- Migration to support: 'new-idea', 'business-model-problem', 'feature-refinement'

-- Drop the existing constraint
ALTER TABLE bmad_sessions DROP CONSTRAINT bmad_sessions_pathway_check;

-- Add the new constraint with updated pathway types
ALTER TABLE bmad_sessions ADD CONSTRAINT bmad_sessions_pathway_check 
  CHECK (pathway IN ('new-idea', 'business-model', 'business-model-problem', 'feature-refinement', 'strategic-optimization'));

-- Create pathway analytics table for tracking pathway selection patterns
CREATE TABLE bmad_pathway_analytics (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  workspace_id uuid NOT NULL,
  original_input text NOT NULL,
  recommended_pathway text NOT NULL,
  selected_pathway text NOT NULL,
  confidence_score numeric(5,2) NOT NULL,
  reasoning text,
  alternative_pathways text[] NOT NULL DEFAULT '{}',
  session_id uuid REFERENCES bmad_sessions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for analytics queries
CREATE INDEX idx_bmad_pathway_analytics_user_id ON bmad_pathway_analytics(user_id);
CREATE INDEX idx_bmad_pathway_analytics_workspace_id ON bmad_pathway_analytics(workspace_id);
CREATE INDEX idx_bmad_pathway_analytics_recommended_pathway ON bmad_pathway_analytics(recommended_pathway);
CREATE INDEX idx_bmad_pathway_analytics_selected_pathway ON bmad_pathway_analytics(selected_pathway);
CREATE INDEX idx_bmad_pathway_analytics_created_at ON bmad_pathway_analytics(created_at);

-- RLS for pathway analytics
ALTER TABLE bmad_pathway_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pathway analytics" ON bmad_pathway_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pathway analytics" ON bmad_pathway_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
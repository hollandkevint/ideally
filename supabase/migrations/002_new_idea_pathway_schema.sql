-- New Idea Pathway Schema Extension
-- Additional tables specifically for New Idea pathway data storage

-- New table for New Idea pathway phases as specified in story requirements
CREATE TABLE bmad_new_idea_phases (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade,
  phase_name text check (phase_name in ('ideation', 'market_exploration', 'concept_refinement', 'positioning')),
  completed boolean default false,
  insights jsonb default '{}',
  time_spent interval,
  created_at timestamptz default now()
);

-- Add pathway_data column to existing bmad_sessions table for New Idea pathway specific data
ALTER TABLE bmad_sessions ADD COLUMN IF NOT EXISTS
  pathway_data jsonb DEFAULT '{}'; -- Store pathway-specific session data

-- Add concept_document column for generated business concept
ALTER TABLE bmad_sessions ADD COLUMN IF NOT EXISTS
  concept_document jsonb DEFAULT '{}'; -- Generated business concept

-- Index for performance
CREATE INDEX idx_bmad_new_idea_phases_session_id ON bmad_new_idea_phases(session_id);
CREATE INDEX idx_bmad_new_idea_phases_name ON bmad_new_idea_phases(phase_name);
CREATE INDEX idx_bmad_sessions_pathway_data ON bmad_sessions USING gin(pathway_data);

-- Row Level Security for new table
ALTER TABLE bmad_new_idea_phases ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Users can only access their own New Idea phase data
CREATE POLICY "Users can manage their new idea phases" ON bmad_new_idea_phases
  FOR all USING (
    exists (
      select 1 from bmad_sessions
      where id = bmad_new_idea_phases.session_id
      and user_id = auth.uid()
    )
  );
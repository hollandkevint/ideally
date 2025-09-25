-- COPY THIS SQL INTO YOUR SUPABASE DASHBOARD SQL EDITOR AND RUN IT
-- Go to: https://supabase.com/dashboard/project/lbnhfsocxbwhbvnfpjdw/sql

-- Create user_workspace table for legacy compatibility
CREATE TABLE user_workspace (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_state JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_workspace ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own workspace
CREATE POLICY "Users can only access their own user_workspace" ON user_workspace
    FOR ALL USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_user_workspace_user_id ON user_workspace(user_id);
CREATE INDEX idx_user_workspace_updated_at ON user_workspace(updated_at DESC);

-- Function to update workspace timestamps
CREATE OR REPLACE FUNCTION update_user_workspace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER trigger_update_user_workspace_updated_at
    BEFORE UPDATE ON user_workspace
    FOR EACH ROW EXECUTE FUNCTION update_user_workspace_updated_at();
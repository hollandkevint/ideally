-- Migration: Add support for multiple workspaces per user
-- This enables the workspace dashboard functionality

-- Create workspaces table for multiple projects per user
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    chat_context JSONB NOT NULL DEFAULT '[]',
    canvas_elements JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT workspaces_name_length CHECK (length(name) >= 1 AND length(name) <= 255)
);

-- Enable RLS on workspaces table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own workspaces
CREATE POLICY "Users can only access their own workspaces" ON workspaces
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_workspaces_updated_at ON workspaces(updated_at DESC);

-- Function to update workspace timestamps
CREATE OR REPLACE FUNCTION update_workspace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER trigger_update_workspace_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_workspace_updated_at();

-- Insert sample workspace for testing (optional)
-- This will be created by the dashboard UI instead
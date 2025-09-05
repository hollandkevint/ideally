-- Migration: Add conversation branches for alternative exploration paths
-- This enables users to create alternative conversation paths from any message

-- Create conversation_branches table
CREATE TABLE IF NOT EXISTS conversation_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  branch_conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  branch_point_message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  alternative_direction TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX idx_conversation_branches_source ON conversation_branches(source_conversation_id);
CREATE INDEX idx_conversation_branches_branch ON conversation_branches(branch_conversation_id);
CREATE INDEX idx_conversation_branches_created_by ON conversation_branches(created_by);
CREATE INDEX idx_conversation_branches_branch_point ON conversation_branches(branch_point_message_id);

-- Add RLS policies for conversation branches
ALTER TABLE conversation_branches ENABLE ROW LEVEL SECURITY;

-- Users can only access branches they created
CREATE POLICY "Users can view their conversation branches" ON conversation_branches
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create conversation branches" ON conversation_branches
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their conversation branches" ON conversation_branches
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their conversation branches" ON conversation_branches
  FOR DELETE USING (created_by = auth.uid());

-- Add metadata column to conversations table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'metadata') THEN
    ALTER TABLE conversations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update messages table to support branch-related metadata
DO $$ 
BEGIN
  -- Add token_usage column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'token_usage') THEN
    ALTER TABLE messages ADD COLUMN token_usage JSONB;
  END IF;
  
  -- Add coaching_context column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'coaching_context') THEN
    ALTER TABLE messages ADD COLUMN coaching_context JSONB;
  END IF;
  
  -- Update metadata column to be JSONB if it's not already
  -- Note: This assumes the existing metadata column exists and might need conversion
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'messages' AND column_name = 'metadata') THEN
    -- Check if it's already JSONB, if not, convert it
    IF (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'metadata') != 'jsonb' THEN
      ALTER TABLE messages ALTER COLUMN metadata TYPE JSONB USING metadata::jsonb;
    END IF;
  ELSE
    -- Add metadata column if it doesn't exist
    ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create function to get branch statistics
CREATE OR REPLACE FUNCTION get_branch_stats(conversation_uuid UUID)
RETURNS TABLE(
  total_branches INTEGER,
  active_branches INTEGER,
  merged_branches INTEGER,
  total_messages INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_branches,
    COUNT(*) FILTER (WHERE metadata->>'merged' IS NULL OR metadata->>'merged' != 'true')::INTEGER as active_branches,
    COUNT(*) FILTER (WHERE metadata->>'merged' = 'true')::INTEGER as merged_branches,
    COALESCE(SUM((metadata->>'messages_merged')::INTEGER), 0)::INTEGER as total_messages
  FROM conversation_branches 
  WHERE source_conversation_id = conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_branch_stats TO authenticated;

COMMENT ON TABLE conversation_branches IS 'Stores conversation branches for alternative exploration paths';
COMMENT ON COLUMN conversation_branches.source_conversation_id IS 'The original conversation that was branched from';
COMMENT ON COLUMN conversation_branches.branch_conversation_id IS 'The new conversation created as a branch';
COMMENT ON COLUMN conversation_branches.branch_point_message_id IS 'The message from which the branch was created';
COMMENT ON COLUMN conversation_branches.alternative_direction IS 'The type of alternative direction being explored';
COMMENT ON COLUMN conversation_branches.metadata IS 'Additional branch metadata including merge status and context preservation settings';
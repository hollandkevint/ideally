-- Migration: Fix user_workspace automatic creation for new users
-- Created: 2025-09-24
-- Purpose: Ensure user_workspace records are created for all authenticated users

-- Create function to handle new user workspace creation
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user_workspace already exists for this user
    IF NOT EXISTS (
        SELECT 1 FROM public.user_workspace
        WHERE user_id = NEW.id
    ) THEN
        -- Create a new user_workspace record
        INSERT INTO public.user_workspace (user_id, workspace_state, created_at, updated_at)
        VALUES (
            NEW.id,
            jsonb_build_object(
                'initialized', true,
                'name', 'My Strategic Workspace',
                'description', 'Strategic thinking and planning workspace',
                'dual_pane_state', jsonb_build_object(
                    'chat_width', 50,
                    'canvas_width', 50,
                    'active_pane', 'chat',
                    'collapsed', false
                ),
                'chat_context', '[]'::jsonb,
                'canvas_elements', '[]'::jsonb,
                'created_at', NOW()
            ),
            NOW(),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table to create workspace on user creation
CREATE TRIGGER create_workspace_on_user_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_workspace();

-- Create function to ensure existing users have workspaces
CREATE OR REPLACE FUNCTION public.ensure_user_workspaces()
RETURNS void AS $$
BEGIN
    -- Insert workspace records for any existing users who don't have one
    INSERT INTO public.user_workspace (user_id, workspace_state, created_at, updated_at)
    SELECT
        u.id,
        jsonb_build_object(
            'initialized', true,
            'name', 'My Strategic Workspace',
            'description', 'Strategic thinking and planning workspace',
            'dual_pane_state', jsonb_build_object(
                'chat_width', 50,
                'canvas_width', 50,
                'active_pane', 'chat',
                'collapsed', false
            ),
            'chat_context', '[]'::jsonb,
            'canvas_elements', '[]'::jsonb,
            'created_at', NOW()
        ),
        NOW(),
        NOW()
    FROM auth.users u
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_workspace w
        WHERE w.user_id = u.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to ensure all existing users have workspaces
SELECT public.ensure_user_workspaces();

-- Add comment for maintenance
COMMENT ON FUNCTION public.handle_new_user_workspace() IS 'Automatically creates user_workspace record when new user signs up';
COMMENT ON FUNCTION public.ensure_user_workspaces() IS 'Ensures all existing users have workspace records';
COMMENT ON TRIGGER create_workspace_on_user_signup ON auth.users IS 'Trigger to create workspace for new users on signup';
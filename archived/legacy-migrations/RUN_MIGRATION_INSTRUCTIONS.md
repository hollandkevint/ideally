# Database Migration Instructions

## Quick Fix: Run SQL Migration

Since OAuth is working and we just need to create the missing `user_workspace` table, you can run the migration directly in the Supabase dashboard:

### Option 1: Supabase Dashboard (Recommended - 2 minutes)
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your project: `lbnhfsocxbwhbvnfpjdw.supabase.co`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the entire contents of `apps/web/supabase/migrations/003_user_workspace_table.sql`
6. Click **Run** to execute the migration

### Option 2: Supabase CLI (If you have it installed)
```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Run the migration
supabase db push --local=false
```

### Option 3: Quick SQL (Copy this to SQL Editor)
```sql
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
```

## After Migration
Once you run the migration:
1. Refresh your application at: https://thinkhaven-hjpruznrc-hollandkevints-projects.vercel.app
2. Try creating a new strategic session
3. The database errors should be resolved!

## Expected Result
- ✅ OAuth authentication working
- ✅ `user_workspace` table created
- ✅ Workspace creation working
- ✅ Error messages gone

The application should work immediately after running the migration!
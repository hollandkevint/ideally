# Run Migration 007 - Canvas Support

**URGENT:** Run this migration NOW before testing the fixed deployment.

## What This Does
Adds canvas support columns to the `bmad_sessions` table:
- `canvas_data` (JSONB) - Stores canvas state
- `canvas_version` (INTEGER) - Version tracking
- `canvas_updated_at` (TIMESTAMPTZ) - Last update timestamp

## Steps to Run

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your ThinkHaven project (lbnhfsocxbwhbvnfpjdw)
   - Navigate to **SQL Editor**

2. **Copy the entire migration:**
   - Open: `apps/web/supabase/migrations/007_add_canvas_columns.sql`
   - Copy ALL the SQL code

3. **Paste and Run:**
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for "Success" message

4. **Verify it worked:**
   The migration includes a verification query at the end that shows:
   ```
   column_name          | data_type | is_nullable | column_default
   canvas_data          | jsonb     | YES         | NULL
   canvas_version       | integer   | NO          | 0
   canvas_updated_at    | timestamp | YES         | NULL
   ```

### Option 2: Quick Copy-Paste

```sql
-- Migration: Add Canvas Support to BMad Sessions
-- Created: 2025-11-04

ALTER TABLE bmad_sessions
ADD COLUMN IF NOT EXISTS canvas_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS canvas_version INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS canvas_updated_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_bmad_sessions_canvas_updated
ON bmad_sessions(canvas_updated_at DESC)
WHERE canvas_data IS NOT NULL;

COMMENT ON COLUMN bmad_sessions.canvas_data IS 'Stores canvas state as JSON (elements, diagrams, viewport)';
COMMENT ON COLUMN bmad_sessions.canvas_version IS 'Version number for optimistic locking and conflict resolution';
COMMENT ON COLUMN bmad_sessions.canvas_updated_at IS 'Timestamp of last canvas update';

-- Verify columns were added
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bmad_sessions'
AND column_name IN ('canvas_data', 'canvas_version', 'canvas_updated_at')
ORDER BY column_name;
```

## After Running Migration

1. **Check Vercel Deployment:**
   - Wait for deployment to complete (2-3 minutes)
   - Check: https://vercel.com/dashboard

2. **Test Mary AI:**
   - Go to: https://thinkhaven.co/workspace/8b82d10d-f1b6-460b-89df-80a65094e5a5
   - Send a message to Mary
   - **Should get a response now!**

3. **Check Console:**
   - Open browser DevTools (F12)
   - Should see NO errors like "getCanvasState is not a function"
   - Should see NO 500 errors on /api/bmad

## Troubleshooting

### If migration fails:
- **"column already exists"** → That's OK! The migration uses `IF NOT EXISTS`
- **"permission denied"** → Make sure you're using the correct Supabase project

### If Mary still doesn't respond:
1. Check Vercel deployment completed
2. Check browser console for new errors
3. Check Vercel logs for API errors

## Expected Results

After migration + deployment:
- ✅ Mary AI responds to messages
- ✅ No canvas-related errors in console
- ✅ Canvas state persists correctly
- ✅ No 500 errors on /api/bmad

---

**Run this migration ASAP, then test!** The code is deployed and waiting for the database columns.

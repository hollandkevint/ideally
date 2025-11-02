# Migration Execution Order

**Error**: `bmad_sessions` table doesn't exist when running migration 005.

**Root Cause**: Migrations must be run in order, and migration 001 creates the `bmad_sessions` table.

## Correct Migration Order

Run these migrations in the Supabase Dashboard SQL Editor in this exact order:

### 0. Migration 000 - Enable Extensions (REQUIRED FIRST)
**File**: `supabase/migrations/000_enable_extensions.sql`

Enables PostgreSQL extensions:
- uuid-ossp (UUID generation)
- vector (pgvector for semantic search)

**SQL Editor**: Copy/paste entire file → Run

**This must be run FIRST** or migration 001 will fail with "type vector does not exist"

---

### 1. Migration 001 - BMad Method Schema (Creates bmad_sessions)
**File**: `supabase/migrations/001_bmad_method_schema.sql`

This creates the core tables including:
- bmad_sessions (required by migration 005)
- bmad_phases
- bmad_user_responses
- pathway_definitions

**SQL Editor**: Copy/paste entire file → Run

---

### 2. Migration 002 - Conversations & Messages Schema
**File**: `supabase/migrations/002_conversations_messages_schema.sql`

Creates:
- conversations
- messages
- conversation_branches

**SQL Editor**: Copy/paste entire file → Run

---

### 3. Migration 003 - User Workspace Table
**File**: `supabase/migrations/003_user_workspace_table.sql`

Creates:
- user_workspace

**SQL Editor**: Copy/paste entire file → Run

---

### 4. Migration 004 - Fix User Workspace Creation
**File**: `supabase/migrations/004_fix_user_workspace_creation.sql`

Updates user_workspace creation logic.

**SQL Editor**: Copy/paste entire file → Run

---

### 5. Migration 005 - Session Credit System (Modified for 2 credits)
**File**: `supabase/migrations/005_session_credit_system.sql`

Creates:
- user_credits (with 2 free credits on signup)
- credit_transactions
- credit_packages
- payment_history

**SQL Editor**: Copy/paste entire file → Run

---

### 6. Migration 006 - Trial Feedback
**File**: `supabase/migrations/006_trial_feedback.sql`

Creates:
- trial_feedback

**SQL Editor**: Copy/paste entire file → Run

---

## Verification After All Migrations

Run this query to verify all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Should include:
- bmad_phases
- bmad_sessions ✅ (needed by migration 005)
- bmad_user_responses
- conversation_branches
- conversations
- credit_packages
- credit_transactions
- messages
- pathway_definitions
- payment_history
- trial_feedback
- user_credits
- user_workspace

---

## Check Which Migrations Are Already Applied

Run this to see what tables currently exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**If you see `bmad_sessions`**: Skip migration 001, start from 002
**If you don't see `bmad_sessions`**: Start from migration 001

---

## Quick Check: Do You Need Migration 001?

Run this query:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'bmad_sessions'
);
```

- Returns `true`: bmad_sessions exists, you can skip 001
- Returns `false`: Run migration 001 first

---

## Dashboard Navigation

1. Go to: https://supabase.com/dashboard/project/lbnhfsocxbwhbvnfpjdw
2. Click "SQL Editor" (left sidebar)
3. Click "New query"
4. Copy/paste migration contents
5. Click "Run"
6. Repeat for each migration in order

---

## Expected Result

After all migrations:
- ✅ All tables created
- ✅ Triggers installed (grant_free_credit)
- ✅ Credit packages seeded (3 tiers)
- ✅ RLS policies active
- ✅ Ready for testing

---

**Next**: Once all migrations complete, continue with `TEST-TRIAL-FLOW.md`

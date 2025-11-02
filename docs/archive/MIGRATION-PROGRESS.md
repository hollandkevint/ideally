# Migration Progress Tracker

## Completed ✅

- [x] **000_enable_extensions.sql** - Extensions enabled (uuid-ossp, vector)
- [x] **001_bmad_method_schema.sql** - BMad core tables created

## Next Steps - Run in Supabase Dashboard

Copy/paste these files in order into the SQL Editor:

### 2. Migration 002 - Conversations & Messages
**File**: `supabase/migrations/002_conversations_messages_schema.sql`

Creates:
- conversations
- messages
- conversation_branches

---

### 3. Migration 003 - User Workspace
**File**: `supabase/migrations/003_user_workspace_table.sql`

Creates:
- user_workspace

---

### 4. Migration 004 - User Workspace Fix
**File**: `supabase/migrations/004_fix_user_workspace_creation.sql`

Updates workspace creation logic.

---

### 5. Migration 005 - Session Credit System ⭐ (Modified for 2 credits)
**File**: `supabase/migrations/005_session_credit_system.sql`

Creates:
- user_credits (grants 2 free credits on signup)
- credit_transactions
- credit_packages (3 tiers seeded)
- payment_history

**This is the key migration for the trial system!**

---

### 6. Migration 006 - Trial Feedback
**File**: `supabase/migrations/006_trial_feedback.sql`

Creates:
- trial_feedback

---

## After All Migrations

Run this verification query:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- bmad_action_items
- bmad_elicitation_history
- bmad_generated_documents
- bmad_knowledge_entries
- bmad_knowledge_references
- bmad_persona_evolution
- bmad_phase_allocations
- bmad_phase_outputs
- bmad_sessions ✅
- bmad_session_progress
- bmad_template_outputs
- bmad_user_responses
- conversation_branches
- conversations
- credit_packages ⭐
- credit_transactions ⭐
- messages
- payment_history ⭐
- trial_feedback ⭐
- user_credits ⭐
- user_workspace

## Test After Migrations Complete

Once all migrations are done:

1. **Verify credit packages seeded**:
   ```sql
   SELECT id, name, credits, price_cents FROM credit_packages;
   ```
   Should show 3 packages: starter, professional, business

2. **Verify trigger exists**:
   ```sql
   SELECT trigger_name FROM information_schema.triggers
   WHERE trigger_name = 'trigger_grant_free_credit';
   ```
   Should return: trigger_grant_free_credit

3. **Test with new account** (covered in TEST-TRIAL-FLOW.md)

---

## Dev Server Status

✅ Running at: http://localhost:3002

# Skip to Migration 005 - Credit System

## Current Status

✅ **Already Applied:**
- 000_enable_extensions.sql
- 001_bmad_method_schema.sql
- 002_conversations_messages_schema.sql
- 003_user_workspace_table.sql (table already exists)
- Likely 004 as well

## Next Steps

### 1. Run Migration 005 - Session Credit System ⭐

**File**: `supabase/migrations/005_session_credit_system.sql`

This is the **key migration** for the 2-session trial!

Copy/paste the entire file into Supabase Dashboard SQL Editor and run.

**What it creates:**
- `user_credits` table - Tracks balance (grants **2 credits** on signup)
- `credit_transactions` table - Audit trail
- `credit_packages` table - 3 pricing tiers ($19, $39, $79)
- `payment_history` table - Stripe integration
- `grant_free_credit()` function - Auto-grants 2 credits
- Trigger on `auth.users` - Runs grant_free_credit() on signup

---

### 2. Run Migration 006 - Trial Feedback

**File**: `supabase/migrations/006_trial_feedback.sql`

Copy/paste the entire file and run.

**What it creates:**
- `trial_feedback` table - Stores user feedback after trial

---

## Verification After Both Migrations

### Check Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_credits', 'credit_transactions', 'credit_packages', 'trial_feedback')
ORDER BY table_name;
```

Should return 4 tables.

---

### Verify Credit Packages Seeded
```sql
SELECT id, name, credits, price_cents
FROM credit_packages
ORDER BY display_order;
```

Expected output:
```
id           | name              | credits | price_cents
-------------|-------------------|---------|------------
starter      | Starter Pack      | 5       | 1900
professional | Professional Pack | 10      | 3900
business     | Business Pack     | 20      | 7900
```

---

### Verify Trigger Installed
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_grant_free_credit';
```

Expected output:
```
trigger_name              | event_manipulation | event_object_table
--------------------------|-------------------|-------------------
trigger_grant_free_credit | INSERT            | users
```

---

### Test Grant Function Manually (Optional)
```sql
-- Check what the function will do (doesn't actually run it)
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'grant_free_credit';
```

Should show the function grants **2 credits** (not 1).

---

## After Migrations Complete

You're ready to test! The system will:

1. **New user signs up** → Trigger fires → `grant_free_credit()` runs
2. **User gets 2 credits** → Logged in `user_credits` and `credit_transactions`
3. **Session 1** → `sessionOrchestrator.createSession()` checks credits → deducts 1
4. **Session 2** → Checks credits → deducts 1 → balance = 0
5. **Trial complete** → Shows feedback form

---

## Test Checklist

Once migrations are done, follow: **TEST-TRIAL-FLOW.md**

Dev server ready at: http://localhost:3002

---

## If Migration 005 Fails

Common issues:

**"relation bmad_sessions does not exist"**
- ✅ Fixed - migration 001 ran successfully

**"extension vector does not exist"**
- ✅ Fixed - migration 000 ran successfully

**"duplicate key value violates unique constraint"**
- Tables already exist, migration already ran
- Check: `SELECT * FROM user_credits LIMIT 1;`
- If data exists, migration 005 already applied

**Other errors**
- Share the error message for troubleshooting

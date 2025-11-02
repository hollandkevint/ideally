# Manual Migration Steps

Since the automatic script requires interactive login, follow these manual steps:

## Option 1: Supabase Dashboard (Easiest - No CLI needed)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/lbnhfsocxbwhbvnfpjdw

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Run Migration 005** (Credit System - Modified for 2 credits)
   - Copy entire contents of: `apps/web/supabase/migrations/005_session_credit_system.sql`
   - Paste into SQL editor
   - Click "Run"
   - Should see: "Success. No rows returned"

4. **Run Migration 006** (Feedback Table)
   - Click "New query" again
   - Copy entire contents of: `apps/web/supabase/migrations/006_trial_feedback.sql`
   - Paste into SQL editor
   - Click "Run"
   - Should see: "Success. No rows returned"

5. **Verify Tables Created**
   - Run this query:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('user_credits', 'credit_transactions', 'credit_packages', 'trial_feedback')
   ORDER BY table_name;
   ```
   - Should return 4 rows:
     - credit_packages
     - credit_transactions
     - trial_feedback
     - user_credits

6. **Verify Credit Packages Seeded**
   ```sql
   SELECT id, name, credits, price_cents FROM credit_packages ORDER BY display_order;
   ```
   - Should show 3 packages:
     - starter: 5 credits, $19.00
     - professional: 10 credits, $39.00
     - business: 20 credits, $79.00

7. **Verify Trigger Exists**
   ```sql
   SELECT trigger_name, event_manipulation
   FROM information_schema.triggers
   WHERE trigger_name = 'trigger_grant_free_credit';
   ```
   - Should return: trigger_grant_free_credit, INSERT

✅ **Done!** Migrations applied successfully.

---

## Option 2: Supabase CLI (After Manual Login)

If you want to use CLI, you need to login in your terminal first:

### Step 1: Login (Opens Browser)
```bash
npx supabase login
```
- Opens browser for OAuth
- Authorize Supabase CLI
- Returns to terminal when complete

### Step 2: Link Project
```bash
npx supabase link --project-ref lbnhfsocxbwhbvnfpjdw \
  --workdir /Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web
```

### Step 3: Push Migrations
```bash
npx supabase db push \
  --workdir /Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web
```

### Step 4: Verify
```bash
npx supabase db execute \
  --workdir /Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web \
  --query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_credits', 'credit_transactions', 'credit_packages', 'trial_feedback')" \
  --format table
```

---

## Next Steps After Migration

Once migrations are applied (either method):

1. **Dev server is already running**: http://localhost:3002

2. **Test the trial flow**:
   - Follow: `TEST-TRIAL-FLOW.md`
   - Create new test account
   - Verify 2 credits granted
   - Test session creation

3. **Monitor for issues**:
   - Check terminal logs for errors
   - Verify credit deductions in Supabase
   - Test feedback form submission

---

## Recommendation

**Use Option 1 (Supabase Dashboard)** - it's faster and doesn't require CLI setup.

The SQL migrations are already written and ready to copy/paste!

# MVP Trial Deployment Checklist

## Status: Ready for Migration & Testing

### ✅ Step 1: Integration Complete
- [x] CreditGuard component integrated into navigation (apps/web/app/components/ui/navigation.tsx:69)
- [x] Shows credit balance for logged-in users
- [x] Displays trial complete message at 0 credits
- [x] Includes feedback form

### Step 2: Run Database Migrations

You need to apply migrations 005 and 006 to your Supabase project:

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to "Database" → "Migrations"
4. Copy contents of migration files and run them:
   - `apps/web/supabase/migrations/005_session_credit_system.sql`
   - `apps/web/supabase/migrations/006_trial_feedback.sql`

**Option B: Via Supabase CLI**
```bash
# Link to your project (one-time setup)
cd apps/web
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
npx supabase db push

# Or apply specific migration
npx supabase db push --include-all
```

**Option C: Manual SQL Execution**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste migration 005 → Execute
3. Copy and paste migration 006 → Execute

**Verify Migrations:**
```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_credits', 'credit_transactions', 'credit_packages', 'trial_feedback');

-- Check function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'grant_free_credit';

-- Check trigger exists
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'trigger_grant_free_credit';
```

### Step 3: Test Locally

**Start dev server:**
```bash
npm run dev
```

**Test Flow:**

1. **New User Signup**
   - Create new account via Google OAuth
   - Check database: Should have 2 credits in `user_credits` table
   - Check navigation: Should show "2 sessions remaining"

2. **Session 1**
   - Navigate to dashboard
   - Start new session
   - Check database: Should have 1 credit remaining
   - Check navigation: Should show "1 session remaining" with amber warning

3. **Session 2**
   - Start another session
   - Check database: Should have 0 credits
   - Check navigation: Should show trial complete message

4. **Feedback Form**
   - Fill out rating (1-5)
   - Select "Would pay" option
   - Add optional feedback text
   - Submit
   - Check console logs for feedback data

5. **Session 3 Attempt**
   - Try to start another session
   - Should see `INSUFFICIENT_CREDITS` error
   - Should show trial complete UI

**Database Queries for Testing:**
```sql
-- Check user credits
SELECT * FROM user_credits WHERE user_id = 'YOUR_USER_ID';

-- Check credit transactions
SELECT * FROM credit_transactions WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC;

-- Check feedback (if table exists)
SELECT * FROM trial_feedback WHERE user_id = 'YOUR_USER_ID';

-- Check sessions created
SELECT id, user_id, created_at FROM bmad_sessions WHERE user_id = 'YOUR_USER_ID';
```

### Step 4: Deploy to Production

**Prepare for deployment:**
```bash
# Ensure all changes committed
git add .
git commit -m "🚀 MVP: Implement 2-session trial with feedback collection"

# Push to main
git push origin main
```

**Deploy via Vercel:**
```bash
vercel --prod
```

**Or via Vercel Dashboard:**
1. Push to GitHub
2. Vercel auto-deploys on main branch push
3. Wait for deployment to complete

**Post-Deployment Verification:**
1. Visit production URL
2. Create test account
3. Verify credit system works
4. Test full trial flow
5. Submit test feedback

### Step 5: Monitor Metrics

**Track these metrics in Supabase:**

```sql
-- Daily signups
SELECT DATE(created_at) as date, COUNT(*) as signups
FROM user_credits
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Trial completion rate
SELECT
  COUNT(DISTINCT user_id) as total_users,
  COUNT(DISTINCT CASE WHEN total_used >= 1 THEN user_id END) as started_session_1,
  COUNT(DISTINCT CASE WHEN total_used >= 2 THEN user_id END) as started_session_2,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN total_used >= 2 THEN user_id END) / NULLIF(COUNT(DISTINCT user_id), 0), 1) as completion_rate
FROM user_credits
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Average rating
SELECT
  COUNT(*) as feedback_count,
  ROUND(AVG(rating), 2) as avg_rating,
  ROUND(100.0 * SUM(CASE WHEN would_pay THEN 1 ELSE 0 END) / COUNT(*), 1) as would_pay_pct
FROM trial_feedback
WHERE submitted_at >= NOW() - INTERVAL '7 days';

-- Recent feedback
SELECT
  submitted_at,
  rating,
  would_pay,
  feedback_text
FROM trial_feedback
ORDER BY submitted_at DESC
LIMIT 20;
```

**Set up dashboard views:**
1. Create saved queries in Supabase for quick access
2. Set up weekly review schedule
3. Monitor for 2-4 weeks before decision

### Decision Criteria

After collecting sufficient data (target: 50-100 trial completions):

**Proceed with Monetization if:**
- Average rating ≥ 4.0
- Would pay percentage ≥ 30%
- Positive feedback themes
- Low churn after trial

**Iterate on Product if:**
- Average rating < 3.5
- Would pay percentage < 20%
- Negative feedback themes
- High drop-off after session 1

**Consider Adjustments if:**
- Rating 3.5-4.0 or Would pay 20-30%
- Review feedback for specific improvements
- Consider extending to 3 sessions
- Address top pain points

### Rollback Plan (If Issues Arise)

**Emergency: Disable credit checks**
1. Comment out lines 75-83 in `apps/web/lib/bmad/session-orchestrator.ts`
2. Redeploy

**Revert to 1 credit trial:**
```sql
-- Update function
CREATE OR REPLACE FUNCTION grant_free_credit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (user_id, balance, total_granted)
    VALUES (NEW.id, 1, 1);

    INSERT INTO credit_transactions (
        user_id, transaction_type, amount, balance_after, description
    )
    VALUES (
        NEW.id, 'grant', 1, 1, 'Welcome! Your first session is on us.'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Files Changed in This Release

- ✅ `apps/web/supabase/migrations/005_session_credit_system.sql` (modified: 2 credits)
- ✅ `apps/web/lib/bmad/session-orchestrator.ts` (added credit checks)
- ✅ `apps/web/app/components/monetization/CreditGuard.tsx` (new)
- ✅ `apps/web/app/components/monetization/FeedbackForm.tsx` (new)
- ✅ `apps/web/app/api/feedback/trial/route.ts` (new)
- ✅ `apps/web/supabase/migrations/006_trial_feedback.sql` (new)
- ✅ `apps/web/app/components/ui/navigation.tsx` (integrated CreditGuard)

---

**Estimated Timeline:**
- Migration: 5 minutes
- Local testing: 30 minutes
- Deployment: 10 minutes
- Total: ~45 minutes to production

**Next Session:** Review metrics after 2-4 weeks of data collection

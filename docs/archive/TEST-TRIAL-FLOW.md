# MVP Trial Flow Testing Guide

**Dev Server**: http://localhost:3002
**Status**: ✅ Running

## Pre-Test Setup

Before testing, you need to run migrations in Supabase:

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your ThinkHaven project
3. Go to SQL Editor
4. Run migration 005 (modified):

```sql
-- Copy contents from apps/web/supabase/migrations/005_session_credit_system.sql
-- Key change: grants 2 credits instead of 1
```

5. Run migration 006 (feedback table):

```sql
-- Copy contents from apps/web/supabase/migrations/006_trial_feedback.sql
```

6. Verify migrations worked:

```sql
-- Should return 4 tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_credits', 'credit_transactions', 'credit_packages', 'trial_feedback');

-- Should return grant_free_credit
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'grant_free_credit';
```

## Test Flow

### Test 1: New User Signup (2 Credits Granted)

**Action:**
1. Open http://localhost:3002
2. Click "Sign Up"
3. Complete Google OAuth flow
4. Should redirect to dashboard

**Expected:**
- Navigation bar shows: "2 sessions remaining" with green dot
- No warnings or errors

**Verify in Supabase:**
```sql
-- Replace YOUR_USER_ID with actual user ID from auth.users
SELECT * FROM user_credits WHERE user_id = 'YOUR_USER_ID';
-- Should show: balance=2, total_granted=2

SELECT * FROM credit_transactions WHERE user_id = 'YOUR_USER_ID';
-- Should show 1 transaction: type='grant', amount=2, description='Welcome! Try 2 free sessions...'
```

---

### Test 2: Session 1 (2 → 1 Credit)

**Action:**
1. From dashboard, click "Start New Session" or "New Idea"
2. Begin session creation flow

**Expected:**
- Session starts successfully
- Navigation updates to: "1 session remaining" with amber dot
- Amber warning badge: "Last free session!"

**Verify in Supabase:**
```sql
SELECT * FROM user_credits WHERE user_id = 'YOUR_USER_ID';
-- Should show: balance=1, total_used=1

SELECT * FROM credit_transactions WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 2;
-- Should show 2 transactions:
-- 1. type='deduct', amount=-1, balance_after=1
-- 2. type='grant', amount=2, balance_after=2

SELECT id, user_id, pathway_type, created_at FROM bmad_sessions WHERE user_id = 'YOUR_USER_ID';
-- Should show 1 session
```

**Backend Logs:**
- Check terminal for any errors
- Should see credit deduction success

---

### Test 3: Session 2 (1 → 0 Credits)

**Action:**
1. Return to dashboard
2. Click "Start New Session" again
3. Begin another session

**Expected:**
- Session starts successfully
- Navigation shows trial complete card
- Message: "Trial Complete - You've used all 2 free sessions"
- Feedback form appears
- "Purchase Credits (Coming Soon)" button shown (disabled)

**Verify in Supabase:**
```sql
SELECT * FROM user_credits WHERE user_id = 'YOUR_USER_ID';
-- Should show: balance=0, total_used=2

SELECT * FROM credit_transactions WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 1;
-- Latest transaction: type='deduct', amount=-1, balance_after=0

SELECT COUNT(*) FROM bmad_sessions WHERE user_id = 'YOUR_USER_ID';
-- Should return: 2
```

---

### Test 4: Feedback Submission

**Action:**
1. In the feedback form that appeared:
   - Select rating: 5 (or any 1-5)
   - Click "Yes, I'd pay"
   - Type feedback: "Great experience! Would love to continue."
   - Click "Submit Feedback"

**Expected:**
- Form submits successfully
- Shows thank you message: "🙏 Thank you for your feedback!"
- Message disappears after 2 seconds

**Verify in Supabase:**
```sql
SELECT * FROM trial_feedback WHERE user_id = 'YOUR_USER_ID';
-- Should show your feedback with:
-- rating=5, would_pay=true, feedback_text='Great experience...'
```

**Or check console logs if table doesn't exist:**
- Terminal should show: "Trial Feedback Submission: { userId, rating, wouldPay, feedback, ... }"

---

### Test 5: Session 3 Attempt (Should Fail)

**Action:**
1. Try to start a 3rd session
2. Click "Start New Session"

**Expected:**
- Session creation FAILS
- Error message appears
- Still shows trial complete UI
- No new session created

**Verify in Supabase:**
```sql
SELECT * FROM user_credits WHERE user_id = 'YOUR_USER_ID';
-- Should STILL show: balance=0, total_used=2 (unchanged)

SELECT COUNT(*) FROM bmad_sessions WHERE user_id = 'YOUR_USER_ID';
-- Should STILL return: 2 (no new session)
```

**Backend Logs:**
- Terminal should show: "INSUFFICIENT_CREDITS" error
- Error details: "Insufficient credits to start a new session"

---

## Test Results Checklist

- [ ] New user receives 2 credits on signup
- [ ] Credit balance shows correctly in navigation
- [ ] Session 1 deducts 1 credit (2 → 1)
- [ ] "Last free session!" warning appears at 1 credit
- [ ] Session 2 deducts 1 credit (1 → 0)
- [ ] Trial complete UI appears at 0 credits
- [ ] Feedback form displays
- [ ] Feedback submits successfully
- [ ] Session 3 attempt fails with INSUFFICIENT_CREDITS
- [ ] All credit_transactions logged correctly
- [ ] No race conditions or duplicate deductions

## Common Issues & Fixes

### Issue: "User doesn't have credits record"
**Fix:** Trigger didn't fire. Manually grant credits:
```sql
SELECT * FROM add_credits_transaction(
  'YOUR_USER_ID'::uuid,
  2,
  'grant',
  NULL,
  'Manual grant for testing'
);
```

### Issue: CreditGuard not showing in navigation
**Fix:** Check:
1. User is logged in (user object exists)
2. Component imported correctly
3. No console errors
4. API endpoint /api/credits/balance returns 200

### Issue: Feedback form not submitting
**Fix:** Check:
1. Console for errors
2. Network tab shows POST to /api/feedback/trial
3. Rating and would_pay are both selected (required)
4. If table missing, check terminal for console.log output

### Issue: Session creates despite 0 credits
**Fix:** Check:
1. Credit check in session-orchestrator.ts (line 76-83)
2. hasCredits() function is imported
3. deductCredit() is called after session creation (line 123)
4. No errors in deduction logic

## Next Steps After Testing

Once all tests pass:

1. **Document any issues found**
2. **Fix any bugs discovered**
3. **Commit changes:**
   ```bash
   git add .
   git commit -m "🚀 MVP: Implement 2-session trial with feedback collection

   - Modified grant_free_credit() to grant 2 credits
   - Added credit checks to session creation
   - Integrated CreditGuard in navigation
   - Created FeedbackForm component
   - Added trial feedback API endpoint
   - Created trial_feedback migration

   Testing: All 5 test scenarios pass"
   ```

4. **Deploy to production:**
   ```bash
   git push origin main
   vercel --prod
   ```

5. **Run migrations on production Supabase**

6. **Test in production with new account**

7. **Set up monitoring queries** (see DEPLOYMENT-CHECKLIST.md)

---

**Testing Time Estimate**: 20-30 minutes for full flow
**Found a bug?** Document it and we'll fix before deployment

# ✅ Ready to Test - 2-Session Trial System

**Status**: All migrations complete, system ready for testing
**Date**: October 15, 2025

---

## Migration Summary - All Complete ✅

| Migration | Status | Description |
|-----------|--------|-------------|
| 000 | ✅ | Extensions enabled (uuid-ossp, vector) |
| 001 | ✅ | BMad Method schema (bmad_sessions, etc.) |
| 002 | ✅ | Conversations & messages |
| 003 | ✅ | User workspace (pre-existing) |
| 004 | ✅ | User workspace fix (pre-existing) |
| 005 | ✅ | **Credit system (2 free sessions)** |
| 006 | ✅ | **Trial feedback collection** |

---

## System Components Ready

### Backend ✅
- `session-orchestrator.ts`: Credit checks integrated
- `credit-manager.ts`: All functions available
- Database triggers: Auto-grant 2 credits on signup

### Frontend ✅
- `CreditGuard` component: Integrated in navigation
- `FeedbackForm` component: Ready for trial feedback
- Credit balance indicator: Shows remaining sessions

### API Endpoints ✅
- `/api/credits/balance`: Get credit info
- `/api/feedback/trial`: Submit feedback

---

## Verify Setup

Run these queries in Supabase Dashboard to confirm everything is ready:

### 1. Check Credit Packages Seeded
```sql
SELECT id, name, credits, price_cents
FROM credit_packages
ORDER BY display_order;
```

**Expected output:**
```
starter      | Starter Pack      | 5  | 1900
professional | Professional Pack | 10 | 3900
business     | Business Pack     | 20 | 7900
```

### 2. Verify Grant Trigger Exists
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_grant_free_credit';
```

**Expected output:**
```
trigger_grant_free_credit | users
```

### 3. Check Grant Function (2 Credits)
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'grant_free_credit';
```

Should return: `grant_free_credit`

---

## Testing Guide

Follow: **TEST-TRIAL-FLOW.md**

### Quick Test Summary

1. **Dev Server**: http://localhost:3002 ✅ (already running)

2. **Create Test Account**:
   - Sign up with new Google account
   - Should auto-receive 2 credits

3. **Session 1**:
   - Start new session
   - Check: Balance = 1 credit
   - See: "Last free session!" warning

4. **Session 2**:
   - Start another session
   - Check: Balance = 0 credits
   - See: Trial complete UI + feedback form

5. **Submit Feedback**:
   - Rate experience (1-5)
   - Select "Would pay" option
   - Add optional text
   - Submit

6. **Session 3 Attempt**:
   - Try to start session
   - Should fail: INSUFFICIENT_CREDITS
   - UI shows trial complete message

---

## Verification Queries During Testing

### Check User Credits
```sql
SELECT user_id, balance, total_granted, total_used
FROM user_credits
WHERE user_id = 'YOUR_USER_ID';
```

### Check Credit Transactions
```sql
SELECT transaction_type, amount, balance_after, description, created_at
FROM credit_transactions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### Check Sessions Created
```sql
SELECT id, pathway_type, status, created_at
FROM bmad_sessions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### Check Feedback Submitted
```sql
SELECT rating, would_pay, feedback_text, submitted_at
FROM trial_feedback
WHERE user_id = 'YOUR_USER_ID';
```

---

## Expected Flow

### New User Signup
```
User signs up
  ↓
grant_free_credit() trigger fires
  ↓
user_credits: balance = 2, total_granted = 2
  ↓
credit_transactions: type='grant', amount=2, balance_after=2
```

### Session Creation (x2)
```
User starts session
  ↓
hasCredits(userId, 1) → true
  ↓
Session created in bmad_sessions
  ↓
deductCredit(userId, sessionId) → success
  ↓
user_credits: balance -= 1
  ↓
credit_transactions: type='deduct', amount=-1
```

### Trial Complete (after 2 sessions)
```
user_credits: balance = 0, total_used = 2
  ↓
CreditGuard shows trial complete card
  ↓
FeedbackForm appears
  ↓
User submits feedback
  ↓
trial_feedback: record created
```

### Session 3 Attempt
```
User tries to start session
  ↓
hasCredits(userId, 1) → false
  ↓
INSUFFICIENT_CREDITS error
  ↓
Session NOT created
  ↓
UI shows trial complete message
```

---

## Success Criteria

- [x] All 7 migrations applied successfully
- [ ] New user receives 2 credits automatically
- [ ] Credit balance shows in navigation
- [ ] Session 1 deducts 1 credit (2→1)
- [ ] "Last session!" warning appears at 1 credit
- [ ] Session 2 deducts 1 credit (1→0)
- [ ] Trial complete UI appears at 0 credits
- [ ] Feedback form displays and submits
- [ ] Session 3 blocked with clear error
- [ ] No race conditions in credit deduction

---

## Files Created/Modified in This Release

### Modified
- `supabase/migrations/005_session_credit_system.sql` - Changed from 1 to 2 credits
- `apps/web/lib/bmad/session-orchestrator.ts` - Added credit checks
- `apps/web/app/components/ui/navigation.tsx` - Integrated CreditGuard

### New
- `supabase/migrations/000_enable_extensions.sql`
- `supabase/migrations/006_trial_feedback.sql`
- `apps/web/app/components/monetization/CreditGuard.tsx`
- `apps/web/app/components/monetization/FeedbackForm.tsx`
- `apps/web/app/api/feedback/trial/route.ts`
- `docs/MVP-TRIAL-IMPLEMENTATION.md`
- `TEST-TRIAL-FLOW.md`
- `DEPLOYMENT-CHECKLIST.md`

---

## Next Steps After Testing

1. **If tests pass**: Commit and deploy to production
2. **If issues found**: Document and fix before deployment
3. **After deployment**: Monitor metrics for 2-4 weeks
4. **Decision point**: Proceed with full monetization based on feedback

---

## Rollback Plan (If Needed)

If critical issues arise:

### Disable Credit Checks (Emergency)
```typescript
// In apps/web/lib/bmad/session-orchestrator.ts
// Comment out lines 75-83 (credit check)
// Comment out lines 122-132 (credit deduction)
```

### Revert to 1 Credit Trial
```sql
-- In Supabase Dashboard
CREATE OR REPLACE FUNCTION grant_free_credit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (user_id, balance, total_granted)
    VALUES (NEW.id, 1, 1);
    -- ... rest of function
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

**Ready to test at**: http://localhost:3002

**Detailed test guide**: TEST-TRIAL-FLOW.md

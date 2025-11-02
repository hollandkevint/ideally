# MVP Trial Implementation - 2 Free Sessions

**Status**: ✅ Complete - Ready for Testing
**Date**: October 15, 2025
**Goal**: Validate product-market fit before monetization investment

## Overview

Implemented a 2-session free trial system to gather user feedback before investing in full monetization infrastructure (Stripe, legal docs, payment flows).

## What Changed

### 1. Database (Migration 005)
**File**: `apps/web/supabase/migrations/005_session_credit_system.sql`

- Changed `grant_free_credit()` function: **1 credit → 2 credits**
- Updated welcome message: "Try 2 free sessions to experience ThinkHaven"
- All credit infrastructure already in place from Epic 4 Phase 1

### 2. Session Creation (Backend)
**File**: `apps/web/lib/bmad/session-orchestrator.ts`

Added credit gating to `createSession()`:
```typescript
// Check if user has credits
const userHasCredits = await hasCredits(config.userId, 1);
if (!userHasCredits) {
  throw new BmadMethodError('INSUFFICIENT_CREDITS', ...);
}

// Deduct credit atomically after session creation
const deductResult = await deductCredit(config.userId, sessionId);
if (!deductResult.success) {
  await BmadDatabase.deleteSession(sessionId); // Rollback
  throw new BmadMethodError('CREDIT_DEDUCTION_FAILED', ...);
}
```

**Error codes**:
- `INSUFFICIENT_CREDITS` - User has 0 credits
- `CREDIT_DEDUCTION_FAILED` - Race condition or database error

### 3. UI Components (Frontend)
**Files**:
- `apps/web/app/components/monetization/CreditGuard.tsx`
- `apps/web/app/components/monetization/FeedbackForm.tsx`

**CreditGuard** shows:
- Credit balance indicator (green/amber dot)
- "Last free session!" warning at 1 credit
- Trial complete card at 0 credits
- Feedback form prompt

**FeedbackForm** collects:
- Rating (1-5): "How valuable was your experience?"
- Would pay (Yes/No): "Would you purchase more sessions?"
- Open feedback: "What would make ThinkHaven more valuable?"

### 4. Feedback API
**File**: `apps/web/app/api/feedback/trial/route.ts`

- POST endpoint for feedback submission
- Authenticated requests only
- Logs to console if table doesn't exist (graceful degradation)
- Stores in `trial_feedback` table when available

### 5. Feedback Database (Optional)
**File**: `apps/web/supabase/migrations/006_trial_feedback.sql`

Optional migration for structured feedback collection:
```sql
CREATE TABLE trial_feedback (
    user_id UUID,
    rating INTEGER (1-5),
    would_pay BOOLEAN,
    feedback_text TEXT,
    user_email TEXT,
    submitted_at TIMESTAMPTZ
);
```

## User Flow

### New User Signup
1. User signs up via Google OAuth
2. `grant_free_credit()` trigger fires → grants **2 credits**
3. Welcome transaction logged: "Welcome! Try 2 free sessions..."

### Session 1
1. User clicks "Start New Session"
2. Backend checks: `hasCredits(userId, 1)` → `true`
3. Session created in database
4. Credit deducted atomically: **2 → 1**
5. UI shows: "1 session remaining" (amber warning)

### Session 2
1. User clicks "Start New Session"
2. Backend checks: `hasCredits(userId, 1)` → `true`
3. Session created in database
4. Credit deducted atomically: **1 → 0**
5. UI shows: Trial complete card

### Trial Complete
1. UI displays:
   - Trial completion message
   - List of features unlocked
   - "Purchase Credits (Coming Soon)" button (disabled)
   - Feedback form prompt

2. User submits feedback:
   - Rating: 1-5 stars
   - Would pay: Yes/No
   - Optional: Open feedback text

3. Feedback stored for analysis

### Session 3 Attempt (No Credits)
1. User tries to start session
2. Backend checks: `hasCredits(userId, 1)` → `false`
3. `createSession()` throws `INSUFFICIENT_CREDITS` error
4. UI shows trial complete message (already visible)

## Integration Points

### Where to Add CreditGuard Component

**Option 1: Navigation Bar** (Recommended)
```tsx
// apps/web/app/components/ui/navigation.tsx
import { CreditGuard } from '@/app/components/monetization/CreditGuard';

<nav>
  <CreditGuard userId={user.id} />
  {/* other nav items */}
</nav>
```

**Option 2: Dashboard**
```tsx
// apps/web/app/dashboard/page.tsx
import { CreditGuard } from '@/app/components/monetization/CreditGuard';

<DashboardLayout>
  <CreditGuard userId={user.id} />
  {/* dashboard content */}
</DashboardLayout>
```

**Option 3: Session Manager**
```tsx
// apps/web/app/components/bmad/SessionManager.tsx
import { CreditGuard } from '@/app/components/monetization/CreditGuard';

<SessionManagerLayout>
  <CreditGuard userId={user.id} onCreditsUpdated={handleCreditsChange} />
  {/* session interface */}
</SessionManagerLayout>
```

### Error Handling in Session Creation

Frontend should catch `INSUFFICIENT_CREDITS` error:
```tsx
try {
  await createSession(config);
} catch (error) {
  if (error.code === 'INSUFFICIENT_CREDITS') {
    // Show trial complete modal
    showTrialCompleteModal();
  } else {
    // Handle other errors
    showErrorMessage(error.message);
  }
}
```

## Deployment Steps

### 1. Run Migrations
```bash
# Apply credit system migration (if not already applied)
npx supabase migration up

# Optional: Apply feedback table migration
# (feedback API will work without it via console.log)
```

### 2. Test Locally
```bash
# Start dev server
npm run dev

# Test flow:
# 1. Create new user account
# 2. Verify 2 credits granted
# 3. Start session #1 → verify 1 credit deducted
# 4. Start session #2 → verify 1 credit deducted
# 5. Verify trial complete UI shows
# 6. Submit feedback
```

### 3. Deploy to Production
```bash
# Deploy to Vercel
vercel --prod

# Verify migrations applied on production database
```

## Metrics to Track

Once deployed, monitor these key metrics:

### Conversion Funnel
1. **Signups** → Users who create accounts
2. **Activation** → Users who start session #1 (should be ~80%+)
3. **Retention** → Users who start session #2 (target: 50%+)
4. **Completion** → Users who finish both sessions (target: 40%+)

### Feedback Metrics
1. **Rating Distribution** → Average rating (target: 4.0+)
2. **Would Pay %** → % answering "Yes" (target: 30%+)
3. **Feedback Themes** → Common requests/concerns

### Decision Criteria
- **Rating ≥ 4.0** + **Would Pay ≥ 30%** = Proceed with monetization
- **Rating < 3.5** or **Would Pay < 20%** = Iterate on product first
- **Rating 3.5-4.0** + **Would Pay 20-30%** = Review feedback, make improvements

## Next Steps After Data Collection

### If Metrics are Strong (proceed to monetization)
1. Complete Epic 4 Phase 2-5 (Stripe, UI, emails)
2. Finalize Terms of Service & Privacy Policy
3. Set pricing based on feedback
4. Launch payment system

### If Metrics are Weak (iterate on product)
1. Analyze feedback themes
2. Prioritize top feature requests
3. Address major pain points
4. Consider extending trial to 3 sessions
5. Re-test with improvements

## Rollback Plan

If issues arise, rollback is simple:

```sql
-- Revert to 1 free credit
UPDATE user_credits SET balance = 1, total_granted = 1 WHERE total_granted = 2;

-- Or disable credit checks entirely (emergency)
-- Comment out hasCredits() check in session-orchestrator.ts
```

## Files Changed

- ✅ `apps/web/supabase/migrations/005_session_credit_system.sql` (modified)
- ✅ `apps/web/lib/bmad/session-orchestrator.ts` (modified)
- ✅ `apps/web/app/components/monetization/CreditGuard.tsx` (new)
- ✅ `apps/web/app/components/monetization/FeedbackForm.tsx` (new)
- ✅ `apps/web/app/api/feedback/trial/route.ts` (new)
- ✅ `apps/web/supabase/migrations/006_trial_feedback.sql` (new, optional)

## Testing Checklist

- [ ] New user receives 2 credits on signup
- [ ] Credit balance displays correctly in UI
- [ ] Session #1 deducts 1 credit (2 → 1)
- [ ] "Last free session!" warning appears at 1 credit
- [ ] Session #2 deducts 1 credit (1 → 0)
- [ ] Trial complete UI appears at 0 credits
- [ ] Feedback form displays after trial
- [ ] Feedback submission works
- [ ] User cannot start session #3 (INSUFFICIENT_CREDITS error)
- [ ] Error handling shows appropriate message

---

**Implementation Time**: 2 hours
**Testing Estimate**: 1 hour
**Total**: 3 hours to validate product-market fit before $10K+ monetization investment

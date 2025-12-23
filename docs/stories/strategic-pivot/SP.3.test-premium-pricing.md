# SP.3: Test Premium Pricing Model ($99 One-Time)

## Status
**Ready** - Critical for unit economics

## Priority
**P0 - Immediate** - Must validate before scale

## Context
The critical analysis identified pricing as a key issue. $20-30/session is "no-man's land" - too expensive to be impulse, too cheap to be trusted.

**The Insight:**
> "The middle is death. Either be the best free tool or the trusted premium option."

**Why $99 One-Time:**
- High enough to signal quality
- Low enough to be self-serve (no sales call needed)
- One-time removes subscription fatigue
- Clear value exchange: $99 for validated idea + professional report

## Story
**As a** founder considering ThinkHaven,
**I want** clear, premium pricing that reflects the value,
**so that** I trust this is a serious tool for serious decisions.

## Acceptance Criteria

1. **Single Premium Offer**: $99 one-time for complete Idea Validation
2. **Clear Value Stack**: List everything included (30-min session, 10-question analysis, PDF report, etc.)
3. **Money-Back Guarantee**: "Not useful? Full refund, no questions asked"
4. **Free Assessment Hook**: Free 5-min assessment, then $99 for full validation
5. **Payment Flow**: Stripe checkout before starting validation pathway
6. **A/B Test Ready**: Can test $99 vs. $149 vs. $79

## Pricing Strategy

### Current Model (Problems)
```
2 free credits → $20-30/session → ??? subscription
```
- Unclear value per credit
- Low price = low perceived value
- Subscription creates ongoing obligation anxiety

### New Model (Premium One-Time)
```
Free Assessment → $99 Idea Validation → Upsell to Bundle
```
- Clear outcome for clear price
- Premium price = premium perception
- One-time = low commitment anxiety
- Upsell path for repeat users

### Price Ladder
| Offer | Price | Includes |
|-------|-------|----------|
| Free Assessment | $0 | 5-min quiz, score, areas to improve |
| Idea Validation | $99 | 30-min session, full analysis, PDF report |
| Validation Bundle | $249 | 3 validations (for iterating/pivoting) |
| Team Package | $499 | 5 validations + shared workspace |

## Tasks / Subtasks

- [ ] Task 1: Implement Stripe One-Time Payment
  - [ ] Subtask 1.1: Create $99 Stripe product
  - [ ] Subtask 1.2: Build checkout page with value stack
  - [ ] Subtask 1.3: Implement payment success → unlock validation
  - [ ] Subtask 1.4: Add receipt email

- [ ] Task 2: Design Value Stack Page
  - [ ] Subtask 2.1: List all inclusions (30 min, 10 questions, PDF, etc.)
  - [ ] Subtask 2.2: Add comparison to alternatives ("vs. $15K consulting")
  - [ ] Subtask 2.3: Include money-back guarantee
  - [ ] Subtask 2.4: Add testimonials/social proof (when available)

- [ ] Task 3: Update User Flow
  - [ ] Subtask 3.1: Free assessment → results → CTA to buy validation
  - [ ] Subtask 3.2: Paid users go directly to validation pathway
  - [ ] Subtask 3.3: Remove credit system references
  - [ ] Subtask 3.4: Update dashboard for paid vs. free users

- [ ] Task 4: Add Money-Back Guarantee
  - [ ] Subtask 4.1: Add guarantee badge to checkout
  - [ ] Subtask 4.2: Create refund request flow
  - [ ] Subtask 4.3: Track refund rate as success metric

- [ ] Task 5: Set Up A/B Testing
  - [ ] Subtask 5.1: Create price variants ($79, $99, $149)
  - [ ] Subtask 5.2: Implement random assignment
  - [ ] Subtask 5.3: Track conversion rate per price point
  - [ ] Subtask 5.4: Dashboard to monitor test results

## Success Metrics
- Conversion rate > 5% (assessment → paid)
- Refund rate < 10%
- Revenue per user > $90 (accounting for refunds)
- Optimal price point identified within 100 purchases

## Dev Notes

### Why One-Time > Subscription (For Now)
1. Lower barrier to first purchase
2. Forces us to deliver value in ONE session
3. Easier to explain ("$99 for validation" vs. "$20/session, buy credits")
4. Can add subscription later for power users

### Stripe Implementation
- Use Stripe Checkout for simplicity
- Store purchase in `payment_history` table
- Grant access via `user_purchases` or similar
- No credits system needed for MVP pricing test

### Migration from Credit System
- Keep credit infrastructure for future use
- New users see $99 offer
- Existing credit users can still use credits
- Evaluate credit system sunset after pricing test

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Too expensive | Money-back guarantee + A/B test lower prices |
| Not enough value | Focus on killer PDF output (SP.1) |
| Comparison shopping | Clear differentiation vs. ChatGPT/consulting |
| No repeat business | Bundle offer for multiple validations |

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-16 | 1.0 | Created from critical analysis recommendations | Strategic Review |

# Consumer Validation Test Plan

*Created: November 27, 2025*
*Product: ThinkHaven - AI-powered Strategic Thinking Workspace*

## Overview

This document outlines the validation testing strategy to confirm product-market fit and gather consumer feedback before full market launch.

---

## Phase 1: Pre-Launch Validation (Current - Week 1)

### 1.1 Technical Validation

| Test | Success Criteria | Status |
|------|------------------|--------|
| Stripe checkout flow | Complete purchase without errors | ⏳ Pending |
| Webhook processing | Credits granted within 30 seconds | ⏳ Pending |
| Message limit enforcement | 20-message limit works correctly | ✅ Tested |
| Credit balance display | Accurate across all pages | ⏳ Pending |
| Payment confirmation email | Sent within 5 minutes | ⏳ Pending |

### 1.2 User Journey Validation

**Critical Path Testing:**
1. Landing page → Assessment → Free trial signup
2. Free trial → 2 sessions used → Credit exhaustion → Pricing page
3. Pricing page → Checkout → Payment → Credit grant → New session

**Test Users:**
- Internal team: 5 test purchases (each tier)
- Friends & family: 10 beta users
- Early adopters from waitlist: 20 users

---

## Phase 2: Soft Launch (Week 2-3)

### 2.1 Target Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Assessment completion rate** | >60% | Analytics: started vs completed |
| **Free trial → Signup** | >40% | Users who create account after assessment |
| **Session completion rate** | >70% | Sessions with >5 messages |
| **Trial → Paid conversion** | >5% | Users who purchase within 14 days |
| **Average session rating** | >4.0/5 | Post-session feedback |

### 2.2 Feedback Collection Points

1. **Post-Assessment Survey**
   - "How valuable was this assessment?" (1-5)
   - "What strategic challenge are you facing?"
   - "Would you recommend this to a colleague?"

2. **Post-Session Feedback**
   - "Did Mary help clarify your thinking?" (1-5)
   - "What could be improved?"
   - "Would you pay for more sessions?"

3. **Post-Purchase Survey**
   - "What convinced you to purchase?"
   - "What tier did you choose and why?"
   - "What features would you like to see?"

### 2.3 User Segments to Test

| Segment | Description | Target N | Key Questions |
|---------|-------------|----------|---------------|
| **Product Managers** | Tech company PMs | 30 | Feature prioritization use case |
| **Startup Founders** | Early-stage entrepreneurs | 20 | Business model validation |
| **Consultants** | Strategy/management consultants | 15 | Client deliverable creation |
| **Healthcare Professionals** | Clinical informaticists | 10 | Domain-specific value |

---

## Phase 3: Pricing Validation (Week 3-4)

### 3.1 Price Sensitivity Testing

**Current Pricing:**
- Starter: $10 (5 sessions) - $2/session
- Professional: $30 (10 sessions) - $3/session
- Business: $100 (20 sessions) - $5/session

**Validation Questions:**
1. Is $2-5/session perceived as fair value?
2. Which tier converts best?
3. Do users want subscription option?
4. Is bulk discount structure appealing?

### 3.2 A/B Test Ideas (Future)

| Test | Variant A | Variant B | Hypothesis |
|------|-----------|-----------|------------|
| Pricing display | Show total | Show per-session | Per-session increases perceived value |
| CTA text | "Get Credits" | "Start Coaching" | Coaching language converts better |
| Free trial | 2 sessions | 3 sessions | More sessions = higher conversion |

---

## Phase 4: Feature Validation (Week 4-6)

### 4.1 Core Feature Usage Tracking

| Feature | Expected Usage | Track |
|---------|----------------|-------|
| **BMad Method Pathways** | 80% use at least one | Which pathway is most popular |
| **Canvas Workspace** | 50% view canvas | Diagram creation rate |
| **PDF Export** | 30% export at least once | Export format preference |
| **Message Search** | 20% use search | Search query patterns |

### 4.2 Feature Request Tracking

Categories to monitor:
- Integration requests (Notion, Slack, etc.)
- AI capability requests (more analysis types)
- Export format requests (PPT, CSV)
- Collaboration requests (team features)

---

## Phase 5: Retention & Engagement (Week 6+)

### 5.1 Cohort Analysis

| Metric | Week 1 | Week 2 | Week 4 | Week 8 |
|--------|--------|--------|--------|--------|
| **Active users** | Baseline | Target: 70% | Target: 50% | Target: 30% |
| **Sessions/user** | 2.0 | 1.5 | 1.0 | 0.5 |
| **Credit usage** | 40% | 60% | 80% | 90% |

### 5.2 Churn Indicators

Watch for:
- Users who don't complete first session
- Users who hit message limit and don't return
- Users who visit pricing but don't purchase
- Users who purchase but don't use credits

---

## Validation Success Criteria

### Minimum Viable Validation (MVV)

| Criteria | Threshold | Result |
|----------|-----------|--------|
| **100 free trial users** | 100 users complete assessment + create account | ⏳ |
| **20 paying customers** | $200+ revenue in first month | ⏳ |
| **NPS > 30** | Net Promoter Score from feedback surveys | ⏳ |
| **<5% refund rate** | Refund requests / total purchases | ⏳ |
| **>3.5 avg session rating** | Post-session feedback score | ⏳ |

### Product-Market Fit Indicators

✅ **Strong Signal:**
- Users ask for more features
- Organic referrals occur
- Users return after free trial ends
- Low support ticket volume

⚠️ **Weak Signal:**
- High bounce rate on pricing page
- Users don't complete sessions
- Many "how do I..." support tickets
- Refund requests mention confusion

---

## Data Collection Tools

### Analytics Setup

| Tool | Purpose | Priority |
|------|---------|----------|
| **Vercel Analytics** | Page views, performance | ✅ Configured |
| **Supabase Logs** | API usage, errors | ✅ Configured |
| **Stripe Dashboard** | Revenue, conversion | ✅ Configured |
| **PostHog/Mixpanel** | User journeys, funnels | ⏳ To setup |

### Feedback Tools

| Tool | Purpose | Priority |
|------|---------|----------|
| **In-app feedback form** | Post-session ratings | ✅ Implemented |
| **Email surveys** | Detailed feedback | ⏳ To setup |
| **User interviews** | Qualitative insights | ⏳ Schedule |
| **Hotjar/FullStory** | Session recordings | ⏳ Optional |

---

## Validation Timeline

| Week | Focus | Key Activities |
|------|-------|----------------|
| **Week 1** | Technical | Stripe testing, internal QA |
| **Week 2** | Soft launch | Friends/family beta, collect feedback |
| **Week 3** | Expand | Waitlist activation, pricing feedback |
| **Week 4** | Analyze | Review metrics, iterate |
| **Week 5-6** | Optimize | A/B tests, feature refinement |
| **Week 7+** | Scale | Marketing, broader launch |

---

## Action Items

### Immediate (This Week)
- [ ] Complete Stripe live mode testing
- [ ] Set up PostHog or Mixpanel
- [ ] Create post-session feedback form
- [ ] Prepare beta user invitation emails
- [ ] Document known issues/limitations

### Next Week
- [ ] Invite first 20 beta users
- [ ] Monitor conversion funnel
- [ ] Conduct 3-5 user interviews
- [ ] Review first payment transactions
- [ ] Iterate based on feedback

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Payment failures** | Monitor Stripe dashboard, test all card types |
| **Message limit frustration** | Clear UI warnings, easy upgrade path |
| **AI response quality** | Feedback collection, prompt tuning |
| **Pricing pushback** | Gather feedback, prepare discount codes |
| **Technical issues** | Error monitoring, rapid response plan |

---

*This plan will be updated based on validation results.*

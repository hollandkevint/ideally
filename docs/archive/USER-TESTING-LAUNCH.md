# User Testing Launch Plan
**Target Launch**: Next Week
**Goal**: Get 10-15 trial users from personal network
**Timeline**: 2 weeks of testing → decision on monetization

---

## Pre-Launch Checklist

### Database Setup
- [ ] Run migration 005 on production Supabase
  - Grants 2 free credits per user
  - Creates credit_transactions table
  - Sets up atomic deduct_credit_transaction()
- [ ] Run migration 006 on production Supabase
  - Creates trial_feedback table
- [ ] Verify with VERIFY-SETUP.sql queries
- [ ] Test with one account: signup → 2 sessions → feedback

### Code Deployment
- [ ] Verify CreditGuard shows in navigation
- [ ] Verify session creation checks credits
- [ ] Verify feedback form appears after trial
- [ ] Test complete flow locally
- [ ] Deploy to production
- [ ] Smoke test in production

### Monitoring Setup
- [ ] Bookmark Supabase dashboard
- [ ] Save monitoring SQL queries (below)
- [ ] Set daily reminder to check metrics
- [ ] Create spreadsheet for tracking users

---

## Recruitment Messaging

### LinkedIn Post (Personal Network)

```
I'm building ThinkHaven - an AI strategic thinking coach that helps you turn ideas into actionable frameworks.

After months of development, I'm ready for real user feedback. I'm looking for 10 people to try the first version (completely free):

✅ 2 free strategic coaching sessions
✅ AI-powered BMad Method frameworks
✅ Visual canvas workspace
✅ Export to PDF/Markdown

Perfect for:
• Product managers refining features
• Entrepreneurs validating business ideas
• Strategists analyzing market opportunities

What I'm asking:
• ~30-45 min of your time (2 sessions)
• Honest feedback on what works/doesn't
• Your thoughts on whether you'd pay for this

Interested? Comment below or DM me and I'll send you early access.

#ProductManagement #StrategicThinking #AI
```

### Slack Message (HealthTechNerds)

```
Hey everyone! 👋

I've been building an AI strategic thinking tool specifically designed for healthcare/tech product work. It uses the BMad Method to help you systematically work through:
- New product ideas
- Business model validation
- Feature prioritization
- Market positioning

I'm looking for 5-10 people to try the first version. You get:
• 2 free AI coaching sessions (no credit card)
• Professional output documents (PDF/Markdown)
• Visual workspace with canvas

In exchange: honest feedback on whether this would be useful in your work.

Sessions take 20-30 minutes each. Interested? Drop a 🙋 and I'll DM you access.
```

### Slack Message (Lenny's Community)

```
Building in public moment: I've spent the last few months creating an AI strategic thinking coach for PMs.

Looking for 5-10 product people to try the beta (2 free sessions, no strings):

What it does:
• Guides you through structured strategic frameworks
• Helps you think through new features, business models, or market positioning
• Outputs professional briefs you can share with stakeholders

What I need:
• 30-45 min of your time
• Brutal honesty about what's valuable (or not)
• Insights on pricing (would you pay? how much?)

Think "ChatGPT meets strategic thinking frameworks" - curious if this resonates with how you work.

Interested? Comment and I'll send access details 👇
```

### DM Follow-up Template

```
Thanks for your interest in trying ThinkHaven!

Here's what to expect:

🔗 Link: https://www.thinkhaven.co

📝 Sign up with Google (fastest option)

🎁 You'll automatically get 2 free sessions

⏱️ Each session takes 20-30 minutes

📊 You'll get professional outputs you can export

After you've tried both sessions, a feedback form will pop up - that's where I really need your honest thoughts:
• What worked / what didn't?
• Would you pay for this?
• What would make it more valuable?

No pressure to love it - I'm learning just as much from "this doesn't work for me" as from "this is great."

Questions before you dive in? Let me know!

Thanks again,
Kevin
```

---

## User Onboarding Guide

Share this with users who sign up:

```markdown
# Welcome to ThinkHaven Early Access 🎉

Thanks for helping me test ThinkHaven! Here's how to get the most out of your trial:

## What You Have
- **2 free strategic coaching sessions** (automatically added)
- **Full access** to all features
- **Professional exports** (PDF & Markdown)

## How It Works

### Session 1: Pick Your Pathway
1. Click "Start New Session"
2. Choose a pathway:
   - **New Idea**: Validate a business concept
   - **Feature Input**: Refine a product feature
   - **Business Model**: Analyze revenue strategy

3. Mary (AI coach) will guide you through ~20-30 minutes of structured thinking
4. You'll get professional documents at the end

### Session 2: Try Another Pathway
Use your second session to explore a different area or go deeper on your idea.

## Tips for Best Results
- Have a specific idea/feature/problem in mind
- Set aside uninterrupted time
- Be honest in your responses (Mary adapts to your input)
- Export your results when done

## After Your Trial
You'll see a feedback form - this is super valuable for me:
- Rate your experience
- Tell me if you'd pay for more sessions
- Share what would make it better

## Questions?
Just reply to this message. I'm monitoring closely during testing.

Thanks for being an early tester!
Kevin
```

---

## Daily Monitoring (5 min/day)

### SQL Queries to Run

**Daily User Activity**
```sql
-- New signups today
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users,
  SUM(balance) as total_credits_available,
  SUM(total_used) as credits_used_today
FROM user_credits
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY DATE(created_at);

-- Active sessions today
SELECT
  pathway_type,
  COUNT(*) as sessions_started,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60), 1) as avg_minutes
FROM bmad_sessions
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY pathway_type;
```

**Trial Progress**
```sql
-- User credit status
SELECT
  balance,
  COUNT(*) as users
FROM user_credits
GROUP BY balance
ORDER BY balance DESC;

-- Should show:
-- balance=2: Users who haven't started
-- balance=1: Users who did 1 session
-- balance=0: Users who completed trial
```

**Feedback Collection**
```sql
-- Feedback submissions
SELECT
  rating,
  would_pay,
  COUNT(*) as responses,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct
FROM trial_feedback
GROUP BY rating, would_pay
ORDER BY rating DESC;

-- Recent feedback text
SELECT
  rating,
  would_pay,
  LEFT(feedback_text, 100) as feedback_preview,
  submitted_at
FROM trial_feedback
ORDER BY submitted_at DESC
LIMIT 10;
```

### Tracking Spreadsheet Template

Create a Google Sheet with these columns:

| Name | Source | Signup Date | Session 1 | Session 2 | Feedback | Would Pay | Rating | Notes |
|------|--------|-------------|-----------|-----------|----------|-----------|--------|-------|
| John Doe | LinkedIn | 2025-10-20 | ✅ | ✅ | ✅ | Yes | 5 | Loved the canvas |
| Jane Smith | Slack-HTN | 2025-10-21 | ✅ | ⏳ | ⏳ | - | - | Waiting for session 2 |

---

## Week 1 Schedule

### Monday (Launch Day)
- [ ] Final production test
- [ ] Post LinkedIn message
- [ ] Post in HealthTechNerds Slack
- [ ] Post in Lenny's Slack
- [ ] Personal DMs to 3-5 close connections
- **Target**: 5 signups

### Tuesday-Wednesday
- [ ] Check for signups
- [ ] Send onboarding DMs
- [ ] Monitor for any bugs/issues
- [ ] Follow up with people who showed interest
- **Target**: 3-5 more signups

### Thursday-Friday
- [ ] Check session completion rates
- [ ] Reach out to inactive users
- [ ] Start collecting early feedback
- [ ] Answer any questions
- **Target**: First feedback submissions

### Weekend
- [ ] Review all feedback so far
- [ ] Note any common issues
- [ ] Plan fixes for Week 2 if needed

---

## Week 2 Schedule

### Monday
- [ ] Quick bug fixes if needed
- [ ] Second recruitment wave (if needed)
- [ ] Personal outreach to target users

### Tuesday-Thursday
- [ ] Monitor daily metrics
- [ ] Collect feedback
- [ ] Have 1-on-1 calls with interested users
- **Target**: 10-15 total completed trials

### Friday
- [ ] Final push for feedback submissions
- [ ] Compile all data
- [ ] Start analysis

### Weekend
- [ ] Analyze all feedback
- [ ] Calculate key metrics
- [ ] Make monetization decision
- [ ] Plan next steps

---

## Key Metrics to Track

### Acquisition
- [ ] 10-15 signups (from 30-40 reach-outs = ~30% conversion)
- [ ] At least 3 from each channel

### Activation
- [ ] 80%+ complete first session
- [ ] 70%+ complete both sessions
- [ ] <5 min average time to first session

### Engagement
- [ ] 20+ min average session time
- [ ] Pathway variety (not all using same pathway)
- [ ] Export feature usage

### Feedback
- [ ] 80%+ feedback form completion
- [ ] 50%+ say "Yes, I'd pay"
- [ ] Average rating > 4.0
- [ ] Actionable insights on pricing

---

## Success Criteria

**Minimum Viable Success**:
- 10 completed trials
- 5+ willing to pay
- Average rating 4.0+
- Clear understanding of value

**Strong Signal**:
- 15+ completed trials
- 70%+ willing to pay
- Average rating 4.5+
- Multiple users ask "when can I buy?"

**Go/No-Go Decision**:
- **GO**: 50%+ willing to pay → Build Stripe (IMPLEMENTATION-ROADMAP.md)
- **ITERATE**: 30-50% willing to pay → Fix top issues, test again
- **PIVOT**: <30% willing to pay → Rethink value proposition

---

## Common Issues & Responses

**"I don't have time right now"**
→ "No problem! Keep the link - it's there when you need strategic thinking help. The 2 free sessions don't expire."

**"What's this going to cost later?"**
→ "Still figuring that out - that's why your feedback is valuable! Probably $20-50 for a pack of sessions. What seems fair to you?"

**"Can I share this with my team?"**
→ "Absolutely! Each person gets 2 free sessions. Just have them sign up with Google."

**"I'm getting an error"**
→ Get screenshot, check Supabase logs, fix ASAP, follow up personally

**"This is amazing, when can I buy more?"**
→ "That's exactly what I needed to hear! I'll have pricing live in 2-3 weeks. Want to be first to know?"

---

## Post-Testing Actions

### If Feedback is Strong (50%+ would pay)
1. Thank all testers
2. Share high-level results
3. Build Stripe integration (IMPLEMENTATION-ROADMAP.md)
4. Offer early-bird pricing to testers
5. Launch publicly

### If Feedback is Mixed (30-50% would pay)
1. Analyze "why not" feedback
2. Identify top 3 issues
3. Fix those issues
4. Run another small cohort
5. Decide again

### If Feedback is Weak (<30% would pay)
1. Deep dive sessions with users
2. Understand the disconnect
3. Consider major changes
4. Don't build payments yet
5. May need to pivot

---

## Next Immediate Actions

### This Week (Before Launch)
1. [ ] Run migrations 005 & 006 on production Supabase
2. [ ] Test complete flow with test account
3. [ ] Deploy latest code to production
4. [ ] Create tracking spreadsheet
5. [ ] Draft all recruitment messages
6. [ ] Schedule LinkedIn post

### Launch Day (Next Monday)
1. [ ] Final smoke test
2. [ ] Post to all channels
3. [ ] Send personal DMs
4. [ ] Monitor signups
5. [ ] Be ready to help users

---

**Remember**: This is learning, not selling. Embrace negative feedback - it's more valuable than polite praise. You're trying to figure out if this is worth building, not convince people it is.

Good luck! 🚀

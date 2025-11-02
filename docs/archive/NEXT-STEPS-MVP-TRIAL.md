# Next Steps: 2-Session Trial MVP with Sharing & Feedback

**Status**: Ready for Implementation
**Created**: 2025-10-16
**Goal**: Launch 2-session trial to gather feedback before full monetization

---

## Current State: What's Done ✅

### Phase 1: Foundation (30% Complete)

**Database** (Migration 005 & 006):
- ✅ `user_credits` table with balance tracking
- ✅ `credit_transactions` with complete audit trail
- ✅ `credit_packages` with 3 pricing tiers seeded
- ✅ `payment_history` for Stripe integration
- ✅ `trial_feedback` for collecting user feedback
- ✅ `grant_free_credit()` function - **Modified to grant 2 credits**
- ✅ `deduct_credit_transaction()` - Atomic with row locking
- ✅ `add_credits_transaction()` - Purchase/grant handling

**Backend Services**:
- ✅ `credit-manager.ts` (370 lines) - All credit operations
- ✅ `stripe-service.ts` (340 lines) - Stripe integration (ready, not active)
- ✅ `session-orchestrator.ts` - Credit checks integrated (lines 76-133)

**API Endpoints**:
- ✅ `/api/credits/balance` - Get user balance
- ✅ `/api/feedback/trial` - Collect trial feedback

**UI Components**:
- ✅ `CreditGuard.tsx` - Shows balance, trial complete state, feedback form
- ✅ `FeedbackForm.tsx` - Collects rating, willingness to pay, feedback text

**Testing Guide**:
- ✅ `TEST-TRIAL-FLOW.md` - Complete 5-test scenario guide
- ✅ `VERIFY-SETUP.sql` - Database verification queries

---

## Phase 2: Session Sharing (NEW) - 3-4 hours

### Why Session Sharing?

**MVP Goal**: Get feedback from potential customers before building payment system

**Strategy**:
- Users complete 2 free sessions
- Users can share session outputs with colleagues/friends
- Shared links generate interest & word-of-mouth
- Track sharing patterns to understand viral potential
- Collect feedback from both original users AND recipients

### 2.1 Database Schema for Sharing

**File**: `apps/web/supabase/migrations/007_session_sharing.sql`

```sql
-- Migration: Session Sharing for MVP Trial
-- Created: 2025-10-16
-- Description: Enable users to share session outputs publicly

-- ============================================================================
-- TABLES
-- ============================================================================

-- Session Shares: Public links to session outputs
CREATE TABLE session_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES bmad_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    share_token TEXT UNIQUE NOT NULL, -- Random URL-safe token
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    view_count INTEGER DEFAULT 0 NOT NULL,
    shared_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ, -- Optional expiration
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Share Views: Track who views shared sessions
CREATE TABLE session_share_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    share_id UUID REFERENCES session_shares(id) ON DELETE CASCADE NOT NULL,
    viewer_email TEXT, -- Optional - if viewer provides email
    viewer_ip TEXT,
    viewer_user_agent TEXT,
    referred_from TEXT, -- Referrer URL
    viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Share Feedback: Collect feedback from share viewers
CREATE TABLE session_share_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    share_id UUID REFERENCES session_shares(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    would_try BOOLEAN NOT NULL, -- Would you try ThinkHaven?
    feedback_text TEXT,
    viewer_email TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_session_shares_session_id ON session_shares(session_id);
CREATE INDEX idx_session_shares_user_id ON session_shares(user_id);
CREATE INDEX idx_session_shares_token ON session_shares(share_token);
CREATE INDEX idx_session_shares_active ON session_shares(is_active);

CREATE INDEX idx_session_share_views_share_id ON session_share_views(share_id);
CREATE INDEX idx_session_share_views_viewed_at ON session_share_views(viewed_at DESC);

CREATE INDEX idx_session_share_feedback_share_id ON session_share_feedback(share_id);
CREATE INDEX idx_session_share_feedback_would_try ON session_share_feedback(would_try);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE session_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_share_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_share_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own shares
CREATE POLICY "Users can view their own shares" ON session_shares
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create shares for their sessions
CREATE POLICY "Users can create shares for their sessions" ON session_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own shares
CREATE POLICY "Users can update their own shares" ON session_shares
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares" ON session_shares
    FOR DELETE USING (auth.uid() = user_id);

-- Anyone can view active shares by token (public access)
CREATE POLICY "Public can view active shares by token" ON session_shares
    FOR SELECT USING (is_active = TRUE);

-- Anyone can record share views (for analytics)
CREATE POLICY "Anyone can record share views" ON session_share_views
    FOR INSERT WITH CHECK (true);

-- Anyone can submit share feedback
CREATE POLICY "Anyone can submit share feedback" ON session_share_feedback
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 12-character URL-safe token
        token := encode(gen_random_bytes(9), 'base64');
        token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');

        -- Check if token already exists
        SELECT EXISTS(SELECT 1 FROM session_shares WHERE share_token = token) INTO exists;

        EXIT WHEN NOT exists;
    END LOOP;

    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment view count
CREATE OR REPLACE FUNCTION increment_share_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE session_shares
    SET view_count = view_count + 1
    WHERE id = NEW.share_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Increment view count when view is recorded
CREATE TRIGGER trigger_increment_share_views
    AFTER INSERT ON session_share_views
    FOR EACH ROW
    EXECUTE FUNCTION increment_share_view_count();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE session_shares IS 'Public share links for BMad session outputs';
COMMENT ON TABLE session_share_views IS 'Analytics tracking for share views';
COMMENT ON TABLE session_share_feedback IS 'Feedback from people who view shared sessions';
COMMENT ON COLUMN session_shares.share_token IS 'URL-safe random token for public access';
COMMENT ON COLUMN session_shares.view_count IS 'Number of times this share has been viewed';
```

### 2.2 Share Service

**File**: `apps/web/lib/sharing/share-service.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

export interface SessionShare {
  id: string;
  session_id: string;
  user_id: string;
  share_token: string;
  title: string;
  description: string | null;
  is_active: boolean;
  view_count: number;
  shared_at: string;
  expires_at: string | null;
}

export interface ShareView {
  viewer_email?: string;
  viewer_ip?: string;
  viewer_user_agent?: string;
  referred_from?: string;
}

/**
 * Create a public share link for a session
 */
export async function createSessionShare(options: {
  sessionId: string;
  userId: string;
  title: string;
  description?: string;
  expiresInDays?: number;
}): Promise<SessionShare | null> {
  const supabase = await createClient();

  // Generate share token
  const { data: tokenData } = await supabase.rpc('generate_share_token');

  if (!tokenData) {
    console.error('Failed to generate share token');
    return null;
  }

  const expiresAt = options.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('session_shares')
    .insert({
      session_id: options.sessionId,
      user_id: options.userId,
      share_token: tokenData,
      title: options.title,
      description: options.description || null,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session share:', error);
    return null;
  }

  return data;
}

/**
 * Get session share by token (public access)
 */
export async function getSessionShareByToken(token: string): Promise<SessionShare | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('session_shares')
    .select('*')
    .eq('share_token', token)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching session share:', error);
    return null;
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  return data;
}

/**
 * Get session data for share (outputs only, no sensitive data)
 */
export async function getSharedSessionData(sessionId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bmad_sessions')
    .select('id, pathway_type, outputs, created_at')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching shared session data:', error);
    return null;
  }

  return data;
}

/**
 * Record a view of a shared session
 */
export async function recordShareView(shareId: string, viewData: ShareView): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('session_share_views')
    .insert({
      share_id: shareId,
      viewer_email: viewData.viewer_email || null,
      viewer_ip: viewData.viewer_ip || null,
      viewer_user_agent: viewData.viewer_user_agent || null,
      referred_from: viewData.referred_from || null,
    });
}

/**
 * Submit feedback from share viewer
 */
export async function submitShareFeedback(options: {
  shareId: string;
  rating?: number;
  wouldTry: boolean;
  feedbackText?: string;
  viewerEmail?: string;
}): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('session_share_feedback')
    .insert({
      share_id: options.shareId,
      rating: options.rating || null,
      would_try: options.wouldTry,
      feedback_text: options.feedbackText || null,
      viewer_email: options.viewerEmail || null,
      submitted_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error submitting share feedback:', error);
    return false;
  }

  return true;
}

/**
 * Get user's shares with analytics
 */
export async function getUserShares(userId: string): Promise<SessionShare[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('session_shares')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user shares:', error);
    return [];
  }

  return data || [];
}

/**
 * Deactivate a share
 */
export async function deactivateShare(shareId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('session_shares')
    .update({ is_active: false })
    .eq('id', shareId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deactivating share:', error);
    return false;
  }

  return true;
}
```

### 2.3 Share API Endpoints

**File**: `apps/web/app/api/share/create/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSessionShare } from '@/lib/sharing/share-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, title, description } = await request.json();

    if (!sessionId || !title) {
      return NextResponse.json(
        { error: 'Session ID and title required' },
        { status: 400 }
      );
    }

    // Verify user owns the session
    const { data: session } = await supabase
      .from('bmad_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Create share
    const share = await createSessionShare({
      sessionId,
      userId: user.id,
      title,
      description,
      expiresInDays: 90, // Shares expire after 90 days
    });

    if (!share) {
      return NextResponse.json(
        { error: 'Failed to create share' },
        { status: 500 }
      );
    }

    // Return share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${share.share_token}`;

    return NextResponse.json({
      share,
      shareUrl,
    });

  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File**: `apps/web/app/api/share/[token]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionShareByToken, getSharedSessionData, recordShareView } from '@/lib/sharing/share-service';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    // Get share info
    const share = await getSessionShareByToken(token);

    if (!share) {
      return NextResponse.json(
        { error: 'Share not found or expired' },
        { status: 404 }
      );
    }

    // Get session data (outputs only)
    const sessionData = await getSharedSessionData(share.session_id);

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session data not found' },
        { status: 404 }
      );
    }

    // Record view (async, don't wait)
    const headersList = await headers();
    recordShareView(share.id, {
      viewer_ip: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined,
      viewer_user_agent: headersList.get('user-agent') || undefined,
      referred_from: headersList.get('referer') || undefined,
    }).catch(err => console.error('Error recording view:', err));

    return NextResponse.json({
      share: {
        id: share.id,
        title: share.title,
        description: share.description,
        shared_at: share.shared_at,
        view_count: share.view_count,
      },
      session: {
        pathway_type: sessionData.pathway_type,
        outputs: sessionData.outputs,
        created_at: sessionData.created_at,
      },
    });

  } catch (error) {
    console.error('Error fetching share:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2.4 Share UI Components

**File**: `apps/web/app/components/sharing/ShareButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  sessionId: string;
  sessionTitle: string;
  sessionDescription?: string;
}

export function ShareButton({ sessionId, sessionTitle, sessionDescription }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setSharing(true);

    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          title: sessionTitle,
          description: sessionDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share');
      }

      const { shareUrl } = await response.json();
      setShareUrl(shareUrl);

    } catch (error) {
      console.error('Error creating share:', error);
      alert('Failed to create share link');
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (shareUrl) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm"
        />
        <Button
          onClick={handleCopy}
          variant="outline"
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleShare}
      disabled={sharing}
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      {sharing ? 'Creating link...' : 'Share This Session'}
    </Button>
  );
}
```

**File**: `apps/web/app/share/[token]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Eye } from 'lucide-react';

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShare() {
      try {
        const response = await fetch(`/api/share/${token}`);

        if (!response.ok) {
          throw new Error('Share not found');
        }

        const data = await response.json();
        setShareData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    fetchShare();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Share Not Found</h1>
          <p className="text-gray-600">This link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{shareData.share.title}</h1>
              {shareData.share.description && (
                <p className="text-gray-600 mb-4">{shareData.share.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Shared {new Date(shareData.share.shared_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {shareData.share.view_count} views
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                <div className="text-xs text-blue-600">Created with</div>
                <div className="font-bold">ThinkHaven</div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Outputs */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Session Results</h2>
          {/* Render session outputs based on pathway type */}
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
            {JSON.stringify(shareData.session.outputs, null, 2)}
          </pre>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Want to create your own?</h2>
          <p className="mb-6 text-blue-100">
            Start your strategic thinking journey with 2 free sessions
          </p>
          <a
            href="/"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Try ThinkHaven Free
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 3: Testing & Feedback Strategy

### 3.1 Testing with Real Users (1 week)

**Target**: 20-30 trial users

**Recruitment Channels**:
1. Personal network (LinkedIn connections)
2. Product Hunt "upcoming" page
3. Reddit r/Entrepreneur, r/startups (carefully)
4. Healthcare/strategy Slack communities
5. Direct outreach to target personas

**What to Track**:
```sql
-- User adoption metrics
SELECT
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) FILTER (WHERE total_used > 0) as activated_users,
  COUNT(*) FILTER (WHERE total_used >= 2) as completed_trial,
  AVG(balance) as avg_remaining_credits
FROM user_credits;

-- Session completion rate
SELECT
  pathway_type,
  COUNT(*) as sessions_started,
  COUNT(*) FILTER (WHERE status = 'completed') as sessions_completed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*), 2) as completion_rate
FROM bmad_sessions
GROUP BY pathway_type;

-- Feedback analysis
SELECT
  rating,
  would_pay,
  COUNT(*) as responses,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM trial_feedback
GROUP BY rating, would_pay
ORDER BY rating DESC, would_pay DESC;

-- Sharing engagement
SELECT
  COUNT(DISTINCT s.user_id) as users_who_shared,
  COUNT(*) as total_shares,
  SUM(s.view_count) as total_views,
  ROUND(AVG(s.view_count), 2) as avg_views_per_share,
  COUNT(sf.id) as feedback_from_shares
FROM session_shares s
LEFT JOIN session_share_feedback sf ON s.id = sf.share_id
WHERE s.is_active = TRUE;
```

### 3.2 Feedback Collection Points

**Point 1: After Session 1**
- Simple NPS: "How likely are you to recommend ThinkHaven?" (0-10)
- Inline in UI, non-blocking

**Point 2: After Session 2 (Trial Complete)**
- Full feedback form (already implemented)
- Rating 1-5
- Would you pay?
- Open feedback

**Point 3: Share Viewers**
- Different form for people who view shares
- "Would you try ThinkHaven?" (Yes/No)
- What interested you? (Open text)
- Email (optional, for waitlist)

### 3.3 Success Criteria (MVP Trial)

**Minimum Viable Success**:
- [ ] 15+ trial users complete both sessions (75% completion rate)
- [ ] 8+ users (>50%) say "Yes, I'd pay"
- [ ] 4+ users share sessions with others
- [ ] Share links generate 20+ views
- [ ] 2+ share viewers sign up for trial

**Strong Signal**:
- [ ] 20+ trial completions
- [ ] 70%+ willing to pay
- [ ] Average rating > 4.0
- [ ] 10+ shares with 50+ views total
- [ ] 5+ conversions from shares

**Clear Feedback on Pricing**:
- Specific feedback about acceptable price points
- Understanding of value delivered
- Willingness to pay insights

---

## Phase 4: Deployment Plan

### 4.1 Pre-Deployment Checklist

- [ ] Run migration 007 (session sharing) on Supabase production
- [ ] Verify migration 005 grants 2 credits (not 1)
- [ ] Verify migration 006 (trial_feedback) is applied
- [ ] Test share creation locally
- [ ] Test share viewing locally
- [ ] Verify all RLS policies work correctly
- [ ] Check credit deduction is atomic (no race conditions)
- [ ] Test feedback form submission

### 4.2 Deployment Steps

```bash
# 1. Commit all changes
git add .
git commit -m "🚀 MVP: 2-session trial with sharing & feedback

- Grant 2 free credits on signup
- Session sharing with public links
- Share analytics and viewer feedback
- Trial feedback collection
- Credit guard in navigation
- Complete testing suite

Testing: All flows verified locally
Ready for: User feedback collection"

# 2. Push to production
git push origin main

# 3. Verify deployment
vercel --prod

# 4. Run migrations on production Supabase
# - Open Supabase dashboard
# - SQL Editor → New Query
# - Paste migration 007 content
# - Execute

# 5. Verify database state (run VERIFY-SETUP.sql queries)

# 6. Test in production with test account
# - Sign up new user
# - Verify 2 credits granted
# - Create session 1
# - Create session 2
# - Verify feedback form appears
# - Create share link
# - View share link (incognito)
# - Submit share feedback
```

### 4.3 Post-Deployment Monitoring

**Day 1-3**:
- Check Supabase logs for errors
- Monitor credit_transactions table
- Verify trigger firing correctly
- Watch for any race conditions
- Check share link generation

**Week 1**:
- Daily check of user signups
- Monitor trial completion rates
- Review feedback submissions
- Track share creation and views
- Note any error patterns

**Analytics Dashboard** (Manual SQL queries):
```sql
-- Daily snapshot
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users,
  SUM(balance) as total_credits_remaining,
  SUM(total_used) as total_credits_used
FROM user_credits
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;

-- Feedback summary
SELECT
  rating,
  COUNT(*) as count,
  ROUND(AVG(CASE WHEN would_pay THEN 1 ELSE 0 END) * 100, 2) as pct_would_pay
FROM trial_feedback
GROUP BY rating
ORDER BY rating DESC;

-- Share virality
SELECT
  DATE(shared_at) as date,
  COUNT(*) as shares_created,
  SUM(view_count) as total_views
FROM session_shares
GROUP BY DATE(shared_at)
ORDER BY date DESC;
```

---

## Phase 5: Learning & Decision Making

### 5.1 What to Learn

**From Trial Users**:
- Which pathways are most valuable?
- What session length feels right?
- What features drive sharing?
- What's the perceived value?
- What price seems fair?

**From Share Viewers**:
- Do session outputs demonstrate value?
- What drives trial signup from shares?
- What messaging resonates?
- What questions do they have?

**From Usage Patterns**:
- Session completion rates
- Time spent per session
- Pathway preferences
- Share patterns
- Return visitor behavior

### 5.2 Decision Tree (After 20 Users)

**If 70%+ would pay**:
→ Proceed with Stripe integration (IMPLEMENTATION-ROADMAP.md Phase 2-5)
→ Set pricing based on feedback
→ Launch monetization within 2 weeks

**If 40-70% would pay**:
→ Analyze feedback for objections
→ Consider product improvements first
→ Test different messaging
→ Run second cohort with improvements

**If <40% would pay**:
→ Deep dive into "why not" feedback
→ Consider pivot or major changes
→ May need to rethink value proposition
→ Don't build payment until value is clear

### 5.3 Pricing Decisions

Based on feedback, determine:
- Credit package sizes (5, 10, 20?)
- Price points ($19, $39, $79 or different?)
- Whether to offer subscriptions
- Enterprise/team pricing
- Free tier size (keep at 2 or adjust?)

---

## Timeline

**Week 1: Build**
- Day 1: Implement sharing backend (migration 007, share-service.ts)
- Day 2: Build sharing UI (ShareButton, share page)
- Day 3: Integration testing, deployment

**Week 2: User Testing**
- Day 1-2: Recruit first 10 users
- Day 3-7: Monitor usage, collect feedback
- Daily: Answer questions, fix bugs

**Week 3: Analysis & Decision**
- Day 1-2: Analyze all feedback and metrics
- Day 3: Make go/no-go decision on monetization
- Day 4-5: Plan next steps based on learnings
- Day 6-7: Implement quick wins from feedback

**Week 4+: Either:**
- **Path A**: Build Stripe integration (if feedback is strong)
- **Path B**: Iterate on product (if feedback needs improvement)

---

## Files to Create

### Backend:
- [ ] `apps/web/supabase/migrations/007_session_sharing.sql`
- [ ] `apps/web/lib/sharing/share-service.ts`

### API:
- [ ] `apps/web/app/api/share/create/route.ts`
- [ ] `apps/web/app/api/share/[token]/route.ts`

### UI:
- [ ] `apps/web/app/components/sharing/ShareButton.tsx`
- [ ] `apps/web/app/share/[token]/page.tsx`

### Integration:
- [ ] Add `<ShareButton />` to session completion UI
- [ ] Add share links to user's session list

---

## Success Metrics Summary

**Acquisition**:
- 20-30 trial users in 2 weeks
- 5+ users from share links

**Activation**:
- 75%+ complete both sessions
- Average session time > 15 minutes

**Engagement**:
- 30%+ share their sessions
- Share links get 3+ views average

**Feedback Quality**:
- 80%+ feedback form completion
- Actionable insights on pricing
- Clear value proposition validation

**Revenue Signal**:
- 50%+ say "Yes, I'd pay"
- Specific price expectations emerge
- Clear target customer profile

---

## Next Immediate Action

1. Review this plan with stakeholders
2. Decide: Build sharing first, or test without sharing?
3. If sharing: Start with migration 007
4. If no sharing: Deploy current state and recruit users
5. Set target date for first 5 users

---

**Questions to Answer**:
1. Do you want to build sharing before user testing? (Adds 2-3 days)
2. Who are the first 10 users you'll invite?
3. What channels will you use for recruitment?
4. When do you want to start user testing?

**Recommended**: Build sharing - it's low effort, high learning potential

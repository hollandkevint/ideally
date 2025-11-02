-- Migration: Trial Feedback Collection
-- MVP Testing Phase - Collect feedback before monetization
-- Created: 2025-10-15
-- Description: Optional table for collecting user feedback after trial completion

-- ============================================================================
-- TABLES
-- ============================================================================

-- Trial Feedback: Store user feedback from trial users
CREATE TABLE trial_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    would_pay BOOLEAN NOT NULL,
    feedback_text TEXT,
    user_email TEXT,
    submitted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_trial_feedback_user_id ON trial_feedback(user_id);
CREATE INDEX idx_trial_feedback_rating ON trial_feedback(rating);
CREATE INDEX idx_trial_feedback_would_pay ON trial_feedback(would_pay);
CREATE INDEX idx_trial_feedback_submitted_at ON trial_feedback(submitted_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE trial_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON trial_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own feedback (one-time submission)
CREATE POLICY "Users can submit their own feedback" ON trial_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE trial_feedback IS 'Collects user feedback after trial completion for MVP validation';
COMMENT ON COLUMN trial_feedback.rating IS 'User rating from 1-5 (1=not valuable, 5=extremely valuable)';
COMMENT ON COLUMN trial_feedback.would_pay IS 'Whether user would purchase more sessions';
COMMENT ON COLUMN trial_feedback.feedback_text IS 'Open-ended feedback from user';

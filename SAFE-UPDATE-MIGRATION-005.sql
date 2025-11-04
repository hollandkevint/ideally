-- Safe Update for Migration 005
-- Only updates the parts that need to change (1 credit → 2 credits)
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Check current state
-- ============================================================================
-- Run this first to see what you have:
SELECT 'Current grant_free_credit function:' as check_type;
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'grant_free_credit';

-- ============================================================================
-- STEP 2: Update the grant_free_credit function (1 credit → 2 credits)
-- ============================================================================

CREATE OR REPLACE FUNCTION grant_free_credit()
RETURNS TRIGGER AS $$
BEGIN
    -- Grant 2 free credits to new users (changed from 1)
    INSERT INTO user_credits (user_id, balance, total_granted)
    VALUES (NEW.id, 2, 2)  -- Changed from 1, 1
    ON CONFLICT (user_id) DO NOTHING;

    -- Log the grant transaction
    INSERT INTO credit_transactions (
        user_id,
        transaction_type,
        amount,
        balance_after,
        description,
        metadata
    )
    VALUES (
        NEW.id,
        'grant',
        2,  -- Changed from 1
        2,  -- Changed from 1
        'Welcome! Try 2 free sessions to experience ThinkHaven',  -- Updated message
        jsonb_build_object('source', 'signup_grant', 'trigger', 'user_signup')
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Verify the update
-- ============================================================================
SELECT 'Updated function:' as check_type;
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'grant_free_credit';

-- Test with a new user signup (optional - only if you want to test)
-- SELECT grant_free_credit();

-- ============================================================================
-- DONE!
-- ============================================================================
-- The function is now updated. New users will get 2 credits instead of 1.
-- Existing users keep their current balance (no changes to existing data).

-- Check Migration Status
-- Run this to see what's already in your production database

-- ============================================================================
-- Check which tables exist
-- ============================================================================
SELECT
    'Tables that exist:' as check_type,
    string_agg(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'user_credits',
    'credit_transactions',
    'credit_packages',
    'payment_history',
    'trial_feedback',
    'bmad_sessions',
    'conversations',
    'messages'
);

-- ============================================================================
-- Check credit balances
-- ============================================================================
SELECT
    'User credit balances:' as check_type,
    balance,
    total_granted,
    COUNT(*) as user_count
FROM user_credits
GROUP BY balance, total_granted
ORDER BY balance DESC;

-- ============================================================================
-- Check if grant_free_credit function exists and what it does
-- ============================================================================
SELECT
    'grant_free_credit function exists:' as check_type,
    CASE
        WHEN pg_get_functiondef(oid) LIKE '%balance, 2, 2%' THEN '✅ Already grants 2 credits'
        WHEN pg_get_functiondef(oid) LIKE '%balance, 1, 1%' THEN '⚠️  Still grants 1 credit - needs update'
        ELSE '❓ Unknown version'
    END as status
FROM pg_proc
WHERE proname = 'grant_free_credit';

-- ============================================================================
-- Check if deduct_credit_transaction function exists
-- ============================================================================
SELECT
    'deduct_credit_transaction exists:' as check_type,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ Function exists'
        ELSE '❌ Function missing'
    END as status
FROM pg_proc
WHERE proname = 'deduct_credit_transaction';

-- ============================================================================
-- Check if trial_feedback table exists
-- ============================================================================
SELECT
    'trial_feedback table:' as check_type,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'trial_feedback'
        ) THEN '✅ Table exists'
        ELSE '❌ Table missing - run migration 006'
    END as status;

-- ============================================================================
-- Summary
-- ============================================================================
SELECT '
=================================================================
MIGRATION STATUS SUMMARY
=================================================================

Run the queries above to see:
1. Which tables exist
2. Current credit balances
3. Whether grant_free_credit needs updating
4. Whether trial_feedback table exists

Based on the results:
- If grant_free_credit shows "⚠️ Still grants 1 credit": Run SAFE-UPDATE-MIGRATION-005.sql
- If trial_feedback shows "❌ Table missing": Run migration 006 completely
- If everything shows "✅": You''re ready to go!

' as instructions;

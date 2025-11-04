-- ============================================================================
-- VERIFY CURRENT DATABASE STATE
-- Run this to see EXACTLY what you have
-- ============================================================================

-- 1. Check trial_feedback table structure
SELECT
    'trial_feedback table columns:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'trial_feedback'
ORDER BY ordinal_position;

-- 2. Check if trial_feedback policies exist
SELECT
    'trial_feedback RLS policies:' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'trial_feedback';

-- 3. Check current grant_free_credit function code
SELECT
    'grant_free_credit function - checking credit amount:' as info,
    CASE
        WHEN pg_get_functiondef(oid) LIKE '%VALUES (NEW.id, 2, 2)%' THEN '✅ Grants 2 credits'
        WHEN pg_get_functiondef(oid) LIKE '%VALUES (NEW.id, 1, 1)%' THEN '⚠️  Only grants 1 credit - NEEDS UPDATE'
        ELSE '❓ Unknown version'
    END as status,
    CASE
        WHEN pg_get_functiondef(oid) LIKE '%Try 2 free sessions%' THEN '✅ Message says 2 sessions'
        WHEN pg_get_functiondef(oid) LIKE '%free session%' THEN '⚠️  Message still says 1 session'
        ELSE '❓ Unknown message'
    END as message_status
FROM pg_proc
WHERE proname = 'grant_free_credit';

-- 4. Check actual credit grants
SELECT
    'Recent credit grants:' as info,
    amount,
    description,
    COUNT(*) as count,
    MAX(created_at) as most_recent
FROM credit_transactions
WHERE transaction_type = 'grant'
GROUP BY amount, description
ORDER BY most_recent DESC;

-- 5. Summary
SELECT '
============================================================
SUMMARY
============================================================
' as summary;

-- Final verdict
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_proc
            WHERE proname = 'grant_free_credit'
            AND pg_get_functiondef(oid) LIKE '%VALUES (NEW.id, 2, 2)%'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'trial_feedback'
        ) THEN '✅ READY TO GO! Both migrations are applied correctly.'
        WHEN EXISTS (
            SELECT 1 FROM pg_proc
            WHERE proname = 'grant_free_credit'
            AND pg_get_functiondef(oid) LIKE '%VALUES (NEW.id, 1, 1)%'
        ) THEN '⚠️  NEEDS UPDATE: Run SAFE-UPDATE-MIGRATION-005.sql to change 1 credit → 2 credits'
        ELSE '❌ PROBLEM: Something is misconfigured'
    END as final_status;

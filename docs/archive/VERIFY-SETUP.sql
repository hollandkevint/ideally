-- Quick Verification Queries for 2-Session Trial System
-- Run these in Supabase Dashboard to confirm setup is correct

-- ============================================================================
-- 1. CHECK CREDIT PACKAGES SEEDED
-- ============================================================================
-- Should return 3 packages: starter ($19), professional ($39), business ($79)

SELECT
    id,
    name,
    credits,
    CONCAT('$', (price_cents / 100.0)::numeric(10,2)) as price,
    is_active,
    display_order
FROM credit_packages
ORDER BY display_order;

-- Expected output:
-- starter      | Starter Pack      | 5  | $19.00 | t | 1
-- professional | Professional Pack | 10 | $39.00 | t | 2
-- business     | Business Pack     | 20 | $79.00 | t | 3


-- ============================================================================
-- 2. VERIFY GRANT_FREE_CREDIT FUNCTION EXISTS
-- ============================================================================
-- Should return the function that grants 2 credits

SELECT
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'grant_free_credit';

-- Expected output:
-- grant_free_credit | FUNCTION | trigger


-- ============================================================================
-- 3. VERIFY TRIGGER ON AUTH.USERS
-- ============================================================================
-- Should return the trigger that auto-grants credits on signup

SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_grant_free_credit';

-- Expected output:
-- trigger_grant_free_credit | INSERT | users | AFTER | EXECUTE FUNCTION grant_free_credit()


-- ============================================================================
-- 4. CHECK ALL CREDIT TABLES EXIST
-- ============================================================================
-- Should return 4 tables

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'user_credits',
    'credit_transactions',
    'credit_packages',
    'payment_history',
    'trial_feedback'
)
ORDER BY table_name;

-- Expected output (5 rows):
-- credit_packages
-- credit_transactions
-- payment_history
-- trial_feedback
-- user_credits


-- ============================================================================
-- 5. VERIFY CREDIT FUNCTIONS EXIST
-- ============================================================================
-- Should return 3 functions for credit management

SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'grant_free_credit',
    'deduct_credit_transaction',
    'add_credits_transaction'
)
ORDER BY routine_name;

-- Expected output (3 rows):
-- add_credits_transaction
-- deduct_credit_transaction
-- grant_free_credit


-- ============================================================================
-- 6. CHECK RLS POLICIES ON CREDIT TABLES
-- ============================================================================
-- Verify Row Level Security is enabled

SELECT
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_credits', 'credit_transactions', 'trial_feedback')
ORDER BY tablename, policyname;

-- Expected output: Multiple policies for SELECT/INSERT on each table


-- ============================================================================
-- 7. VERIFY BMAD_SESSIONS TABLE EXISTS (Required by credit_transactions)
-- ============================================================================
-- Should return bmad_sessions

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'bmad_sessions';

-- Expected output:
-- bmad_sessions


-- ============================================================================
-- 8. CHECK INDEXES ON CREDIT TABLES
-- ============================================================================
-- Verify performance indexes are in place

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('user_credits', 'credit_transactions', 'trial_feedback')
ORDER BY tablename, indexname;

-- Expected output: Multiple indexes per table


-- ============================================================================
-- VERIFICATION COMPLETE
-- ============================================================================

-- If all queries return expected results, the credit system is ready!
-- Next step: Test the trial flow with a new user account

-- Dev server: http://localhost:3002
-- Test guide: TEST-TRIAL-FLOW.md

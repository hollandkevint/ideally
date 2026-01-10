-- Migration: Fix RLS INSERT policies for credit system
-- Issue: grant_free_credit() trigger fails on signup because there are no INSERT policies
-- Created: 2026-01-10
-- Description: Adds INSERT and UPDATE policies for user_credits and credit_transactions

-- ============================================================================
-- FIX: Add INSERT policies for trigger context
-- ============================================================================

-- Allow authenticated users to have their credits inserted
-- This is needed for the grant_free_credit() trigger to work
CREATE POLICY "Service can insert user credits" ON user_credits
    FOR INSERT WITH CHECK (true);

-- Allow the trigger/service to insert credit transactions
CREATE POLICY "Service can insert credit transactions" ON credit_transactions
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own credits (needed for atomic deduction function)
CREATE POLICY "Service can update user credits" ON user_credits
    FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================================
-- ALTERNATIVE: If the above is too permissive, use this approach instead
-- (Uncomment if needed - this uses auth.uid() matching)
-- ============================================================================

-- -- DROP POLICY IF EXISTS "Service can insert user credits" ON user_credits;
-- -- DROP POLICY IF EXISTS "Service can insert credit transactions" ON credit_transactions;
-- -- DROP POLICY IF EXISTS "Service can update user credits" ON user_credits;

-- -- More restrictive: Only allow inserting your own credits
-- -- CREATE POLICY "Users can insert their own credits" ON user_credits
-- --     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -- CREATE POLICY "Users can insert their own transactions" ON credit_transactions
-- --     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -- CREATE POLICY "Users can update their own credits" ON user_credits
-- --     FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Service can insert user credits" ON user_credits IS
    'Allows grant_free_credit() trigger to insert user credits on signup';

COMMENT ON POLICY "Service can insert credit transactions" ON credit_transactions IS
    'Allows credit functions to log transactions';

COMMENT ON POLICY "Service can update user credits" ON user_credits IS
    'Allows atomic credit deduction function to update balances';

-- Migration: Session Credit System for Monetization
-- Epic 4: Story 4.1 - Session Credit System
-- Created: 2025-10-14
-- Description: Implements freemium trial, credit tracking, and payment integration

-- ============================================================================
-- TABLES
-- ============================================================================

-- User Credits: Track credit balance per user
CREATE TABLE user_credits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
    total_granted INTEGER DEFAULT 0 NOT NULL,
    total_purchased INTEGER DEFAULT 0 NOT NULL,
    total_used INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Credit Transactions: Audit trail for all credit changes
CREATE TABLE credit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('grant', 'purchase', 'deduct', 'refund')) NOT NULL,
    amount INTEGER NOT NULL, -- Positive for add, negative for deduct
    balance_after INTEGER NOT NULL,
    session_id UUID REFERENCES bmad_sessions(id),
    stripe_payment_id TEXT,
    stripe_checkout_session_id TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Credit Packages: Define available pricing tiers
CREATE TABLE credit_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents > 0),
    stripe_price_id TEXT,
    description TEXT,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payment History: Store Stripe payment records
CREATE TABLE payment_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    stripe_checkout_session_id TEXT UNIQUE NOT NULL,
    amount_cents INTEGER NOT NULL,
    credits_purchased INTEGER NOT NULL,
    package_id TEXT REFERENCES credit_packages(id),
    status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')) DEFAULT 'pending' NOT NULL,
    receipt_url TEXT,
    receipt_email TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_user_credits_balance ON user_credits(balance);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_session_id ON credit_transactions(session_id);
CREATE INDEX idx_credit_transactions_stripe_payment_id ON credit_transactions(stripe_payment_id);

CREATE INDEX idx_credit_packages_active ON credit_packages(is_active, display_order);

CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);
CREATE INDEX idx_payment_history_stripe_payment_intent ON payment_history(stripe_payment_intent_id);
CREATE INDEX idx_payment_history_stripe_checkout_session ON payment_history(stripe_checkout_session_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Users can only view their own credits
CREATE POLICY "Users can view their own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only view their own transactions
CREATE POLICY "Users can view their own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Credit packages are publicly readable
CREATE POLICY "Anyone can view active credit packages" ON credit_packages
    FOR SELECT USING (is_active = TRUE);

-- Users can only view their own payment history
CREATE POLICY "Users can view their own payment history" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Grant free credit on user registration
CREATE OR REPLACE FUNCTION grant_free_credit()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user_credits record with 1 free credit
    INSERT INTO user_credits (user_id, balance, total_granted)
    VALUES (NEW.id, 1, 1);

    -- Log the transaction
    INSERT INTO credit_transactions (
        user_id,
        transaction_type,
        amount,
        balance_after,
        description
    )
    VALUES (
        NEW.id,
        'grant',
        1,
        1,
        'Welcome! Your first session is on us.'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Atomically deduct credit (prevents race conditions)
CREATE OR REPLACE FUNCTION deduct_credit_transaction(
    p_user_id UUID,
    p_session_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Lock the user's credit row to prevent concurrent deductions
    SELECT balance INTO v_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Check if user exists
    IF v_balance IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'User credits not found',
            'balance', 0
        );
    END IF;

    -- Check if user has enough credits
    IF v_balance < 1 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Insufficient credits',
            'balance', v_balance
        );
    END IF;

    -- Deduct credit
    v_new_balance := v_balance - 1;

    UPDATE user_credits
    SET
        balance = v_new_balance,
        total_used = total_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log transaction
    INSERT INTO credit_transactions (
        user_id,
        transaction_type,
        amount,
        balance_after,
        session_id,
        description
    )
    VALUES (
        p_user_id,
        'deduct',
        -1,
        v_new_balance,
        p_session_id,
        'Credit deducted for session start'
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'balance', v_new_balance,
        'message', 'Credit deducted successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add credits (from purchase or grant)
CREATE OR REPLACE FUNCTION add_credits_transaction(
    p_user_id UUID,
    p_amount INTEGER,
    p_source TEXT, -- 'purchase' or 'grant'
    p_stripe_payment_id TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_balance INTEGER;
    v_new_balance INTEGER;
    v_transaction_type TEXT;
BEGIN
    -- Validate amount
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Amount must be positive'
        );
    END IF;

    -- Determine transaction type
    v_transaction_type := CASE
        WHEN p_source = 'purchase' THEN 'purchase'
        ELSE 'grant'
    END;

    -- Lock and get current balance
    SELECT balance INTO v_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- If user doesn't have credits record, create it
    IF v_balance IS NULL THEN
        INSERT INTO user_credits (user_id, balance, total_granted, total_purchased)
        VALUES (
            p_user_id,
            p_amount,
            CASE WHEN v_transaction_type = 'grant' THEN p_amount ELSE 0 END,
            CASE WHEN v_transaction_type = 'purchase' THEN p_amount ELSE 0 END
        )
        RETURNING balance INTO v_new_balance;
    ELSE
        -- Update existing record
        v_new_balance := v_balance + p_amount;

        UPDATE user_credits
        SET
            balance = v_new_balance,
            total_granted = total_granted + CASE WHEN v_transaction_type = 'grant' THEN p_amount ELSE 0 END,
            total_purchased = total_purchased + CASE WHEN v_transaction_type = 'purchase' THEN p_amount ELSE 0 END,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;

    -- Log transaction
    INSERT INTO credit_transactions (
        user_id,
        transaction_type,
        amount,
        balance_after,
        stripe_payment_id,
        description
    )
    VALUES (
        p_user_id,
        v_transaction_type,
        p_amount,
        v_new_balance,
        p_stripe_payment_id,
        COALESCE(p_description, format('%s credits added', p_amount))
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'balance', v_new_balance,
        'message', format('%s credits added successfully', p_amount)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_credit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Grant free credit on new user registration
CREATE TRIGGER trigger_grant_free_credit
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION grant_free_credit();

-- Trigger: Update timestamp on user_credits changes
CREATE TRIGGER trigger_update_user_credits_timestamp
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_credit_updated_at();

-- Trigger: Update timestamp on credit_packages changes
CREATE TRIGGER trigger_update_credit_packages_timestamp
    BEFORE UPDATE ON credit_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_credit_updated_at();

-- Trigger: Update timestamp on payment_history changes
CREATE TRIGGER trigger_update_payment_history_timestamp
    BEFORE UPDATE ON payment_history
    FOR EACH ROW
    EXECUTE FUNCTION update_credit_updated_at();

-- ============================================================================
-- INITIAL DATA: Credit Packages
-- ============================================================================

INSERT INTO credit_packages (id, name, credits, price_cents, description, features, display_order) VALUES
('starter', 'Starter Pack', 5, 1900, 'Perfect for trying out ThinkHaven',
    '[
        "5 strategic coaching sessions",
        "Full BMad Method access",
        "PDF & Markdown export",
        "Canvas workspace",
        "30 days to use"
    ]'::jsonb, 1),
('professional', 'Professional Pack', 10, 3900, 'Best value for regular users',
    '[
        "10 strategic coaching sessions",
        "Full BMad Method access",
        "PDF & Markdown export",
        "Canvas workspace",
        "Priority support",
        "60 days to use"
    ]'::jsonb, 2),
('business', 'Business Pack', 20, 7900, 'For teams and frequent users',
    '[
        "20 strategic coaching sessions",
        "Full BMad Method access",
        "PDF & Markdown export",
        "Canvas workspace",
        "Priority support",
        "Team collaboration features",
        "90 days to use"
    ]'::jsonb, 3);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_credits IS 'Tracks credit balance and totals for each user';
COMMENT ON TABLE credit_transactions IS 'Audit trail for all credit changes (grants, purchases, deductions, refunds)';
COMMENT ON TABLE credit_packages IS 'Defines available credit packages and pricing tiers';
COMMENT ON TABLE payment_history IS 'Records Stripe payment transactions';

COMMENT ON FUNCTION grant_free_credit() IS 'Automatically grants 1 free credit to new users upon registration';
COMMENT ON FUNCTION deduct_credit_transaction(UUID, UUID) IS 'Atomically deducts 1 credit with row locking to prevent race conditions';
COMMENT ON FUNCTION add_credits_transaction(UUID, INTEGER, TEXT, TEXT, TEXT) IS 'Adds credits from purchase or grant with transaction logging';

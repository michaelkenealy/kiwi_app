-- ============================================
-- MIGRATION: Add Send/Receive Money Features
-- Adds support for peer-to-peer payments
-- ============================================

-- STEP 1: Add transaction_type column to transactions table
-- This distinguishes between merchant payments and P2P transfers
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'payment'
CHECK (transaction_type IN ('payment', 'send', 'receive'));

COMMENT ON COLUMN transactions.transaction_type IS
'Type of transaction: payment (user→merchant), send (user→user debit), receive (user→user credit)';

-- STEP 2: Add recipient_user_id for P2P transfers
-- When transaction_type = 'send' or 'receive', this tracks the other user
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN transactions.recipient_user_id IS
'For P2P transfers: the user receiving money. NULL for merchant payments.';

-- STEP 3: Create user_settings table for configurable limits
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_limit NUMERIC(10, 2) DEFAULT 500.00 NOT NULL CHECK (transaction_limit >= 0),
    daily_limit NUMERIC(10, 2) DEFAULT 1000.00 NOT NULL CHECK (daily_limit >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

COMMENT ON TABLE user_settings IS 'User-configurable limits for P2P transfers';
COMMENT ON COLUMN user_settings.transaction_limit IS 'Maximum amount per single P2P transaction (default $500)';
COMMENT ON COLUMN user_settings.daily_limit IS 'Maximum total P2P sends per day (default $1000)';

-- STEP 4: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON transactions(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- STEP 5: Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- STEP 6: RLS Policies for user_settings
-- Users can only see and modify their own settings
DROP POLICY IF EXISTS "user_settings_select_own" ON user_settings;
CREATE POLICY "user_settings_select_own" ON user_settings
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "user_settings_insert_own" ON user_settings;
CREATE POLICY "user_settings_insert_own" ON user_settings
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "user_settings_update_own" ON user_settings;
CREATE POLICY "user_settings_update_own" ON user_settings
    FOR UPDATE TO authenticated
    USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

-- STEP 7: Create default settings for existing users
-- This ensures all current users get the default limits
INSERT INTO user_settings (user_id, transaction_limit, daily_limit)
SELECT id, 500.00, 1000.00
FROM users
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;

-- STEP 8: Create function to auto-create settings for new users
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id, transaction_limit, daily_limit)
    VALUES (NEW.id, 500.00, 1000.00)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 9: Create trigger to auto-create settings on user registration
DROP TRIGGER IF EXISTS trigger_create_user_settings ON users;
CREATE TRIGGER trigger_create_user_settings
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- STEP 10: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON user_settings;
CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
AND column_name IN ('transaction_type', 'recipient_user_id');

-- Check that user_settings table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'user_settings'
) as user_settings_exists;

-- Check that all users have default settings
SELECT
    u.id as user_id,
    u.name as user_name,
    COALESCE(us.transaction_limit, 0) as transaction_limit,
    COALESCE(us.daily_limit, 0) as daily_limit
FROM users u
LEFT JOIN user_settings us ON us.user_id = u.id;

-- Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_settings'
ORDER BY policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ P2P features added successfully!';
    RAISE NOTICE '📊 Transaction types: payment, send, receive';
    RAISE NOTICE '💰 Default limits: $500/transaction, $1000/day';
    RAISE NOTICE '⚙️ Users can change limits in settings';
END $$;

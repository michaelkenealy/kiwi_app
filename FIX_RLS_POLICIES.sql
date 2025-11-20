-- ============================================
-- FIX: Row Level Security Policies
-- Run this in Supabase SQL Editor to fix registration errors
-- ============================================

-- DROP existing problematic policies
DROP POLICY IF EXISTS "Vendors can insert own data" ON vendors;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- ============================================
-- VENDORS TABLE - Fixed INSERT Policy
-- ============================================

-- Allow authenticated users to insert vendor records
-- The auth_id will match their session, so we check it's their own ID
CREATE POLICY "Vendors can insert own data" ON vendors
    FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

-- Alternative: More permissive (allows any authenticated user to create vendor)
-- Uncomment this if the above doesn't work:
-- CREATE POLICY "Allow vendor registration" ON vendors
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (true);

-- ============================================
-- USERS TABLE - Fixed INSERT Policy
-- ============================================

-- Allow authenticated users to insert user records
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

-- Alternative: More permissive (allows any authenticated user to create user)
-- Uncomment this if the above doesn't work:
-- CREATE POLICY "Allow user registration" ON users
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (true);

-- ============================================
-- TILLS TABLE - Make sure INSERT works for new vendors
-- ============================================

DROP POLICY IF EXISTS "Vendors can manage own tills" ON tills;

-- Separate policies for different operations
CREATE POLICY "Vendors can insert own tills" ON tills
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = tills.vendor_id
            AND vendors.auth_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can select own tills" ON tills
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = tills.vendor_id
            AND vendors.auth_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can update own tills" ON tills
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = tills.vendor_id
            AND vendors.auth_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can delete own tills" ON tills
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = tills.vendor_id
            AND vendors.auth_id = auth.uid()
        )
    );

-- ============================================
-- VERIFY POLICIES
-- ============================================

-- Run this to check your policies are set correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'vendors', 'tills')
ORDER BY tablename, policyname;

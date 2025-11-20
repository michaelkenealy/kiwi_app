-- ============================================
-- SIMPLE FIX: Permissive RLS Policies for Development
-- Run this in Supabase SQL Editor if the other fix doesn't work
-- ============================================

-- This is a simpler, more permissive approach for development/testing
-- For production, you'll want more strict policies

-- ============================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================

-- Users table
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Vendors table
DROP POLICY IF EXISTS "Vendors can view own data" ON vendors;
DROP POLICY IF EXISTS "Vendors can update own data" ON vendors;
DROP POLICY IF EXISTS "Vendors can insert own data" ON vendors;
DROP POLICY IF EXISTS "Users can view vendor public info" ON vendors;
DROP POLICY IF EXISTS "Allow vendor registration" ON vendors;

-- Tills table
DROP POLICY IF EXISTS "Vendors can manage own tills" ON tills;
DROP POLICY IF EXISTS "Vendors can insert own tills" ON tills;
DROP POLICY IF EXISTS "Vendors can select own tills" ON tills;
DROP POLICY IF EXISTS "Vendors can update own tills" ON tills;
DROP POLICY IF EXISTS "Vendors can delete own tills" ON tills;

-- ============================================
-- 2. CREATE PERMISSIVE POLICIES
-- ============================================

-- USERS TABLE
CREATE POLICY "authenticated_users_all" ON users
    FOR ALL
    TO authenticated
    USING (auth.uid() = auth_id)
    WITH CHECK (auth.uid() = auth_id);

-- VENDORS TABLE
CREATE POLICY "authenticated_vendors_all" ON vendors
    FOR ALL
    TO authenticated
    USING (true)  -- Can read all vendors (needed for payment info)
    WITH CHECK (auth.uid() = auth_id);  -- Can only insert/update own data

-- TILLS TABLE
CREATE POLICY "authenticated_tills_all" ON tills
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = tills.vendor_id
            AND vendors.auth_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = tills.vendor_id
            AND vendors.auth_id = auth.uid()
        )
    );

-- ============================================
-- 3. VERIFY POLICIES WERE CREATED
-- ============================================

SELECT
    tablename,
    policyname,
    cmd,
    CASE
        WHEN roles = '{authenticated}' THEN 'authenticated users'
        ELSE roles::text
    END as who_can_use
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'vendors', 'tills')
ORDER BY tablename, policyname;

-- ============================================
-- 4. TEST QUERIES (Optional - for debugging)
-- ============================================

-- Check if you can see the tables
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as vendor_count FROM vendors;
-- SELECT COUNT(*) as till_count FROM tills;

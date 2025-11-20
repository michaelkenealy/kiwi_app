-- ============================================
-- FIX: Tills Table RLS Policies
-- Run this if tills are not showing on merchant dashboard
-- ============================================

-- 1. CHECK CURRENT POLICIES
SELECT
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tills'
ORDER BY policyname;

-- 2. DROP ALL EXISTING TILL POLICIES
DROP POLICY IF EXISTS "Vendors can manage own tills" ON tills;
DROP POLICY IF EXISTS "Vendors can insert own tills" ON tills;
DROP POLICY IF EXISTS "Vendors can select own tills" ON tills;
DROP POLICY IF EXISTS "Vendors can update own tills" ON tills;
DROP POLICY IF EXISTS "Vendors can delete own tills" ON tills;
DROP POLICY IF EXISTS "authenticated_tills_all" ON tills;

-- 3. CREATE WORKING RLS POLICIES FOR TILLS

-- Allow vendors to SELECT their own tills
CREATE POLICY "tills_select_own" ON tills
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = tills.vendor_id
            AND vendors.auth_id = auth.uid()
        )
    );

-- Allow vendors to INSERT tills for themselves
CREATE POLICY "tills_insert_own" ON tills
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = tills.vendor_id
            AND vendors.auth_id = auth.uid()
        )
    );

-- Allow vendors to UPDATE their own tills
CREATE POLICY "tills_update_own" ON tills
    FOR UPDATE
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

-- Allow vendors to DELETE their own tills
CREATE POLICY "tills_delete_own" ON tills
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = tills.vendor_id
            AND vendors.auth_id = auth.uid()
        )
    );

-- 4. VERIFY RLS IS ENABLED
ALTER TABLE tills ENABLE ROW LEVEL SECURITY;

-- 5. VERIFY POLICIES WERE CREATED
SELECT
    policyname,
    cmd as operation,
    permissive as is_permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tills'
ORDER BY policyname;

-- 6. TEST QUERY (Check if you can see tills)
-- This should return your tills if policies are working
SELECT
    t.id,
    t.till_name,
    t.is_active,
    t.vendor_id,
    v.name as vendor_name
FROM tills t
JOIN vendors v ON v.id = t.vendor_id
WHERE v.auth_id = auth.uid()
ORDER BY t.created_at;

-- 7. DEBUG: Check if any tills exist at all
SELECT COUNT(*) as total_tills FROM tills;

-- 8. DEBUG: Check your vendor_id
SELECT
    id as vendor_id,
    name as business_name,
    auth_id
FROM vendors
WHERE auth_id = auth.uid();

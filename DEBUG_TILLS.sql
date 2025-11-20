-- ============================================
-- DIAGNOSTIC SCRIPT: Debug Tills Not Appearing
-- Run this in Supabase SQL Editor to diagnose the issue
-- ============================================

-- 1. CHECK IF TILLS TABLE EXISTS
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'tills'
) as tills_table_exists;

-- 2. CHECK TOTAL TILLS IN DATABASE
SELECT COUNT(*) as total_tills FROM tills;

-- 3. SEE ALL TILLS (ignoring RLS)
-- This shows ALL tills regardless of RLS
SELECT
    t.id,
    t.till_name,
    t.vendor_id,
    t.is_active,
    v.name as vendor_name,
    t.created_at
FROM tills t
LEFT JOIN vendors v ON v.id = t.vendor_id
ORDER BY t.created_at DESC;

-- 4. CHECK YOUR VENDOR ID
-- Find out what your vendor_id is
SELECT
    id as vendor_id,
    name as business_name,
    auth_id,
    created_at
FROM vendors
WHERE auth_id = auth.uid();

-- 5. CHECK IF YOU HAVE ANY TILLS
-- This uses your current auth session
SELECT
    t.*,
    v.name as vendor_name
FROM tills t
JOIN vendors v ON v.id = t.vendor_id
WHERE v.auth_id = auth.uid();

-- 6. CHECK RLS POLICIES ON TILLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tills'
ORDER BY policyname;

-- 7. TEST IF RLS IS BLOCKING SELECTS
-- Try to select your tills
DO $$
DECLARE
    till_count INTEGER;
    vendor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO vendor_count FROM vendors WHERE auth_id = auth.uid();
    RAISE NOTICE 'Vendors found for current user: %', vendor_count;

    SELECT COUNT(*) INTO till_count
    FROM tills t
    JOIN vendors v ON v.id = t.vendor_id
    WHERE v.auth_id = auth.uid();

    RAISE NOTICE 'Tills found for current user: %', till_count;
END $$;

-- 8. CHECK IF RLS IS ENABLED
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'tills';

-- ============================================
-- QUICK FIX: If tills aren't showing
-- ============================================

-- Option A: Drop and recreate policies (safe)
DROP POLICY IF EXISTS "tills_select_own" ON tills;
DROP POLICY IF EXISTS "tills_insert_own" ON tills;
DROP POLICY IF EXISTS "tills_update_own" ON tills;
DROP POLICY IF EXISTS "tills_delete_own" ON tills;
DROP POLICY IF EXISTS "authenticated_tills_all" ON tills;
DROP POLICY IF EXISTS "Vendors can manage own tills" ON tills;

CREATE POLICY "tills_all_operations" ON tills
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

-- Verify the policy was created
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'tills' AND schemaname = 'public';

-- ============================================
-- NUCLEAR OPTION: Temporarily disable RLS (TESTING ONLY!)
-- ============================================
-- Uncomment ONLY for testing to see if RLS is the issue
-- DO NOT USE IN PRODUCTION

-- ALTER TABLE tills DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable:
-- ALTER TABLE tills ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE A TEST TILL
-- ============================================
-- This will help verify if till creation works

DO $$
DECLARE
    my_vendor_id UUID;
BEGIN
    -- Get your vendor ID
    SELECT id INTO my_vendor_id
    FROM vendors
    WHERE auth_id = auth.uid()
    LIMIT 1;

    IF my_vendor_id IS NULL THEN
        RAISE EXCEPTION 'No vendor found for current user';
    END IF;

    -- Try to create a test till
    INSERT INTO tills (vendor_id, till_name, is_active)
    VALUES (my_vendor_id, 'Test Till - ' || NOW()::text, true);

    RAISE NOTICE 'Test till created successfully for vendor: %', my_vendor_id;
END $$;

-- Check if test till was created
SELECT * FROM tills ORDER BY created_at DESC LIMIT 5;

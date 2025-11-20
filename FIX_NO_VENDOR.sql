-- ============================================
-- FIX: No vendor found for current user
-- This script helps diagnose and fix the vendor/till issue
-- ============================================

-- STEP 1: See who you are logged in as
SELECT
    auth.uid() as my_auth_id,
    auth.email() as my_email;

-- STEP 2: See ALL vendors (ignore RLS temporarily)
-- This shows all vendors in the database
SELECT
    id as vendor_id,
    name as business_name,
    auth_id,
    created_at
FROM vendors
ORDER BY created_at DESC;

-- STEP 3: See ALL tills (ignore RLS temporarily)
SELECT
    t.id as till_id,
    t.till_name,
    t.vendor_id,
    t.is_active,
    v.name as vendor_name,
    t.created_at
FROM tills t
LEFT JOIN vendors v ON v.id = t.vendor_id
ORDER BY t.created_at DESC;

-- STEP 4: Check if RLS is the problem
-- Temporarily disable RLS to test (TESTING ONLY - re-enable after!)
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE tills DISABLE ROW LEVEL SECURITY;

-- Now try to see vendors and tills
SELECT 'Vendors with RLS disabled:' as info;
SELECT * FROM vendors;

SELECT 'Tills with RLS disabled:' as info;
SELECT * FROM tills;

-- STEP 5: Re-enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tills ENABLE ROW LEVEL SECURITY;

-- ============================================
-- OPTION A: Create vendor for current logged-in user
-- Only run this if you confirmed you don't have a vendor record
-- ============================================

-- Uncomment and run this if you need to create a vendor manually:

-- INSERT INTO vendors (auth_id, name)
-- VALUES (auth.uid(), 'My Test Business')
-- RETURNING *;

-- -- Create a default till for the new vendor
-- INSERT INTO tills (vendor_id, till_name, is_active)
-- SELECT id, 'Main Register', true
-- FROM vendors
-- WHERE auth_id = auth.uid()
-- RETURNING *;

-- ============================================
-- OPTION B: Link existing vendor to your auth account
-- Use this if you have a vendor but wrong auth_id
-- ============================================

-- Find the vendor you want to link (look at STEP 2 results)
-- Then uncomment and modify this:

-- UPDATE vendors
-- SET auth_id = auth.uid()
-- WHERE id = 'PUT_VENDOR_ID_HERE';

-- ============================================
-- VERIFICATION: Check if it worked
-- ============================================

SELECT
    'My vendor:' as info,
    v.*
FROM vendors v
WHERE v.auth_id = auth.uid();

SELECT
    'My tills:' as info,
    t.*
FROM tills t
JOIN vendors v ON v.id = t.vendor_id
WHERE v.auth_id = auth.uid();

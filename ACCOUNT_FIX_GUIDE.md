# Account Fix Guide

## Problem: "No vendor found for current user"

This happens when your Supabase Auth account exists, but there's no matching vendor/user profile in the database.

---

## 🔍 **Diagnosis**

### **Check 1: Are you testing in the SQL Editor?**

When you run SQL in Supabase SQL Editor, you're logged in as **YOUR Supabase admin account**, not as the merchant account you created in the app.

**The Solution:**
- Don't test with `auth.uid()` in SQL Editor
- Instead, use the actual `auth_id` value from your vendor record

### **Check 2: Find your merchant's auth_id**

**In the app (easier):**
1. Open browser console (F12)
2. Login as merchant
3. After login succeeds, type in console:
   ```javascript
   console.log('My auth_id:', (await supabase.auth.getUser()).data.user.id);
   console.log('My vendor:', AppState.currentVendor);
   ```
4. Copy the `auth_id` value

**In Supabase (harder):**
1. Go to **Authentication** → **Users**
2. Find your merchant account by email
3. Copy the User UID

---

## 🔧 **Fix Options**

### **Option 1: Login via the App (Automatic Fix)**

The latest code automatically creates missing profiles:

1. Go to your app
2. Try logging in as merchant with your email/password
3. If the auth account exists but profile is missing, it will auto-create it
4. You should see "Welcome! Merchant profile created successfully"
5. Check if tills now appear

### **Option 2: Manual SQL Fix**

If Option 1 doesn't work, run this in Supabase SQL Editor:

```sql
-- 1. First, find all vendors and their auth_ids
SELECT id, name, auth_id, created_at
FROM vendors
ORDER BY created_at DESC;

-- 2. Find all auth users
-- Go to Authentication → Users in Supabase dashboard
-- Find your merchant email and copy the User UID

-- 3. Check if vendor exists for that auth_id
-- Replace YOUR_AUTH_ID with the actual ID from step 2
SELECT *
FROM vendors
WHERE auth_id = 'YOUR_AUTH_ID';

-- 4. If no vendor found, create one:
INSERT INTO vendors (auth_id, name)
VALUES ('YOUR_AUTH_ID', 'My Business Name')
RETURNING *;

-- 5. Create a default till
INSERT INTO tills (vendor_id, till_name, is_active)
SELECT id, 'Main Register', true
FROM vendors
WHERE auth_id = 'YOUR_AUTH_ID'
RETURNING *;
```

### **Option 3: Start Fresh**

If you want to start completely fresh:

**Delete the orphaned auth account:**
1. Supabase → **Authentication** → **Users**
2. Find your merchant email
3. Click the three dots → **Delete user**

**Re-register:**
1. Go to your app
2. Register as merchant again with the same email
3. This time profile creation should work

---

## 🎯 **Most Likely Solution**

Based on the error, here's what probably happened:

1. You registered a merchant account
2. Auth account created successfully
3. Profile creation in `vendors` table failed (RLS blocking it)
4. Now you can login (auth works) but can't see tills (no vendor profile)

**The fix:**
1. Make sure you ran [FIX_RLS_SIMPLE.sql](FIX_RLS_SIMPLE.sql) to fix RLS policies
2. Try logging in again - the code will auto-create the missing profile
3. If that doesn't work, use Option 2 above to manually create the vendor record

---

## 📊 **Debugging in Browser Console**

After logging in as merchant, check these in browser console:

```javascript
// Check if you're logged in
const { data } = await supabase.auth.getUser();
console.log('Auth User:', data.user);

// Check if vendor profile exists
const { data: vendor } = await supabase
  .from('vendors')
  .select('*')
  .eq('auth_id', data.user.id)
  .maybeSingle();
console.log('Vendor Profile:', vendor);

// Check if you have tills
if (vendor) {
  const { data: tills } = await supabase
    .from('tills')
    .select('*')
    .eq('vendor_id', vendor.id);
  console.log('Tills:', tills);
}
```

This will show you exactly what's missing!

---

## ✅ **Expected Results**

After fixing, you should see:

**In browser console:**
```
Loading tills for vendor: [UUID]
Tills query result: { tills: [...], error: null }
Found 1 tills
```

**In the app:**
- Merchant dashboard shows at least one till card
- Clicking the till takes you to payment entry
- Can generate QR codes

---

## 🆘 **Still Not Working?**

If none of this works, share:
1. Screenshot of browser console after login
2. Output of this SQL query:
   ```sql
   SELECT * FROM vendors ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM tills ORDER BY created_at DESC LIMIT 5;
   ```
3. Any error messages you see

I can then provide a more specific fix!

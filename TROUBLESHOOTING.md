# Troubleshooting Guide - Kiwi Pay

## Common Errors and Solutions

---

## ❌ Error: "new row violates row-level security policy for table 'vendors'"

### Problem
When trying to register as a merchant, you get an RLS (Row Level Security) error.

### Root Cause
The RLS policies in Supabase are blocking the INSERT operation because the new user's `auth_id` doesn't exist in the vendors table yet (chicken-and-egg problem).

### ✅ Solution

**Option 1: Run the Simple Fix (Recommended)**

1. Go to your Supabase Dashboard
2. Open **SQL Editor**
3. Open the file: [FIX_RLS_SIMPLE.sql](FIX_RLS_SIMPLE.sql)
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run**
7. Try registering again

**Option 2: Run the Detailed Fix**

1. Go to Supabase Dashboard → **SQL Editor**
2. Open the file: [FIX_RLS_POLICIES.sql](FIX_RLS_POLICIES.sql)
3. Copy and paste into SQL Editor
4. Click **Run**

**Option 3: Temporarily Disable RLS (Not recommended for production)**

```sql
-- In Supabase SQL Editor
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tills DISABLE ROW LEVEL SECURITY;
```

**Re-enable later:**
```sql
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tills ENABLE ROW LEVEL SECURITY;
```

---

## ❌ Error: "new row violates row-level security policy for table 'users'"

### Solution
Same as above - run [FIX_RLS_SIMPLE.sql](FIX_RLS_SIMPLE.sql)

---

## ❌ Error: "Cannot read properties of undefined (reading 'createClient')"

### Problem
Supabase client not loading properly.

### ✅ Solutions

1. **Check internet connection** - Supabase library loads from CDN
2. **Check browser console** - Look for script loading errors
3. **Verify config.js** has correct credentials:
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'https://xxxxx.supabase.co',  // Must start with https://
       anonKey: 'eyJ...'                  // Long string starting with eyJ
   };
   ```
4. **Clear browser cache** and reload

---

## ❌ Error: "Invalid API key"

### Problem
Wrong Supabase credentials in config.js

### ✅ Solution

1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy the **anon public** key (starts with `eyJ`)
4. Update [js/config.js](js/config.js):
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'PASTE_PROJECT_URL_HERE',
       anonKey: 'PASTE_ANON_KEY_HERE'
   };
   ```
5. Save and reload the page

---

## ❌ Camera Won't Start

### Problem
Browser blocks camera access or permissions denied.

### ✅ Solutions

1. **Use HTTPS** - Camera requires secure connection
   - ✅ `https://...` or `http://localhost`
   - ❌ `http://192.168.x.x`

2. **Check browser permissions**
   - Chrome: Click lock icon → Camera → Allow
   - Safari: Settings → Safari → Camera → Allow

3. **Try different browser**
   - Test in Chrome first
   - Then try Safari (iOS)

4. **Check for other apps using camera**
   - Close Zoom, Teams, etc.
   - Restart browser

---

## ❌ QR Code Not Scanning

### Problem
Scanner can't detect QR code.

### ✅ Solutions

1. **Improve lighting** - QR codes need good lighting
2. **Hold steady** - Camera needs to focus
3. **Ensure QR is fully visible** - Don't cut off edges
4. **Check QR code generated correctly**
   - Should see black/white square pattern
   - Refresh if it looks corrupted
5. **Try different distance** - Too close or too far won't work
6. **Clean camera lens**

---

## ❌ Error: "Failed to fetch"

### Problem
Can't connect to Supabase database.

### ✅ Solutions

1. **Check internet connection**
2. **Verify Supabase project is running**
   - Go to Supabase Dashboard
   - Check project status (not paused)
3. **Check API URL** in config.js
   - Must match your project URL exactly
4. **Check CORS settings** in Supabase
   - Usually not an issue with anon key
5. **Check browser console** for specific error

---

## ❌ Login/Register Not Working

### Problem
Form submits but nothing happens or errors appear.

### ✅ Diagnostic Steps

1. **Open browser console** (F12 → Console tab)
2. **Look for error messages**
3. **Common issues:**

   **"Email not confirmed"**
   - Go to Supabase → Authentication → Settings
   - Disable email confirmation for testing:
   ```
   Enable email confirmations: OFF
   ```

   **"User already registered"**
   - Use different email
   - Or delete user in Supabase Dashboard → Authentication → Users

   **"Password too weak"**
   - Use at least 6 characters
   - Include letters and numbers

---

## ❌ Transactions Not Showing

### Problem
Made a payment but it doesn't appear in history.

### ✅ Solutions

1. **Check RLS policies** - Run [FIX_RLS_SIMPLE.sql](FIX_RLS_SIMPLE.sql)

2. **Verify transaction in database**
   - Supabase → Table Editor → transactions
   - Check if row exists with your user_id

3. **Check for JavaScript errors**
   - Open browser console (F12)
   - Look for errors in red

4. **Refresh the page**
   - Reload user dashboard
   - Check if transactions appear

---

## ❌ Real-time Updates Not Working

### Problem
Merchant doesn't see "User X paid $$" confirmation.

### ✅ Solutions

1. **Enable Realtime in Supabase**
   - Dashboard → Database → Replication
   - Enable realtime for:
     - `payment_sessions` ✅
     - `transactions` ✅

2. **Check browser console** for subscription errors

3. **Verify both devices** are online

4. **Try refreshing** merchant page after user pays

5. **Check payment_sessions table**
   ```sql
   SELECT * FROM payment_sessions
   ORDER BY created_at DESC
   LIMIT 10;
   ```

---

## ❌ Error: "Session expired"

### Problem
QR code shows "session expired" when scanned.

### ✅ Solutions

1. **Generate new QR code** - Sessions expire after 10 minutes
2. **Check system time** - Make sure device clock is correct
3. **Scan immediately** after generating

---

## ❌ Balance Not Updating

### Problem
Made payment but balance stays the same.

### ✅ Solutions

1. **Check transaction status**
   ```sql
   SELECT * FROM transactions
   WHERE user_id = 'YOUR_USER_ID'
   ORDER BY created_at DESC;
   ```

2. **Verify user balance in database**
   ```sql
   SELECT * FROM users WHERE id = 'YOUR_USER_ID';
   ```

3. **Refresh the page**

4. **Check JavaScript console** for errors

---

## 🐛 General Debugging Steps

### 1. Check Browser Console
```
Press F12 → Console Tab
Look for errors in red
```

### 2. Check Network Tab
```
Press F12 → Network Tab
Look for failed requests (red)
Click on failed request to see details
```

### 3. Check Supabase Logs
```
Supabase Dashboard → Logs
Look for authentication or database errors
```

### 4. Verify Database Tables
```
Supabase → Table Editor
Check each table has correct columns
Verify data exists
```

### 5. Test Queries Directly
```
Supabase → SQL Editor
Run test queries to verify data
```

---

## 📊 Verification Checklist

Use this checklist to verify everything is set up correctly:

### Database Setup
- [ ] `users` table exists with all columns
- [ ] `vendors` table exists with all columns
- [ ] `tills` table exists
- [ ] `transactions` table exists with all columns
- [ ] `payment_sessions` table exists
- [ ] RLS is enabled on all tables
- [ ] RLS policies allow INSERT (run FIX_RLS_SIMPLE.sql)
- [ ] Realtime enabled for `payment_sessions` and `transactions`

### Configuration
- [ ] `js/config.js` has correct Supabase URL
- [ ] `js/config.js` has correct anon key
- [ ] No console errors when page loads
- [ ] Supabase client initializes (check console)

### Testing
- [ ] Can register user account
- [ ] Can login as user
- [ ] User dashboard shows balance
- [ ] Can register merchant account
- [ ] Can login as merchant
- [ ] Merchant dashboard shows tills
- [ ] Can create new till
- [ ] Can generate QR code
- [ ] Can scan QR code
- [ ] Payment processes successfully
- [ ] Merchant sees confirmation
- [ ] User sees success
- [ ] Balance updates
- [ ] Transactions show in history

---

## 🆘 Still Having Issues?

1. **Check all SQL files were run** in Supabase
2. **Run [FIX_RLS_SIMPLE.sql](FIX_RLS_SIMPLE.sql)** to fix permissions
3. **Clear browser cache** and reload
4. **Try different browser** (Chrome recommended)
5. **Check Supabase project** is not paused
6. **Verify credentials** in config.js match Supabase dashboard
7. **Look at browser console** for specific errors
8. **Check [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** to verify all tables created

---

## 💡 Pro Tips

- **Always check browser console first** - Most errors show there
- **Test locally first** - Use `http://localhost:8000` before deploying
- **Use Supabase SQL Editor** - Run queries to check data
- **Enable RLS carefully** - Start permissive, then restrict
- **Use HTTPS** - Required for camera and many features
- **Keep credentials in config.js** - Easy to update
- **Check realtime subscriptions** - Must be enabled in Supabase

---

For more help, see:
- [README.md](README.md) - Full documentation
- [QUICK_START.md](QUICK_START.md) - Setup guide
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database setup
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment options

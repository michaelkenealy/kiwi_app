# Setup Checklist - Kiwi Pay

Use this checklist to ensure everything is configured correctly.

---

## Database Setup

### In Supabase SQL Editor, run these in order:

- [ ] Create `users` table with RLS policies
- [ ] Update `vendors` table (add logo_url, description, updated_at)
- [ ] Create `tills` table with RLS policies
- [ ] Update `transactions` table (add user_id, till_id, status, updated_at)
- [ ] Create `payment_sessions` table with RLS policies
- [ ] Create `update_updated_at_column()` function
- [ ] Create triggers for auto-updating timestamps
- [ ] Enable realtime for `payment_sessions`
- [ ] Enable realtime for `transactions`

**Verify Tables Exist:**
- [ ] Go to Supabase → Table Editor
- [ ] Confirm you see: users, vendors, tills, transactions, payment_sessions

---

## Configuration

- [ ] Copy Project URL from Supabase (Settings → API)
- [ ] Copy anon key from Supabase (Settings → API)
- [ ] Open `js/config.js`
- [ ] Replace `YOUR_PROJECT_URL_HERE` with your actual URL
- [ ] Replace `YOUR_ANON_KEY_HERE` with your actual key
- [ ] Save the file

**Test Configuration:**
- [ ] Open browser console
- [ ] Should NOT see "⚠️ Supabase not configured!" warning

---

## Realtime Setup

- [ ] Go to Supabase → Database → Replication
- [ ] Enable realtime for `payment_sessions`
- [ ] Enable realtime for `transactions`
- [ ] Save changes

---

## Deploy/Run

Choose one:

### Local Testing
- [ ] Run: `python -m http.server 8000`
- [ ] Open: http://localhost:8000/app.html
- [ ] Verify home page loads

### Deploy to Web
- [ ] Upload folder to Netlify/Vercel
- [ ] Set `app.html` as entry point
- [ ] Deploy and copy URL
- [ ] Open URL in browser

---

## Test User Flow

- [ ] Open app → "User / Customer"
- [ ] Tap "Create Account"
- [ ] Register: name, email, password
- [ ] Should redirect to user dashboard
- [ ] Verify balance shows $100.00
- [ ] Verify "Recent Transactions" section shows
- [ ] Logout
- [ ] Login again with same credentials
- [ ] Verify dashboard loads correctly

---

## Test Merchant Flow

- [ ] Open app → "Merchant / Vendor"
- [ ] Tap "Register Business"
- [ ] Register: business name, email, password
- [ ] Should redirect to merchant dashboard
- [ ] Verify "Main Register" till is created
- [ ] Click "Profile" → Update business name
- [ ] Save changes (should show success)
- [ ] Click "Manage Tills" → Add new till
- [ ] Verify new till appears
- [ ] Return to dashboard

---

## Test Payment Flow (Use 2 Devices/Tabs)

### Device 1 - Merchant
- [ ] Login as merchant
- [ ] Select a till
- [ ] Enter amount: `$7.50`
- [ ] Tap "Generate QR Code"
- [ ] QR code appears
- [ ] Keep this screen open

### Device 2 - User
- [ ] Login as user
- [ ] Tap "Scan QR Code to Pay"
- [ ] Tap "Start Camera"
- [ ] Camera preview shows
- [ ] Point at QR code from Device 1
- [ ] Payment confirmation screen appears
- [ ] Verify vendor name and amount are correct
- [ ] Tap "Pay Now"
- [ ] See "Payment Successful!" screen
- [ ] Check balance decreased by $7.50
- [ ] Check transaction appears in history

### Device 1 - Merchant (Should See)
- [ ] "Payment Received!" confirmation
- [ ] Shows user name who paid
- [ ] Shows amount paid
- [ ] Transaction appears in history

---

## iOS Safari Testing (Optional)

- [ ] Open deployed URL in iOS Safari
- [ ] Tap Share button (box with arrow)
- [ ] Tap "Add to Home Screen"
- [ ] Launch app from home screen
- [ ] Verify app works in standalone mode
- [ ] Test camera permissions
- [ ] Test QR scanning

---

## Common Issues

### If camera won't start:
- [ ] Verify using HTTPS (not HTTP)
- [ ] Check browser permissions
- [ ] Try refreshing the page

### If QR scan doesn't detect:
- [ ] Check good lighting
- [ ] Ensure QR code is fully visible
- [ ] Try increasing brightness
- [ ] Hold camera steady

### If login fails:
- [ ] Check Supabase auth is enabled (Authentication → Settings)
- [ ] Verify RLS policies are created
- [ ] Check browser console for errors
- [ ] Verify email/password are correct

### If "Supabase not configured" error:
- [ ] Double-check `js/config.js` file
- [ ] Ensure you saved the file after editing
- [ ] Clear browser cache and reload
- [ ] Check URL starts with `https://`

### If realtime doesn't work:
- [ ] Verify realtime is enabled in Supabase
- [ ] Check browser console for errors
- [ ] Try refreshing both merchant and user pages
- [ ] Check payment_sessions table has data

---

## Production Checklist (Before Going Live)

- [ ] Change default user balance (currently $100 demo)
- [ ] Add email verification for new accounts
- [ ] Implement password reset functionality
- [ ] Add rate limiting for QR generation
- [ ] Set up proper error logging
- [ ] Configure backup strategy
- [ ] Add transaction receipts (email/SMS)
- [ ] Implement refund capability
- [ ] Add 2FA for merchant accounts
- [ ] Set up monitoring and alerts
- [ ] Review and test all RLS policies
- [ ] Add proper terms of service
- [ ] Configure proper session timeouts
- [ ] Test with real payment scenarios
- [ ] Perform security audit

---

## All Done! 🎉

Your Kiwi Pay app should now be fully functional!

**Next Steps:**
- Read [README.md](README.md) for full documentation
- Check [QUICK_START.md](QUICK_START.md) for usage guide
- Review [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for database details

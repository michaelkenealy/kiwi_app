# Quick Start Guide - Kiwi Pay

## Get Started in 5 Minutes

### Step 1: Set Up Database (3 minutes)

1. Go to [Supabase Dashboard](https://supabase.com)
2. Open **SQL Editor**
3. Copy **each SQL block** from [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) and run them in order:
   - Users table
   - Vendors table updates
   - Tills table
   - Transactions table updates
   - Payment sessions table
   - Functions and triggers
   - Realtime subscriptions

### Step 2: Configure Supabase (1 minute)

1. Get your credentials from Supabase:
   - **Settings** → **API** → Copy **Project URL** and **anon key**

2. Open [js/config.js](js/config.js)

3. Replace these lines:
   ```javascript
   url: 'YOUR_PROJECT_URL_HERE',  // Paste your Project URL
   anonKey: 'YOUR_ANON_KEY_HERE'  // Paste your anon key
   ```

### Step 3: Enable Realtime (30 seconds)

1. In Supabase Dashboard: **Database** → **Replication**
2. Turn on realtime for:
   - ✅ `payment_sessions`
   - ✅ `transactions`

### Step 4: Run the App (30 seconds)

#### Option A: Quick Test (Local)
```bash
cd C:\Users\Owner\Code\Kiwi_app1
python -m http.server 8000
```
Then open: http://localhost:8000/app.html

#### Option B: Test on iPhone
1. Deploy to Netlify/Vercel (drag and drop the folder)
2. Open URL in iOS Safari
3. Tap Share → "Add to Home Screen"

---

## Your First Test Transaction

### 1. Create Accounts (2 devices or tabs)

**Device 1 - Merchant:**
1. Open app → "Merchant/Vendor"
2. Register: business name, email, password
3. Login

**Device 2 - User:**
1. Open app → "User/Customer"
2. Register: name, email, password
3. Login (you'll have $100 balance)

### 2. Make a Payment

**Device 1 - Merchant:**
1. Select "Main Register" till
2. Enter amount: `$5.00`
3. Tap "Generate QR Code"
4. Show QR code to Device 2

**Device 2 - User:**
1. Tap "Scan QR Code to Pay"
2. Tap "Start Camera"
3. Scan the QR code from Device 1
4. Review payment → Tap "Pay Now"
5. See "Payment Successful!"

**Device 1 - Merchant:**
- Sees: "Payment Received! [Your Name] paid $5.00"

---

## Troubleshooting

### "Please configure Supabase" error
- Check [js/config.js](js/config.js) has correct URL and key
- URL should start with `https://`
- Make sure you saved the file

### Camera won't start
- Use HTTPS or localhost (HTTP won't work)
- Check browser permissions
- On iOS: tap the camera button in address bar

### QR scan doesn't work
- Check good lighting
- Hold camera steady
- Ensure QR code fills the scan box
- Try refreshing the page

### Login/register errors
- Verify all database tables are created
- Check Supabase Dashboard → Authentication is enabled
- Look in browser console for specific errors

---

## What's Next?

- ✅ Test multiple transactions
- ✅ Try creating multiple tills
- ✅ Check transaction history
- ✅ Update merchant profile
- ✅ Test with expired sessions (wait 10 minutes)

See [README.md](README.md) for full documentation!

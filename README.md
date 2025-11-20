# 🥝 Kiwi Pay - QR Payment Web App

A responsive web application for QR code-based payments between merchants and users. Built with vanilla JavaScript, Supabase, and optimized for iOS Safari.

---

## Features

### For Users
- ✅ Create account and login
- ✅ View account balance
- ✅ Scan merchant QR codes to pay
- ✅ Confirm payment before processing
- ✅ View transaction history grouped by day
- ✅ Real-time balance updates

### For Merchants
- ✅ Create merchant account and login
- ✅ Manage business profile (name, description, logo)
- ✅ Create and manage multiple tills/registers
- ✅ Generate QR codes for payments
- ✅ Receive real-time payment confirmations
- ✅ View transaction history per till
- ✅ See "User X paid $$" confirmation messages

---

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **QR Code**: html5-qrcode (scanning), qrcode.js (generation)
- **Styling**: Custom CSS with CSS variables for easy theming

---

## Project Structure

```
Kiwi_app1/
├── app.html                 # Main application file
├── index.html              # Original QR scanner (legacy)
├── manifest.json           # PWA manifest
├── logo.png               # App logo
├── css/
│   └── styles.css         # Centralized styles with CSS variables
├── js/
│   ├── config.js          # Supabase configuration
│   ├── router.js          # SPA routing
│   ├── auth.js            # Authentication logic
│   ├── user-dashboard.js  # User features
│   └── merchant-dashboard.js  # Merchant features
├── DATABASE_SCHEMA.md     # Database setup instructions
└── README.md              # This file
```

---

## Setup Instructions

### 1. Database Setup

1. **Go to your Supabase Dashboard** at [https://supabase.com](https://supabase.com)
2. **Navigate to SQL Editor**
3. **Open** [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
4. **Copy and run each SQL block** in the following order:
   - Create `users` table
   - Update `vendors` table (add new columns)
   - Create `tills` table
   - Update `transactions` table (add new columns)
   - Create `payment_sessions` table
   - Create functions and triggers
   - Enable realtime subscriptions

### 2. Configure Supabase Credentials

1. **Get your Supabase credentials**:
   - Project URL: `https://your-project.supabase.co`
   - Anon Key: Found in Settings → API → Project API keys

2. **Update [js/config.js](js/config.js)**:
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'https://your-project.supabase.co',  // Replace with your URL
       anonKey: 'your-anon-key-here'             // Replace with your key
   };
   ```

### 3. Enable Realtime in Supabase

1. Go to **Database → Replication**
2. Enable realtime for these tables:
   - `payment_sessions`
   - `transactions`

### 4. Deploy or Run Locally

#### Option A: Run Locally
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Then open: http://localhost:8000/app.html
```

#### Option B: Deploy to Netlify/Vercel
1. Upload the entire `Kiwi_app1` folder
2. Set `app.html` as the entry point
3. Deploy!

### 5. Test on iOS Safari

1. Open Safari on your iPhone
2. Navigate to your deployed URL (or local network IP)
3. Tap the Share button → "Add to Home Screen"
4. Launch the app from your home screen

---

## Usage Guide

### Creating Test Accounts

#### User Account
1. Open the app
2. Tap "User / Customer"
3. Tap "Create Account"
4. Fill in details (users start with $100 demo balance)
5. Login to see your dashboard

#### Merchant Account
1. Open the app
2. Tap "Merchant / Vendor"
3. Tap "Register Business"
4. Fill in details (creates default "Main Register" till)
5. Login to see your dashboard

### Making a Payment (Demo Flow)

1. **Merchant Side** (use one device):
   - Login as merchant
   - Select a till
   - Enter payment amount (e.g., $10.50)
   - Tap "Generate QR Code"
   - QR code displays on screen

2. **User Side** (use another device or tab):
   - Login as user
   - Tap "Scan QR Code to Pay"
   - Tap "Start Camera"
   - Point camera at merchant's QR code
   - Review payment details
   - Tap "Pay Now"
   - See "Payment Successful!" message

3. **Merchant Sees**:
   - "Payment Received! [User Name] paid $10.50"
   - Transaction appears in transaction history

4. **User Sees**:
   - "Payment Successful!"
   - Balance updated
   - Transaction appears in history

---

## Database Schema Overview

### Tables

1. **users**
   - User accounts with balance
   - Links to Supabase auth

2. **vendors**
   - Merchant business information
   - Includes name, description, logo

3. **tills**
   - Individual registers/tills per merchant
   - Can be activated/deactivated

4. **transactions**
   - Payment records
   - Links users, vendors, and tills

5. **payment_sessions**
   - Temporary QR payment sessions
   - Expires after 10 minutes
   - Used for real-time payment confirmation

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for detailed schema and SQL scripts.

---

## Customization

### Changing Colors/Theme

Edit [css/styles.css](css/styles.css) CSS variables:

```css
:root {
    --primary-color: #34C759;     /* Main green */
    --secondary-color: #007AFF;   /* Blue */
    --danger-color: #FF3B30;      /* Red */
    --bg-primary: #000000;        /* Background */
    --text-primary: #FFFFFF;      /* Text color */
    /* ... more variables ... */
}
```

### Adding Features

- **User features**: Edit [js/user-dashboard.js](js/user-dashboard.js)
- **Merchant features**: Edit [js/merchant-dashboard.js](js/merchant-dashboard.js)
- **Authentication**: Edit [js/auth.js](js/auth.js)
- **Styling**: Edit [css/styles.css](css/styles.css)

---

## Security Considerations

### Current Implementation (Demo/MVP)
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Merchants can only access their own tills and transactions
- Session codes expire after 10 minutes

### Production Recommendations
1. **Add SSL/HTTPS** (required for camera access)
2. **Implement rate limiting** for QR generation
3. **Add email verification** for new accounts
4. **Add password reset** functionality
5. **Add 2FA** for merchant accounts
6. **Implement webhook validation** for real-time updates
7. **Add transaction receipts** (email/SMS)
8. **Add refund functionality**
9. **Implement proper error logging**
10. **Add analytics and monitoring**

---

## Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS (or localhost)
- Check browser permissions
- iOS requires user interaction to start camera

### QR Code Not Scanning
- Ensure good lighting
- Hold camera steady
- Make sure QR code is fully visible
- Check that session hasn't expired

### "Please configure Supabase" Error
- Check that [js/config.js](js/config.js) has correct credentials
- Verify URL format: `https://xxxxx.supabase.co`
- Ensure anon key is correct

### Authentication Errors
- Verify database tables are created
- Check RLS policies in Supabase
- Ensure auth is enabled in Supabase settings

### Realtime Not Working
- Enable realtime in Supabase Dashboard
- Check subscription code in merchant-dashboard.js
- Verify tables are published to realtime

---

## Next Steps / Roadmap

### Phase 1 (Current)
- ✅ Basic user and merchant flows
- ✅ QR code generation and scanning
- ✅ Transaction recording
- ✅ Real-time confirmations

### Phase 2
- ⬜ Logo upload for merchants
- ⬜ Transaction filtering and search
- ⬜ Export transaction history (CSV)
- ⬜ Push notifications for payments
- ⬜ Transaction receipts

### Phase 3
- ⬜ Refund capability
- ⬜ Multiple payment methods
- ⬜ Analytics dashboard for merchants
- ⬜ Customer loyalty program
- ⬜ Multi-currency support

---

## Contributing

This is a demo project. Feel free to fork and modify for your needs!

---

## License

MIT License - Feel free to use for personal or commercial projects.

---

## Support

For issues or questions:
1. Check [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for database setup
2. Review this README for configuration
3. Check browser console for errors
4. Verify Supabase dashboard for data

---

**Built with ❤️ for fast, secure QR payments**

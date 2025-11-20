# User Guide - Kiwi Pay

## 🎯 Quick Navigation

### **For Merchants:**
1. Register/Login → Dashboard → Select Till → Enter Amount → Generate QR → Customer Pays → Confirmation → New Transaction
2. Can also manage profile and tills from dashboard

### **For Users:**
1. Register/Login → Dashboard → Scan QR → Confirm Payment → Success → Back to Dashboard
2. View balance and transaction history

---

## 👤 User Flow

### 1. **Register a User Account**
- Open app → "User / Customer"
- Click "Create Account"
- Enter name, email, password
- Click "Create Account"
- **You start with $100 balance!**

### 2. **User Dashboard**
Shows:
- Your current balance
- "Scan QR Code to Pay" button
- Recent transactions grouped by day

### 3. **Make a Payment**
1. **Tap "Scan QR Code to Pay"**
2. **Tap "Start Camera"** (allow camera permissions if prompted)
3. **Point camera at merchant's QR code**
4. **Review payment details:**
   - Vendor name
   - Till name
   - Amount
   - Your current balance
   - Your new balance after payment
5. **Tap "Pay Now"** to confirm
6. **See "Payment Successful!"** screen
7. **Auto-redirects to dashboard** after 3 seconds

### 4. **View Transaction History**
- Dashboard shows all your payments
- Grouped by day (Today, Yesterday, etc.)
- Shows:
  - Vendor name
  - Till name
  - Time of transaction
  - Amount paid

---

## 🏪 Merchant Flow

### 1. **Register a Merchant Account**
- Open app → "Merchant / Vendor"
- Click "Register Business"
- Enter your name, business name, email, password
- Click "Create Merchant Account"
- **A default "Main Register" till is created automatically!**

### 2. **Merchant Dashboard**
Shows:
- Your business name
- Links to Profile and Manage Tills
- Grid of your tills (click to select)
- Recent transactions grouped by day

### 3. **Create a New Transaction**

#### **Step 1: Select a Till**
- From dashboard, click on a till card (e.g., "Main Register")
- This takes you to the payment entry screen

#### **Step 2: Enter Amount**
- Enter the payment amount (e.g., `10.50`)
- Click "Generate QR Code"

#### **Step 3: Show QR to Customer**
- QR code appears on screen
- Amount is displayed above QR code
- Customer scans with their device
- Wait for payment...

#### **Step 4: Payment Confirmation**
When customer pays, you'll see:
- ✓ **"Payment Received!"**
- **"[Customer Name] paid $XX.XX"**
- Two buttons:
  - **"New Transaction"** - Start another payment immediately
  - **"Dashboard"** - Return to dashboard
- **Auto-redirects to new transaction screen** after 3 seconds

#### **Step 5: Next Transaction**
After confirmation:
- You're back at payment entry screen
- Same till is still selected
- Amount field is cleared and ready for next amount
- Just enter new amount and generate QR!

### 4. **Manage Business Profile**

From dashboard:
1. Click **"Profile"**
2. Update:
   - Business name
   - Description
3. Click **"Save Changes"**

### 5. **Manage Tills**

From dashboard:
1. Click **"Manage Tills"**
2. View all your tills with status (Active/Inactive)
3. Click **"Activate"** or **"Deactivate"** to toggle
4. **Add New Till:**
   - Enter till name (e.g., "Drive-Thru", "Counter 2")
   - Click "Add Till"
5. Click **"Back to Dashboard"**

---

## 💡 Tips & Best Practices

### **For Users:**
- ✅ Check vendor name and amount before paying
- ✅ Make sure you have sufficient balance
- ✅ Good lighting helps QR scanning
- ✅ Hold camera steady when scanning

### **For Merchants:**
- ✅ Create separate tills for different registers/locations
- ✅ Use descriptive till names (e.g., "Front Counter", "Drive-Thru")
- ✅ Keep QR code visible until payment confirms
- ✅ After payment confirmation, you're automatically ready for next customer
- ✅ Can click "Dashboard" button if you need to switch tills

---

## 🔄 Complete Transaction Flow

```
MERCHANT                          USER
────────                          ────

1. Select Till
   "Main Register"

2. Enter Amount
   $7.50

3. Generate QR Code
   [QR CODE DISPLAYED]

4. Show to customer  ──────────►  Scan QR code

5. Wait for payment...  ◄────────  Review details
                                   - Vendor: Coffee Shop
                                   - Amount: $7.50
                                   - Balance: $100 → $92.50

                        ◄────────  Tap "Pay Now"

6. ✓ PAYMENT RECEIVED!             ✓ PAYMENT SUCCESSFUL!
   "John Doe paid $7.50"          Balance updated to $92.50

7. Auto-redirect (3s)              Auto-redirect (3s)
   OR click "New Transaction"      to Dashboard

8. Back to payment entry
   Ready for next customer!
   Amount cleared to $0.00
```

---

## 📱 Navigation Map

```
HOME PAGE
├── User / Customer
│   ├── Login → User Dashboard
│   │   ├── Scan QR Code → Confirm Payment → Success → Dashboard
│   │   └── View Transactions
│   └── Register → User Dashboard
│
└── Merchant / Vendor
    ├── Login → Merchant Dashboard
    │   ├── Select Till → Payment Entry → Generate QR → Confirmation → Payment Entry
    │   ├── Profile → Edit & Save
    │   └── Manage Tills → Add/Toggle Tills
    └── Register → Merchant Dashboard
```

---

## ⚙️ Account Settings

### **Initial User Balance:**
- New users start with **$100.00**
- This is set in the registration code
- Can be changed later for production

### **Default Merchant Till:**
- New merchants get **"Main Register"** till automatically
- Can add more tills anytime
- Tills can be activated/deactivated

---

## 🚀 Quick Actions

### **As a User:**
| Action | Steps |
|--------|-------|
| Check balance | Login → Dashboard (shows at top) |
| Make payment | Dashboard → Scan QR → Confirm → Pay |
| View history | Dashboard → Scroll down |

### **As a Merchant:**
| Action | Steps |
|--------|-------|
| Process payment | Dashboard → Select Till → Enter Amount → Generate QR |
| Add till | Dashboard → Manage Tills → Enter name → Add Till |
| Update profile | Dashboard → Profile → Edit → Save |
| View transactions | Dashboard → Scroll down |

---

## 🎨 User Interface Elements

### **Buttons:**
- **Green (Primary)** - Main actions (Pay, Generate QR, Create Account)
- **Blue (Secondary)** - Alternative actions (Merchant Login)
- **Gray (Outline)** - Cancel or back actions
- **Red (Danger)** - Stop or logout actions

### **Color Indicators:**
- **Green amounts** - Money received (merchant view)
- **Red amounts** - Money spent (user view)
- **Green checkmark** - Success confirmation
- **White on green** - Success screens

---

## 🔐 Security Features

- ✅ Row Level Security (RLS) on all database tables
- ✅ Users can only see their own data
- ✅ Merchants can only see their own tills and transactions
- ✅ QR codes expire after 10 minutes
- ✅ Secure authentication via Supabase Auth
- ✅ Real-time payment confirmation

---

## 📊 Understanding Your Data

### **User Dashboard:**
- **Balance** - Your current available funds
- **Transactions** - Payments you've made
  - Negative amounts (you paid)
  - Shows vendor and till name

### **Merchant Dashboard:**
- **Tills** - Your active registers
- **Transactions** - Payments you've received
  - Positive amounts (you received)
  - Shows payer name and till name
  - Grouped by day

---

## ❓ Common Questions

**Q: How do I know if a payment went through?**
A: Both merchant and user see confirmation screens immediately.

**Q: Can I create multiple tills?**
A: Yes! Go to Manage Tills and add as many as you need.

**Q: What happens if QR code expires?**
A: Just generate a new one. Old codes expire after 10 minutes.

**Q: Can I see transaction details?**
A: Yes, both dashboards show transaction history with details.

**Q: How do I switch between tills?**
A: From merchant dashboard, click a different till, or click "Dashboard" button after a transaction.

**Q: Can I cancel a payment after scanning?**
A: Yes, user can click "Cancel" on the confirmation screen before paying.

---

For troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

For setup instructions, see [QUICK_START.md](QUICK_START.md)

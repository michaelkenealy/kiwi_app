# Payment Flow Diagram

## Overview
This document explains how payments flow through the Kiwi Pay system.

---

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOME PAGE                                │
│                                                                   │
│              Choose: User/Customer or Merchant/Vendor            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌──────────────────┐            ┌──────────────────┐
    │   USER FLOW      │            │  MERCHANT FLOW   │
    └──────────────────┘            └──────────────────┘
```

---

## Detailed User Flow

```
┌─────────────────┐
│  User Login     │
│  or Register    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Dashboard  │
│ - View Balance  │
│ - Transactions  │
└────────┬────────┘
         │
         │ Tap "Scan QR Code to Pay"
         ▼
┌─────────────────┐
│  Scan QR Page   │
│ - Start Camera  │
│ - Scan Merchant │
│   QR Code       │
└────────┬────────┘
         │
         │ QR Code Detected
         ▼
┌─────────────────┐
│ Confirm Payment │
│ - Vendor Name   │
│ - Till Name     │
│ - Amount        │
│ - New Balance   │
└────────┬────────┘
         │
         │ Tap "Pay Now"
         ▼
┌─────────────────┐
│ Success Screen  │
│ ✓ Payment Done  │
│ - New Balance   │
└────────┬────────┘
         │
         │ Auto-redirect after 3s
         ▼
┌─────────────────┐
│ User Dashboard  │
│ (Updated)       │
└─────────────────┘
```

---

## Detailed Merchant Flow

```
┌─────────────────┐
│ Merchant Login  │
│ or Register     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Merchant Dashboard│
│ - Select Till   │
│ - Transactions  │
│ - Profile       │
│ - Manage Tills  │
└────────┬────────┘
         │
         │ Select a Till
         ▼
┌─────────────────┐
│ Payment Entry   │
│ - Enter Amount  │
└────────┬────────┘
         │
         │ Tap "Generate QR Code"
         ▼
┌─────────────────┐
│ QR Code Display │
│ - Show QR       │
│ - Wait for      │
│   Customer      │
└────────┬────────┘
         │
         │ Customer Scans & Pays
         ▼
┌─────────────────┐
│Confirm Screen   │
│ ✓ Payment!      │
│ "[Name] paid $X"│
└────────┬────────┘
         │
         │ Auto-redirect after 3s
         ▼
┌─────────────────┐
│Merchant Dashboard│
│ (Updated)       │
└─────────────────┘
```

---

## Backend Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    PAYMENT SEQUENCE                           │
└──────────────────────────────────────────────────────────────┘

1. MERCHANT GENERATES QR
   ├─ Create payment_session record
   │  ├─ session_code: "PAY-12345-ABC"
   │  ├─ vendor_id: merchant UUID
   │  ├─ till_id: selected till UUID
   │  ├─ amount: $10.50
   │  ├─ status: "pending"
   │  └─ expires_at: NOW() + 10 minutes
   │
   └─ Generate QR code with session_code

2. USER SCANS QR
   ├─ Extract session_code from QR
   ├─ Query payment_sessions table
   ├─ Verify status = "pending"
   ├─ Check not expired
   └─ Update status to "scanned"

3. USER CONFIRMS PAYMENT
   ├─ Create transaction record
   │  ├─ vendor_id: from session
   │  ├─ till_id: from session
   │  ├─ user_id: current user
   │  ├─ amount: from session
   │  ├─ status: "completed"
   │  └─ payer_name: user's name
   │
   ├─ Update user balance
   │  └─ balance = balance - amount
   │
   └─ Update session status
      └─ status = "completed"

4. MERCHANT SEES CONFIRMATION (Real-time)
   ├─ Realtime subscription detects session update
   ├─ Query transaction for payer details
   └─ Display: "[User Name] paid $10.50"
```

---

## Database Tables Used

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ auth_id         │
│ name            │
│ email           │
│ balance         │◄────┐
│ created_at      │     │
└─────────────────┘     │
                        │ (Updates balance)
┌─────────────────┐     │
│   vendors       │     │
│─────────────────│     │
│ id (PK)         │     │
│ auth_id         │     │
│ name            │     │
│ description     │     │
│ logo_url        │     │
└────────┬────────┘     │
         │              │
         │ has many     │
         ▼              │
┌─────────────────┐     │
│     tills       │     │
│─────────────────│     │
│ id (PK)         │     │
│ vendor_id (FK)  │     │
│ till_name       │     │
│ is_active       │     │
└────────┬────────┘     │
         │              │
         │ used in      │
         ▼              │
┌─────────────────┐     │
│payment_sessions │     │
│─────────────────│     │
│ id (PK)         │     │
│ session_code    │     │
│ vendor_id (FK)  │     │
│ till_id (FK)    │     │
│ amount          │     │
│ status          │     │
│ expires_at      │     │
└────────┬────────┘     │
         │              │
         │ creates      │
         ▼              │
┌─────────────────┐     │
│  transactions   │─────┘
│─────────────────│
│ id (PK)         │
│ vendor_id (FK)  │
│ till_id (FK)    │
│ user_id (FK)    │
│ amount          │
│ payer_name      │
│ status          │
│ peer_session_id │
│ created_at      │
└─────────────────┘
```

---

## Realtime Subscriptions

```
MERCHANT SIDE:
┌──────────────────────────────┐
│  Subscribe to:               │
│  payment_sessions            │
│  WHERE id = current_session  │
└──────────────┬───────────────┘
               │
               │ Waits for status change
               │ from "pending" to "completed"
               │
               ▼
┌──────────────────────────────┐
│  Status changed!             │
│  Query transaction details   │
│  Show confirmation message   │
└──────────────────────────────┘

USER SIDE:
┌──────────────────────────────┐
│  No subscription needed      │
│  Direct database writes      │
│  Update balance immediately  │
└──────────────────────────────┘
```

---

## Security: Row Level Security (RLS)

```
USERS TABLE:
├─ Users can only view/update their own data
└─ WHERE auth.uid() = auth_id

VENDORS TABLE:
├─ Vendors can only view/update their own data
├─ WHERE auth.uid() = auth_id
└─ Users can view vendor public info for payments

TILLS TABLE:
└─ Vendors can only manage tills they own
   └─ WHERE vendor_id IN (SELECT id FROM vendors WHERE auth_id = auth.uid())

TRANSACTIONS TABLE:
├─ Users can view their own transactions
│  └─ WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
└─ Vendors can view transactions for their tills
   └─ WHERE till_id IN (SELECT id FROM tills WHERE vendor_id IN (...))

PAYMENT_SESSIONS TABLE:
├─ Anyone can read (needed for QR scanning)
├─ Vendors can create sessions for their tills
└─ Anyone can update status (validated by app logic)
```

---

## Error Handling

```
┌─────────────────────────────────────────────────────────┐
│  COMMON ERROR SCENARIOS                                 │
└─────────────────────────────────────────────────────────┘

1. EXPIRED QR CODE
   User scans → Check expires_at → Show "QR code expired"

2. INSUFFICIENT BALANCE
   Calculate new balance → If negative → Disable pay button

3. INVALID QR CODE
   Session not found → Show "Invalid QR code"

4. ALREADY USED QR
   Status != "pending" → Show "QR code already used"

5. NETWORK ERROR
   Try-catch all API calls → Show user-friendly message

6. CAMERA PERMISSION DENIED
   Handle camera errors → Show instructions

7. SESSION EXPIRED BEFORE PAYMENT
   Check expiry again before creating transaction
```

---

## Testing Checklist

- [ ] Register user account
- [ ] Register merchant account
- [ ] Create multiple tills
- [ ] Generate QR code
- [ ] Scan QR code
- [ ] Confirm payment
- [ ] Verify user balance decreases
- [ ] Verify merchant sees confirmation
- [ ] Verify transaction appears in both histories
- [ ] Test with insufficient balance
- [ ] Test with expired QR (wait 10+ minutes)
- [ ] Test scanning same QR twice
- [ ] Test network disconnection
- [ ] Test camera permissions

---

## Performance Considerations

**QR Code Generation:**
- Happens client-side (instant)
- No server processing needed

**QR Code Scanning:**
- Uses device camera (10 FPS)
- Processes locally
- Sends only session_code to server

**Realtime Updates:**
- Uses Supabase realtime (WebSocket)
- Low latency (~100-500ms)
- Automatic reconnection

**Database Queries:**
- Indexed on key fields (user_id, vendor_id, till_id)
- RLS policies filter at database level
- Minimal data transfer

---

For implementation details, see the JavaScript files:
- [js/user-dashboard.js](js/user-dashboard.js)
- [js/merchant-dashboard.js](js/merchant-dashboard.js)
- [js/config.js](js/config.js)

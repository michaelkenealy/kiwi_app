# Send/Receive Money Feature Plan

## Overview
Allow users to send money to each other (peer-to-peer payments) and track whether transactions are payments to merchants or transfers between users.

## Database Changes Needed

### 1. Add transaction_type to transactions table

```sql
-- Add new column for transaction type
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'payment'
CHECK (transaction_type IN ('payment', 'send', 'receive'));

-- payment = user pays merchant
-- send = user sends to another user (debit)
-- receive = user receives from another user (credit)
```

### 2. Add recipient_user_id for P2P transfers

```sql
-- For peer-to-peer transfers, track recipient
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- When transaction_type = 'send' or 'receive', this field is populated
-- When transaction_type = 'payment', vendor_id is used instead
```

## User Interface Changes

### User Dashboard - Add Send Money Button

```
┌─────────────────────────────┐
│  User Dashboard             │
├─────────────────────────────┤
│  Balance: $100.00           │
│                             │
│  [Scan QR to Pay]           │
│  [Send Money]   ← NEW       │
│  [Receive Money] ← NEW      │
└─────────────────────────────┘
```

### Send Money Flow

1. **User clicks "Send Money"**
2. **Enter recipient email or scan their QR code**
3. **Enter amount**
4. **Confirm**
5. **Money transferred**

### Receive Money Flow

1. **User clicks "Receive Money"**
2. **Shows user's QR code with their user_id**
3. **Other user scans and sends money**
4. **Notification of receipt**

## Implementation Plan

### Phase 1: Database Setup
- [ ] Run SQL to add `transaction_type` column
- [ ] Run SQL to add `recipient_user_id` column
- [ ] Update RLS policies if needed

### Phase 2: User QR Code for Receiving
- [ ] Generate QR code with user's ID
- [ ] Create "Receive Money" page showing QR code
- [ ] Format: `{"type":"user","userId":"uuid"}`

### Phase 3: Send Money Feature
- [ ] Create "Send Money" page
- [ ] Option 1: Scan recipient's QR code
- [ ] Option 2: Enter recipient email
- [ ] Enter amount and confirm
- [ ] Create transaction records (debit sender, credit recipient)
- [ ] Update both balances

### Phase 4: Transaction History Updates
- [ ] Show transaction type (payment/sent/received)
- [ ] Different colors for different types
- [ ] Show recipient/sender name

## Transaction Logic

### When User Sends Money to Another User

```javascript
// 1. Deduct from sender
sender.balance -= amount;

// 2. Add to recipient
recipient.balance += amount;

// 3. Create TWO transaction records:

// Record for sender (shows as "sent")
{
  user_id: sender.id,
  recipient_user_id: recipient.id,
  amount: amount,
  transaction_type: 'send',
  payer_name: sender.name,
  status: 'completed'
}

// Record for recipient (shows as "received")
{
  user_id: recipient.id,
  recipient_user_id: sender.id,
  amount: amount,
  transaction_type: 'receive',
  payer_name: recipient.name,
  status: 'completed'
}
```

### When User Pays Merchant (existing)

```javascript
{
  user_id: user.id,
  vendor_id: vendor.id,
  till_id: till.id,
  amount: amount,
  transaction_type: 'payment',
  status: 'completed'
}
```

## UI Mockups

### Send Money Page
```
┌─────────────────────────────┐
│  Send Money                 │
├─────────────────────────────┤
│                             │
│  Send to:                   │
│  ○ Scan QR Code             │
│  ○ Enter Email              │
│                             │
│  [email@example.com    ]    │
│                             │
│  Amount: [$______]          │
│                             │
│  Your Balance: $100.00      │
│  After Send:   $90.00       │
│                             │
│  [Send Money]               │
│  [Cancel]                   │
└─────────────────────────────┘
```

### Receive Money Page
```
┌─────────────────────────────┐
│  Receive Money              │
├─────────────────────────────┤
│                             │
│  Have someone scan this:    │
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │   [QR CODE]         │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  Your Name: John Doe        │
│  Balance: $100.00           │
│                             │
│  [Close]                    │
└─────────────────────────────┘
```

### Updated Transaction List
```
Recent Transactions

Today
┌─────────────────────────────┐
│ ↗ Sent to Jane Doe          │
│   10:30 AM        -$10.00   │  (red)
├─────────────────────────────┤
│ ↙ Received from Mike        │
│   09:15 AM        +$25.00   │  (green)
├─────────────────────────────┤
│ 💳 Coffee Shop (Till 1)     │
│   08:00 AM        -$5.50    │  (red)
└─────────────────────────────┘
```

## Security Considerations

1. **Prevent negative balances**: Check before sending
2. **Validate recipient exists**: Look up by email
3. **Transaction atomicity**: Both records must succeed
4. **Rate limiting**: Prevent spam sending
5. **Fraud detection**: Flag unusual patterns

## Questions to Answer

1. **Should there be a fee?** (e.g., 2% fee on P2P transfers)
2. **Transaction limits?** (max $1000 per transaction?)
3. **Daily limits?** (max $5000 per day?)
4. **Require confirmation?** (recipient must accept?)
5. **Allow requests?** (user can request money from another user?)

## Next Steps

Let me know if you want to implement this! I can:
1. Run the SQL to add the columns
2. Create the send/receive money pages
3. Update transaction display logic
4. Test the full flow

Would you like me to proceed with implementation?

# P2P Transfer Setup Guide

## Overview

The peer-to-peer (P2P) money transfer feature allows users to send money to each other with configurable limits. This guide explains how to set it up and use it.

## Setup Steps

### 1. Run the Database Migration

Open Supabase SQL Editor and run the migration script:

```bash
# In Supabase Dashboard:
SQL Editor → New Query → Paste contents of ADD_P2P_FEATURES.sql → Run
```

This will:
- ✅ Add `transaction_type` column to transactions table
- ✅ Add `recipient_user_id` column to transactions table
- ✅ Create `user_settings` table with limits
- ✅ Set up RLS policies for user_settings
- ✅ Create triggers for auto-generating default settings
- ✅ Initialize default limits for existing users

### 2. Verify the Migration

Run these verification queries in Supabase SQL Editor:

```sql
-- Check that columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'transactions'
AND column_name IN ('transaction_type', 'recipient_user_id');

-- Check user_settings table exists
SELECT * FROM user_settings LIMIT 5;

-- Check that all users have settings
SELECT u.name, us.transaction_limit, us.daily_limit
FROM users u
LEFT JOIN user_settings us ON us.user_id = u.id;
```

### 3. Clear Browser Cache (Optional)

If you're testing immediately after deploying, clear your browser cache or do a hard refresh:
- **Chrome/Edge**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Safari**: Cmd+Option+R

## Features

### 1. Send Money

Users can send money in two ways:

**Option A: By Email**
1. Click "Send Money" from dashboard
2. Enter recipient's email address
3. Enter amount
4. Confirm and send

**Option B: By QR Code**
1. Click "Scan QR Code to Pay" from dashboard
2. Scan recipient's receive QR code
3. Amount input is pre-focused
4. Enter amount and confirm

### 2. Receive Money

1. Click "Receive Money" from dashboard
2. Show your QR code to the sender
3. They scan it and enter the amount
4. You'll receive a notification and see the money in your balance

### 3. Transaction History

The transaction list now shows three types:
- 💳 **Payments** to merchants (red, negative)
- ↗ **Sent** money to users (red, negative)
- ↙ **Received** money from users (green, positive)

### 4. Configurable Limits

Users can change their transfer limits:

**Default Limits:**
- $500 per transaction
- $1,000 per day

**To Change Limits:**
1. Go to User Dashboard
2. Navigate to Settings (you'll need to add a settings button)
3. Adjust limits as needed
4. Save changes

## Security Features

### 1. Balance Validation
- Cannot send more than current balance
- Real-time balance checking

### 2. Transaction Limits
- Per-transaction limit prevents large unauthorized transfers
- Daily limit prevents excessive sending in one day

### 3. Recipient Verification
- Email validation ensures recipient exists
- Cannot send to yourself

### 4. Atomic Transactions
- Both debit and credit happen together
- If one fails, both are rolled back

## API Functions

### getUserSettings(userId)
Retrieves user's transfer limits.

```javascript
const settings = await getUserSettings(userId);
// Returns: { transaction_limit: 500, daily_limit: 1000 }
```

### updateUserSettings(userId, transactionLimit, dailyLimit)
Updates user's transfer limits.

```javascript
const result = await updateUserSettings(userId, 750, 2000);
// Returns: { success: true, data: {...} }
```

### findUserByEmail(email)
Finds a user by their email address.

```javascript
const user = await findUserByEmail('recipient@email.com');
// Returns: { id, name, email } or null
```

### sendMoneyToUser(senderId, recipientId, amount)
Executes a P2P transfer.

```javascript
const result = await sendMoneyToUser(senderId, recipientId, 50);
if (result.success) {
    console.log(`Sent to ${result.recipient}`);
}
```

## Testing

### Test Scenario 1: Send by Email

1. Create two user accounts (User A and User B)
2. Login as User A
3. Click "Send Money"
4. Enter User B's email
5. Enter $25
6. Confirm
7. Check User A's balance decreased by $25
8. Login as User B
9. Check User B's balance increased by $25
10. Verify both see the transaction in history

### Test Scenario 2: Send by QR Code

1. Login as User B
2. Click "Receive Money"
3. Keep QR code visible
4. Login as User A (in another tab or device)
5. Click "Scan QR Code to Pay"
6. Scan User B's QR code
7. Enter amount and confirm
8. Verify transaction completes

### Test Scenario 3: Limit Enforcement

1. Login as User A
2. Try to send $600 (exceeds $500 limit)
3. Should see error: "Transaction limit exceeded"
4. Send $500 successfully
5. Try to send another $600
6. Should see error: "Daily limit exceeded"

### Test Scenario 4: Transaction History

1. Login as User A
2. View transaction history
3. Should see:
   - ↗ Sent to User B -$25.00 (red)
   - ↙ Received from User C +$50.00 (green)
   - 💳 Coffee Shop -$5.50 (red)

## Troubleshooting

### Issue: "Recipient not found"
**Cause**: Email address doesn't match any user account
**Solution**: Verify email is correct and user has registered

### Issue: "Transaction limit exceeded"
**Cause**: Amount exceeds per-transaction limit
**Solution**: Lower amount or adjust limits in settings

### Issue: "Daily limit exceeded"
**Cause**: Total sent today exceeds daily limit
**Solution**: Wait until tomorrow or adjust daily limit

### Issue: "Insufficient balance"
**Cause**: Sender doesn't have enough money
**Solution**: Add money to account first

### Issue: Transaction history not updating
**Cause**: Browser cache or page needs refresh
**Solution**: Refresh the page or navigate away and back

## Database Schema Reference

### transactions table (updated)
```sql
- transaction_type: 'payment' | 'send' | 'receive'
- recipient_user_id: UUID (nullable, for P2P transfers)
```

### user_settings table (new)
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- transaction_limit: NUMERIC (default 500.00)
- daily_limit: NUMERIC (default 1000.00)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Next Steps

### Optional Enhancements

1. **Add Settings Button to Dashboard**
   ```html
   <button onclick="navigateTo('user-settings')">Settings</button>
   ```

2. **Request Money Feature**
   - Allow users to request specific amounts
   - Recipient gets notification to approve/decline

3. **Transaction Notes**
   - Add optional memo field
   - "Lunch money", "Rent", etc.

4. **Push Notifications**
   - Alert when money is received
   - Alert when daily limit is approaching

5. **Transfer History Filters**
   - Filter by type (sent/received/payments)
   - Filter by date range
   - Search by recipient name

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify database migration completed successfully
3. Check Supabase logs for RLS policy errors
4. Review transaction records in Supabase dashboard

For questions or issues, refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

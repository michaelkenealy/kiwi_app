# Database Schema for Kiwi Payment App

## Overview
This document outlines the complete database schema for the QR payment application using Supabase.

---

## Tables to Create in Supabase

### 1. users (New Table)
**Purpose**: Store user account information

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    balance NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only read/update their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = auth_id);
```

---

### 2. vendors (Existing Table - Add Column)
**Purpose**: Store merchant/vendor information

**Existing Columns**:
- id (uuid)
- created_at (timestamp with time zone)
- name (text)
- auth_id (uuid)

**New Columns to Add**:
```sql
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable Row Level Security if not already enabled
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Policies: Vendors can only manage their own data
CREATE POLICY "Vendors can view own data" ON vendors
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Vendors can update own data" ON vendors
    FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Vendors can insert own data" ON vendors
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Allow users to view vendor public info when making payments
CREATE POLICY "Users can view vendor public info" ON vendors
    FOR SELECT USING (true);
```

---

### 3. tills (New Table)
**Purpose**: Store individual tills/registers for each merchant

```sql
CREATE TABLE tills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    till_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tills ENABLE ROW LEVEL SECURITY;

-- Policies: Vendors can only manage their own tills
CREATE POLICY "Vendors can manage own tills" ON tills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = tills.vendor_id
            AND vendors.auth_id = auth.uid()
        )
    );

-- Index for faster queries
CREATE INDEX idx_tills_vendor_id ON tills(vendor_id);
```

---

### 4. transactions (Existing Table - Add Columns)
**Purpose**: Store payment transactions

**Existing Columns**:
- id (uuid)
- created_at (timestamp with time zone)
- vendor_id (uuid)
- amount (numeric)
- payer_name (text)
- peer_session_id (text)
- unique_code (text)

**New Columns to Add**:
```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS till_id UUID REFERENCES tills(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed'));
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable Row Level Security if not already enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() IN (
        SELECT auth_id FROM users WHERE id = transactions.user_id
    ));

-- Vendors can view transactions for their tills
CREATE POLICY "Vendors can view own till transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vendors v
            JOIN tills t ON t.vendor_id = v.id
            WHERE v.auth_id = auth.uid()
            AND t.id = transactions.till_id
        )
    );

-- Allow insertion of transactions (will be validated by application logic)
CREATE POLICY "Allow transaction creation" ON transactions
    FOR INSERT WITH CHECK (true);

-- Allow updates to transaction status
CREATE POLICY "Allow transaction updates" ON transactions
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE id = transactions.user_id
        ) OR EXISTS (
            SELECT 1 FROM vendors v
            JOIN tills t ON t.vendor_id = v.id
            WHERE v.auth_id = auth.uid()
            AND t.id = transactions.till_id
        )
    );

-- Indexes for faster queries
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_till_id ON transactions(till_id);
CREATE INDEX idx_transactions_vendor_id ON transactions(vendor_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_unique_code ON transactions(unique_code);
```

---

### 5. payment_sessions (New Table)
**Purpose**: Store temporary payment session data for QR code scanning

```sql
CREATE TABLE payment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_code TEXT UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    till_id UUID REFERENCES tills(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scanned', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 minutes'
);

-- Enable Row Level Security
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read sessions (needed for QR scanning)
CREATE POLICY "Anyone can read payment sessions" ON payment_sessions
    FOR SELECT USING (true);

-- Vendors can create sessions for their tills
CREATE POLICY "Vendors can create payment sessions" ON payment_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = payment_sessions.vendor_id
            AND vendors.auth_id = auth.uid()
        )
    );

-- Allow updates to session status
CREATE POLICY "Allow payment session updates" ON payment_sessions
    FOR UPDATE USING (true);

-- Index for faster lookups
CREATE INDEX idx_payment_sessions_code ON payment_sessions(session_code);
CREATE INDEX idx_payment_sessions_status ON payment_sessions(status);

-- Auto-delete expired sessions (optional - requires pg_cron extension)
-- DELETE FROM payment_sessions WHERE expires_at < NOW() AND status = 'pending';
```

---

## Functions and Triggers

### Auto-update timestamp trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tills_updated_at BEFORE UPDATE ON tills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Realtime Subscriptions

Enable realtime for tables that need live updates:

```sql
-- Enable realtime for payment sessions (for merchant confirmation)
ALTER PUBLICATION supabase_realtime ADD TABLE payment_sessions;

-- Enable realtime for transactions (for user/merchant confirmations)
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
```

---

## Summary of Changes

### Tables You Already Have:
1. **transactions** - Add 4 new columns: user_id, till_id, status, updated_at
2. **vendors** - Add 3 new columns: logo_url, description, updated_at

### New Tables to Create:
1. **users** - User accounts with balance
2. **tills** - Merchant tills/registers
3. **payment_sessions** - Temporary QR payment sessions

---

## Setup Instructions

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste each SQL block above
4. Run them in order (users → vendors updates → tills → transactions updates → payment_sessions → functions → realtime)
5. Verify all tables are created in the Table Editor
6. Enable Realtime in the Database → Replication settings

---

## Notes

- All monetary values use `NUMERIC(10, 2)` for precision
- Row Level Security (RLS) is enabled on all tables for security
- Indexes are added for commonly queried fields
- Sessions expire after 10 minutes automatically
- Realtime subscriptions allow instant payment confirmations

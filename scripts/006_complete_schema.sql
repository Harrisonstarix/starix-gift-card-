-- Complete schema updates for full tracking

-- Add deposits table if not exists
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount_usd NUMERIC NOT NULL,
  deposit_coin TEXT NOT NULL,
  deposit_network TEXT NOT NULL,
  deposit_amount NUMERIC NOT NULL,
  shift_id TEXT NOT NULL,
  quote_id TEXT,
  deposit_address TEXT NOT NULL,
  deposit_memo TEXT,
  refund_address TEXT,
  status TEXT DEFAULT 'pending',
  tx_hash TEXT,
  settled_amount NUMERIC,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_balances table if not exists
CREATE TABLE IF NOT EXISTS user_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance_usd NUMERIC DEFAULT 0,
  total_deposited NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add balance_transactions table if not exists
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'deposit', 'purchase', 'underpayment_credit', 'refund', 'admin_adjustment'
  amount NUMERIC NOT NULL,
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT,
  reference_id TEXT,
  crypto_amount NUMERIC,
  crypto_coin TEXT,
  crypto_network TEXT,
  shift_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to gift_cards
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS total_paid NUMERIC;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS platform_fee NUMERIC;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS secret_code TEXT;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS redeemed_tx_hash TEXT;

-- Add missing columns to redemptions
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS treasury_tx_hash TEXT;
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS treasury_send_status TEXT;

-- Add missing columns to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tx_hash TEXT;

-- Add RLS policies
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;

-- Deposits policies
DROP POLICY IF EXISTS "Users can view own deposits" ON deposits;
CREATE POLICY "Users can view own deposits" ON deposits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create deposits" ON deposits;
CREATE POLICY "Users can create deposits" ON deposits FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update deposits" ON deposits;
CREATE POLICY "System can update deposits" ON deposits FOR UPDATE USING (true);

-- User balances policies
DROP POLICY IF EXISTS "Users can view own balance" ON user_balances;
CREATE POLICY "Users can view own balance" ON user_balances FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage balances" ON user_balances;
CREATE POLICY "System can manage balances" ON user_balances FOR ALL USING (true);

-- Balance transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON balance_transactions;
CREATE POLICY "Users can view own transactions" ON balance_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert transactions" ON balance_transactions;
CREATE POLICY "System can insert transactions" ON balance_transactions FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_shift_id ON deposits(shift_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_secret_code ON gift_cards(secret_code);
CREATE INDEX IF NOT EXISTS idx_redemptions_shift_id ON redemptions(shift_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sideshift_id ON transactions(sideshift_id);

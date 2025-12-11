-- User balances table for storing deposits and underpayments
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_deposited DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Balance transactions for tracking all balance changes
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'purchase', 'refund', 'underpayment_credit', 'admin_adjustment')),
  amount DECIMAL(12, 2) NOT NULL,
  balance_before DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  description TEXT,
  reference_id TEXT, -- Gift card ID, shift ID, etc.
  crypto_amount DECIMAL(18, 8),
  crypto_coin TEXT,
  crypto_network TEXT,
  shift_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_balances
CREATE POLICY "Users can view own balance" ON user_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage balances" ON user_balances
  FOR ALL USING (true);

-- RLS policies for balance_transactions  
CREATE POLICY "Users can view own transactions" ON balance_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON balance_transactions
  FOR INSERT WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created_at ON balance_transactions(created_at DESC);

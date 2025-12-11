-- Create deposits table for tracking user deposits to platform balance
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(12, 2) NOT NULL,
  deposit_coin VARCHAR(20) NOT NULL,
  deposit_network VARCHAR(50) NOT NULL,
  deposit_amount DECIMAL(20, 8) NOT NULL,
  settled_amount DECIMAL(12, 2),
  shift_id VARCHAR(100) UNIQUE,
  quote_id VARCHAR(100),
  deposit_address TEXT,
  deposit_memo TEXT,
  refund_address TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'refunded', 'failed')),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_shift_id ON deposits(shift_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

-- Add RLS policies
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposits
CREATE POLICY "Users can view own deposits" ON deposits
  FOR SELECT USING (auth.uid() = user_id);

-- Only server can insert/update deposits
CREATE POLICY "Service role can manage deposits" ON deposits
  FOR ALL USING (true);

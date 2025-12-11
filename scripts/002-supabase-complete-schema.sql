-- ============================================================
-- COMPLETE SUPABASE SCHEMA FOR CRYPTO GIFT CARDS
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USER PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMIN SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMIN WALLETS TABLE (for receiving & sending crypto)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coin TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coin, network)
);

-- ============================================================
-- ENABLED COINS TABLE (admin controls which coins are available)
-- ============================================================
CREATE TABLE IF NOT EXISTS enabled_coins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coin TEXT NOT NULL,
  network TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  icon_url TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  for_purchase BOOLEAN DEFAULT TRUE,
  for_redemption BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coin, network)
);

-- ============================================================
-- GIFT CARDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  value_usd DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'redeemed', 'expired', 'cancelled')),
  
  -- Buyer info
  buyer_id UUID REFERENCES auth.users(id),
  buyer_email TEXT,
  
  -- Recipient info
  recipient_name TEXT,
  recipient_email TEXT,
  sender_name TEXT,
  message TEXT,
  
  -- Design
  design_variant TEXT DEFAULT 'obsidian',
  
  -- Purchase payment info
  purchase_coin TEXT,
  purchase_network TEXT,
  purchase_amount DECIMAL(18, 8),
  purchase_shift_id TEXT,
  purchase_tx_hash TEXT,
  
  -- Redemption info
  redeemed_by_id UUID REFERENCES auth.users(id),
  redeemed_coin TEXT,
  redeemed_network TEXT,
  redeemed_address TEXT,
  redeemed_memo TEXT,
  redeemed_amount DECIMAL(18, 8),
  redeemed_shift_id TEXT,
  redeemed_tx_hash TEXT,
  redeemed_at TIMESTAMPTZ,
  
  -- Timestamps
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_card_id UUID REFERENCES gift_cards(id),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'redemption')),
  
  -- SideShift info
  sideshift_id TEXT,
  sideshift_type TEXT,
  quote_id TEXT,
  
  -- Deposit info (what user sends)
  deposit_coin TEXT,
  deposit_network TEXT,
  deposit_address TEXT,
  deposit_memo TEXT,
  deposit_amount DECIMAL(18, 8),
  deposit_tx_hash TEXT,
  
  -- Settle info (what recipient gets)
  settle_coin TEXT,
  settle_network TEXT,
  settle_address TEXT,
  settle_memo TEXT,
  settle_amount DECIMAL(18, 8),
  settle_tx_hash TEXT,
  
  value_usd DECIMAL(10, 2),
  status TEXT DEFAULT 'waiting',
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REDEMPTION REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS redemption_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_card_id UUID REFERENCES gift_cards(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- User's desired payout
  settle_coin TEXT NOT NULL,
  settle_network TEXT NOT NULL,
  settle_address TEXT NOT NULL,
  settle_memo TEXT,
  estimated_amount DECIMAL(18, 8),
  
  -- Quote info
  quote_id TEXT,
  shift_id TEXT,
  deposit_address TEXT,
  deposit_amount DECIMAL(18, 8),
  deposit_coin TEXT,
  deposit_network TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'processing', 'completed', 'failed', 'expired')),
  
  -- Processing info
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  tx_hash TEXT,
  actual_amount DECIMAL(18, 8),
  error_message TEXT,
  
  quoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_buyer_id ON gift_cards(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_gift_card_id ON transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sideshift_id ON transactions(sideshift_id);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_gift_card_id ON redemption_requests(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_status ON redemption_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE enabled_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admin settings - only admins can access
CREATE POLICY "Admins can manage settings" ON admin_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Admin wallets - only admins can access
CREATE POLICY "Admins can manage wallets" ON admin_wallets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Enabled coins - anyone can read, admins can manage
CREATE POLICY "Anyone can view enabled coins" ON enabled_coins FOR SELECT USING (true);
CREATE POLICY "Admins can manage enabled coins" ON enabled_coins FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Gift cards - users see their own, admins see all
CREATE POLICY "Users can view own gift cards" ON gift_cards FOR SELECT USING (
  buyer_id = auth.uid() OR 
  redeemed_by_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Anyone can create gift cards" ON gift_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update gift cards" ON gift_cards FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Transactions - users see their own, admins see all
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (
  gift_card_id IN (SELECT id FROM gift_cards WHERE buyer_id = auth.uid() OR redeemed_by_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Anyone can create transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update transactions" ON transactions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Redemption requests
CREATE POLICY "Users can view own redemption requests" ON redemption_requests FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Anyone can create redemption requests" ON redemption_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update redemption requests" ON redemption_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Audit log - admins only
CREATE POLICY "Admins can view audit log" ON audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Anyone can insert audit log" ON audit_log FOR INSERT WITH CHECK (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    -- Auto-promote specific admin email
    CASE WHEN NEW.email = 'ighanghangodspower@gmail.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_wallets_updated_at BEFORE UPDATE ON admin_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enabled_coins_updated_at BEFORE UPDATE ON enabled_coins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON gift_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_redemption_requests_updated_at BEFORE UPDATE ON redemption_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Insert default settings
INSERT INTO admin_settings (key, value) VALUES
  ('gift_card_expiry_days', '365'),
  ('min_gift_card_value', '10'),
  ('max_gift_card_value', '10000'),
  ('auto_process_redemptions', 'false'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- Insert some default enabled coins
INSERT INTO enabled_coins (coin, network, name, symbol, icon_url, sort_order) VALUES
  ('btc', 'bitcoin', 'Bitcoin', 'BTC', 'https://sideshift.ai/api/v2/coins/icon/btc', 1),
  ('eth', 'ethereum', 'Ethereum', 'ETH', 'https://sideshift.ai/api/v2/coins/icon/eth', 2),
  ('usdt', 'tron', 'Tether (TRC20)', 'USDT', 'https://sideshift.ai/api/v2/coins/icon/usdt-tron', 3),
  ('usdc', 'ethereum', 'USD Coin', 'USDC', 'https://sideshift.ai/api/v2/coins/icon/usdc-ethereum', 4),
  ('sol', 'solana', 'Solana', 'SOL', 'https://sideshift.ai/api/v2/coins/icon/sol', 5),
  ('ltc', 'litecoin', 'Litecoin', 'LTC', 'https://sideshift.ai/api/v2/coins/icon/ltc', 6),
  ('doge', 'dogecoin', 'Dogecoin', 'DOGE', 'https://sideshift.ai/api/v2/coins/icon/doge', 7),
  ('xrp', 'ripple', 'XRP', 'XRP', 'https://sideshift.ai/api/v2/coins/icon/xrp', 8),
  ('trx', 'tron', 'Tron', 'TRX', 'https://sideshift.ai/api/v2/coins/icon/trx', 9),
  ('bnb', 'bsc', 'BNB', 'BNB', 'https://sideshift.ai/api/v2/coins/icon/bnb-bsc', 10)
ON CONFLICT (coin, network) DO NOTHING;

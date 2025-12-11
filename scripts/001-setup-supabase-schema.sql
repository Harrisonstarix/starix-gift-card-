-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-promote admin user
CREATE OR REPLACE FUNCTION promote_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'ighanghangodspower@gmail.com' THEN
    NEW.is_admin := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_promote_admin
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION promote_admin_user();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email = 'ighanghangodspower@gmail.com'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Gift cards table
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  value_usd DECIMAL(10,2) NOT NULL,
  design TEXT NOT NULL DEFAULT 'obsidian',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'redeemed', 'expired', 'cancelled')),
  recipient_name TEXT,
  recipient_email TEXT,
  sender_name TEXT,
  message TEXT,
  
  -- Payment details
  payment_crypto TEXT,
  payment_network TEXT,
  payment_amount DECIMAL(20,10),
  payment_shift_id TEXT,
  payment_deposit_address TEXT,
  payment_deposit_memo TEXT,
  payment_quote_id TEXT,
  payment_tx_hash TEXT,
  
  -- Redemption details
  redeemed_crypto TEXT,
  redeemed_amount DECIMAL(20,10),
  redeemed_address TEXT,
  redeemed_tx_hash TEXT,
  redeemed_at TIMESTAMPTZ,
  
  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year')
);

-- Redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  gift_card_code TEXT NOT NULL,
  value_usd DECIMAL(10,2) NOT NULL,
  
  -- What user wants
  settle_coin TEXT NOT NULL,
  settle_network TEXT NOT NULL,
  settle_address TEXT NOT NULL,
  settle_memo TEXT,
  estimated_amount DECIMAL(20,10),
  
  -- SideShift details
  quote_id TEXT,
  shift_id TEXT,
  deposit_coin TEXT,
  deposit_network TEXT,
  deposit_address TEXT,
  deposit_amount DECIMAL(20,10),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  
  -- Result
  actual_amount DECIMAL(20,10),
  settle_tx_hash TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Admin wallets table
CREATE TABLE IF NOT EXISTS admin_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset, network)
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions log
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'redemption')),
  gift_card_id UUID REFERENCES gift_cards(id),
  sideshift_id TEXT,
  quote_id TEXT,
  
  deposit_coin TEXT,
  deposit_network TEXT,
  deposit_amount DECIMAL(20,10),
  
  settle_coin TEXT,
  settle_network TEXT,
  settle_amount DECIMAL(20,10),
  
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Gift cards policies
CREATE POLICY "Anyone can view active gift cards by code" ON gift_cards
  FOR SELECT USING (status IN ('active', 'pending'));

CREATE POLICY "Authenticated users can create gift cards" ON gift_cards
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own gift cards" ON gift_cards
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can view all gift cards" ON gift_cards
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update gift cards" ON gift_cards
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Redemptions policies
CREATE POLICY "Anyone can create redemptions" ON redemptions
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all redemptions" ON redemptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update redemptions" ON redemptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Admin wallets policies (admin only)
CREATE POLICY "Admins can manage wallets" ON admin_wallets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Admin settings policies (admin only)
CREATE POLICY "Admins can manage settings" ON admin_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Transactions policies
CREATE POLICY "Admins can view transactions" ON transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "System can insert transactions" ON transactions
  FOR INSERT WITH CHECK (TRUE);

-- Audit log policies
CREATE POLICY "Admins can view audit log" ON audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "System can insert audit log" ON audit_log
  FOR INSERT WITH CHECK (TRUE);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_created_by ON gift_cards(created_by);
CREATE INDEX IF NOT EXISTS idx_redemptions_gift_card_id ON redemptions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_gift_card_id ON transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
